import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client'; // Ajusta la ruta si es necesario

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalUSD, paymentMethod, customerId, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    const cleanCustomerId = customerId ? Number(customerId) : null;
    const cleanTotalUSD = Number(totalUSD) || 0;
    const cleanPaymentMethod = paymentMethod ? String(paymentMethod) : 'Efectivo';

    // Ejecutamos todo el flujo de inserción de forma segura cerrando la conexión al terminar
    const saleId = await runQuery(async (db) => {
      // 1. Insertar la venta principal
      const saleQuery = `
        INSERT INTO sales (customer_id, total_usd, payment_method) 
        VALUES (${cleanCustomerId === null ? 'NULL' : cleanCustomerId}, ${cleanTotalUSD}, '${cleanPaymentMethod}')
      `;
      
      await db.sql(saleQuery);

      // 2. Obtener el ID de la venta recién insertada
      const idResult: any = await db.sql("SELECT last_insert_rowid() as id;");
      
      let generatedSaleId = 0;
      if (idResult) {
        if (Array.isArray(idResult) && idResult.length > 0) {
          generatedSaleId = Number(idResult[0].id || idResult[0][0] || 0);
        } else if (typeof idResult === 'object') {
          generatedSaleId = Number(idResult.id || 0);
        }
      }

      // 3. Insertar los items de la venta
      if (generatedSaleId > 0 && items.length > 0) {
        for (const item of items) {
          const prodId = Number(item.id || item.product_id || 0);
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price || item.price_at_sale) || 0;

          const itemQuery = `
            INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) 
            VALUES (${generatedSaleId}, ${prodId}, ${qty}, ${price})
          `;
          await db.sql(itemQuery);
        }
      }

      return generatedSaleId;
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Venta guardada exitosamente', 
      saleId 
    });

  } catch (error: any) {
    console.error('Error detallado en POST /api/sales:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la venta en la base de datos' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sales = await runQuery(async (db) => {
      return await db.sql("SELECT id, customer_id, total_usd, payment_method, created_at FROM sales ORDER BY id DESC");
    });
    
    return NextResponse.json(sales, { status: 200 });
  } catch (error: any) {
    console.error('Error en GET /api/sales:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al obtener las ventas' }, { status: 500 });
  }
}
