import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

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

    console.log('==============================');
    console.log('NUEVA VENTA');
    console.log('BODY:', body);
    console.log('==============================');

    // =====================================================
    // 1. VALIDAR CARRITO
    // =====================================================

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El carrito está vacío.',
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
      paymentMethod &&
      String(paymentMethod).trim()
        ? String(paymentMethod).trim()
        : 'Efectivo';

    if (cleanTotalUSD <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El total de la venta debe ser mayor que 0.',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. PROCESAR TODO EN LA MISMA CONEXIÓN
    // =====================================================

    const saleId = await runQuery(async (db) => {

      // ===================================================
      // 2.1 BUSCAR CAJAS ABIERTAS
      // ===================================================

      const registerResult: any = await db.sql(`
        SELECT
          id,
          user_id,
          opening_date,
          opening_usd,
          opening_ves,
          status
        FROM cash_registers
        WHERE LOWER(TRIM(status)) = 'open'
        ORDER BY id DESC
        LIMIT 1;
      `);

      console.log(
        'RESULTADO CAJA:',
        registerResult
      );

      // ===================================================
      // NORMALIZAR RESULTADO SQLITE CLOUD
      // ===================================================

      let registerRows: any[] = [];

      if (Array.isArray(registerResult)) {
        registerRows = registerResult;
      } else if (
        registerResult &&
        Array.isArray(registerResult.rows)
      ) {
        registerRows = registerResult.rows;
      } else if (
        registerResult &&
        Array.isArray(registerResult.data)
      ) {
        registerRows = registerResult.data;
      }

      console.log(
        'CAJAS ENCONTRADAS:',
        registerRows.length
      );

      console.log(
        'CAJAS:',
        registerRows
      );

      // ===================================================
      // NO HAY CAJA
      // ===================================================

      if (registerRows.length === 0) {
        throw new Error(
          'No hay una caja abierta. Debe abrir una caja antes de registrar ventas.'
        );
      }

      // ===================================================
      // IDENTIFICAR CAJA
      // ===================================================

      const openRegister = registerRows[0];

      const cashRegisterId = Number(
        openRegister.id
      );

      if (!cashRegisterId) {
        throw new Error(
          'La caja abierta no tiene un ID válido.'
        );
      }

      console.log(
        'CAJA UTILIZADA:',
        cashRegisterId
      );

      // ===================================================
      // 2.2 CREAR VENTA
      // ===================================================

      await db.sql(
        `
        INSERT INTO sales (
          customer_id,
          total_usd,
          total_ves,
          exchange_rate,
          payment_method,
          cash_register_id
        )
        VALUES (?, ?, ?, ?, ?, ?);
        `,
        [
          cleanCustomerId,
          cleanTotalUSD,
          cleanTotalBs,
          cleanExchangeRate,
          cleanPaymentMethod,
          cashRegisterId,
        ]
      );

      // ===================================================
      // 2.3 OBTENER ID DE LA VENTA
      // ===================================================

      const idResult: any = await db.sql(`
        SELECT last_insert_rowid() AS id;
      `);

      console.log(
        'RESULTADO ID VENTA:',
        idResult
      );

      let generatedSaleId = 0;

      let idRows: any[] = [];

      if (Array.isArray(idResult)) {
        idRows = idResult;
      } else if (
        idResult &&
        Array.isArray(idResult.rows)
      ) {
        idRows = idResult.rows;
      } else if (
        idResult &&
        Array.isArray(idResult.data)
      ) {
        idRows = idResult.data;
      }

      if (idRows.length > 0) {
        generatedSaleId = Number(
          idRows[0]?.id ??
          idRows[0]?.ID ??
          idRows[0]?.[0] ??
          0
        );
      }

      if (!generatedSaleId) {
        throw new Error(
          'No se pudo obtener el ID de la venta creada.'
        );
      }

      console.log(
        'ID VENTA:',
        generatedSaleId
      );

      // ===================================================
      // 2.4 INSERTAR PRODUCTOS
      // ===================================================

      for (const item of items) {

        const prodId = Number(
          item.id ??
          item.product_id ??
          0
        );

        const qty = Number(
          item.quantity
        ) || 1;

        const price = Number(
          item.price ??
          item.price_at_sale ??
          0
        );

        if (!prodId) {
          throw new Error(
            'Uno de los productos no tiene un ID válido.'
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

        console.log(
          'PRODUCTO INSERTADO:',
          {
            saleId: generatedSaleId,
            productId: prodId,
            quantity: qty,
            price,
          }
        );
      }

      return generatedSaleId;
    });

    // =====================================================
    // 3. RESPUESTA EXITOSA
    // =====================================================

    console.log(
      'VENTA COMPLETADA:',
      saleId
    );

    return NextResponse.json({
      success: true,
      message: 'Venta guardada exitosamente.',
      saleId,
    });

  } catch (error: any) {

    console.error(
      '===================================='
    );

    console.error(
      'ERROR POST /api/sales'
    );

    console.error(error);

    console.error(
      '===================================='
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al procesar la venta en la base de datos.',
      },
      { status: 500 }
    );
  }
}

// ========================================================
// GET - LISTAR VENTAS
// ========================================================

export async function GET() {
  try {

    const result = await runQuery(async (db) => {
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

    return NextResponse.json(
      result,
      { status: 200 }
    );

  } catch (error: any) {

    console.error(
      'ERROR GET /api/sales:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al obtener las ventas.',
      },
      { status: 500 }
    );
  }
}
