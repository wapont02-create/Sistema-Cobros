import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

const connectionString = process.env.DATABASE_URL || '';

export async function POST(request: Request) {
  let db;
  try {
    const body = await request.json();
    const { 
      totalUSD, 
      paymentMethod, 
      customerId, 
      items 
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!connectionString) {
      throw new Error('No se encontró la cadena de conexión en DATABASE_URL');
    }

    db = new Database(connectionString);

    // 1. Insertar venta principal usando created_at (automático) y total_usd
    const saleQuery = `
      INSERT INTO sales (customer_id, total_usd, payment_method) 
      VALUES (?, ?, ?)
    `;
    
    const saleResult = await db.sql(saleQuery, [
      customerId || null, 
      totalUSD || 0, 
      paymentMethod || 'Efectivo'
    ]);

    const saleId = saleResult.lastInsertRowid;

    // 2. Insertar items asociados si aplica
    if (saleId && items.length > 0) {
      for (const item of items) {
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) 
          VALUES (?, ?, ?, ?)
        `;
        await db.sql(itemQuery, [saleId, item.id, item.quantity, item.price]);
      }
    }

    return NextResponse.json({ success: true, message: 'Venta guardada exitosamente', saleId });

  } catch (error: any) {
    console.error('Error en POST /api/sales:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
