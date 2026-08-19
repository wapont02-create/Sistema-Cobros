import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

const connectionString = process.env.DATABASE_URL || '';

export async function POST(request: Request) {
  let db;
  try {
    const body = await request.json();
    const { totalUSD, paymentMethod, customerId, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!connectionString) {
      throw new Error('No se encontró la cadena de conexión en DATABASE_URL');
    }

    db = new Database(connectionString);

    const cleanCustomerId = customerId ? Number(customerId) : null;
    const cleanTotalUSD = Number(totalUSD) || 0;
    const cleanPaymentMethod = paymentMethod ? String(paymentMethod) : 'Efectivo';

    // 1. Insertar la venta principal
    const saleQuery = `
      INSERT INTO sales (customer_id, total_usd, payment_method) 
      VALUES (${cleanCustomerId === null ? 'NULL' : cleanCustomerId}, ${cleanTotalUSD}, '${cleanPaymentMethod}')
    `;
    
    await db.sql(saleQuery);

    // 2. Obtener el ID de la venta recién insertada mediante una consulta directa
    const idResult: any = await db.sql("SELECT last_insert_rowid() as id;");
    
    let saleId = 0;
    if (idResult) {
      if (Array.isArray(idResult) && idResult.length > 0) {
        saleId = Number(idResult[0].id || idResult[0][0] || 0);
      } else if (typeof idResult === 'object') {
        saleId = Number(idResult.id || 0);
      }
    }

    // 3. Insertar los items de la venta
    if (saleId > 0 && items.length > 0) {
      for (const item of items) {
        const prodId = Number(item.id || item.product_id || 0);
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price || item.price_at_sale) || 0;

        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) 
          VALUES (${saleId}, ${prodId}, ${qty}, ${price})
        `;
        await db.sql(itemQuery);
      }
    }

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
    if (!connectionString) throw new Error('Configuración de BD faltante');
    
    const db = new Database(connectionString);
    const sales = await db.sql("SELECT * FROM sales ORDER BY id DESC");
    
    return NextResponse.json(sales, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
