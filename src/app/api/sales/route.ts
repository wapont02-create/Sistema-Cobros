import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      customerId,
      items,
    } = body;

    // --------------------------------------------------
    // 1. VALIDACIONES BÁSICAS
    // --------------------------------------------------

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El carrito está vacío',
        },
        { status: 400 }
      );
    }

    const cleanTotalUSD = Number(totalUSD) || 0;
    const cleanTotalBs = Number(totalBs) || 0;
    const cleanExchangeRate = Number(exchangeRate) || 0;

    const cleanCustomerId =
      customerId !== null &&
      customerId !== undefined &&
      customerId !== ''
        ? Number(customerId)
        : null;

    const cleanPaymentMethod =
      paymentMethod && String(paymentMethod).trim()
        ? String(paymentMethod).trim()
        : 'Efectivo';

    if (cleanTotalUSD <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El total de la venta debe ser mayor que 0',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. TODO EL PROCESO DENTRO DE runQuery
    // --------------------------------------------------

    const saleId = await runQuery(async (db) => {
      // ------------------------------------------------
      // 2.1 BUSCAR LA CAJA ABIERTA
      // ------------------------------------------------

      const registerResult: any = await db.sql(`
        SELECT id
        FROM cash_registers
        WHERE status = 'open'
        ORDER BY id DESC
        LIMIT 1;
      `);

      const registerRows = Array.isArray(registerResult)
        ? registerResult
        : registerResult?.rows || [];

      if (!registerRows || registerRows.length === 0) {
        throw new Error(
          'No hay una caja abierta. Debe abrir una caja antes de registrar ventas.'
        );
      }

      const openRegister = registerRows[0];

      const cashRegisterId = Number(openRegister.id);

      if (!cashRegisterId) {
        throw new Error(
          'No se pudo identificar correctamente la caja abierta.'
        );
      }

      // ------------------------------------------------
      // 2.2 INSERTAR LA VENTA
      // ------------------------------------------------

      let saleQuery: string;
      let saleParams: any[];

      if (cleanCustomerId === null) {
        saleQuery = `
          INSERT INTO sales (
            customer_id,
            total_usd,
            total_ves,
            exchange_rate,
            payment_method,
            cash_register_id
          )
          VALUES (?, ?, ?, ?, ?, ?);
        `;

        saleParams = [
          null,
          cleanTotalUSD,
          cleanTotalBs,
          cleanExchangeRate,
          cleanPaymentMethod,
          cashRegisterId,
        ];
      } else {
        saleQuery = `
          INSERT INTO sales (
            customer_id,
            total_usd,
            total_ves,
            exchange_rate,
            payment_method,
            cash_register_id
          )
          VALUES (?, ?, ?, ?, ?, ?);
        `;

        saleParams = [
          cleanCustomerId,
          cleanTotalUSD,
          cleanTotalBs,
          cleanExchangeRate,
          cleanPaymentMethod,
          cashRegisterId,
        ];
      }

      await db.sql(saleQuery, saleParams);

      // ------------------------------------------------
      // 2.3 OBTENER ID DE LA VENTA
      // ------------------------------------------------

      const idResult: any = await db.sql(
        `SELECT last_insert_rowid() AS id;`
      );

      let generatedSaleId = 0;

      if (Array.isArray(idResult) && idResult.length > 0) {
        generatedSaleId = Number(
          idResult[0]?.id ??
          idResult[0]?.ID ??
          idResult[0]?.[0] ??
          0
        );
      } else if (idResult?.rows && idResult.rows.length > 0) {
        generatedSaleId = Number(
          idResult.rows[0]?.id ??
          idResult.rows[0]?.ID ??
          idResult.rows[0]?.[0] ??
          0
        );
      } else if (idResult && typeof idResult === 'object') {
        generatedSaleId = Number(idResult.id || 0);
      }

      if (!generatedSaleId) {
        throw new Error(
          'No se pudo obtener el ID de la venta creada.'
        );
      }

      // ------------------------------------------------
      // 2.4 INSERTAR LOS PRODUCTOS
      // ------------------------------------------------

      for (const item of items) {
        const prodId = Number(
          item.id ??
          item.product_id ??
          0
        );

        const qty = Number(item.quantity) || 1;

        const price = Number(
          item.price ??
          item.price_at_sale ??
          0
        );

        if (!prodId) {
          throw new Error(
            'Uno de los productos de la venta no tiene un ID válido.'
          );
        }

        if (qty <= 0) {
          throw new Error(
            `Cantidad inválida para el producto ${prodId}.`
          );
        }

        if (price < 0) {
          throw new Error(
            `Precio inválido para el producto ${prodId}.`
          );
        }

        await db.sql(
          `
            INSERT INTO sale_items (
              sale_id,
              product_id,
              quantity,
              price_at_sale
            )
            VALUES (?, ?, ?, ?);
          `,
          [
            generatedSaleId,
            prodId,
            qty,
            price,
          ]
        );
      }

      return generatedSaleId;
    });

    // --------------------------------------------------
    // 3. RESPUESTA
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: 'Venta guardada exitosamente',
      saleId,
    });

  } catch (error: any) {
    console.error(
      'Error detallado en POST /api/sales:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al procesar la venta en la base de datos',
      },
      { status: 500 }
    );
  }
}

// ======================================================
// GET - LISTAR VENTAS
// ======================================================

export async function GET() {
  try {
    const sales = await runQuery(async (db) => {
      return await db.sql(`
        SELECT
          s.id,
          s.customer_id,
          s.total_usd,
          s.total_ves,
          s.exchange_rate,
          s.payment_method,
          s.cash_register_id,
          s.created_at
        FROM sales s
        ORDER BY s.id DESC;
      `);
    });

    return NextResponse.json(sales, {
      status: 200,
    });

  } catch (error: any) {
    console.error(
      'Error en GET /api/sales:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al obtener las ventas',
      },
      { status: 500 }
    );
  }
}
