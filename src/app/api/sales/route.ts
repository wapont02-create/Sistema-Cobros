import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

// Usamos DATABASE_URL que es la variable que ya tienes configurada en Vercel
const connectionString = process.env.DATABASE_URL || '';

export async function POST(request: Request) {
  let db;
  try {
    const body = await request.json();
    const { 
      subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, 
      paymentMethod, changeUSD, clientName, items 
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!connectionString) {
      throw new Error('No se encontró la cadena de conexión en DATABASE_URL');
    }

    db = new Database(connectionString);

    // 1. Insertar venta principal
    const saleQuery = `
      INSERT INTO sales (date, subtotal_usd, iva_usd, total_usd, total_bs, exchange_rate, payment_method, change_usd, client_name) 
      VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const saleResult = await db.sql(saleQuery, [
      subtotalUSD || 0, ivaUSD || 0, totalUSD || 0, totalBs || 0, 
      exchangeRate || 0, paymentMethod || 'Efectivo', changeUSD || 0, clientName || 'General'
    ]);

    const saleId = saleResult.lastInsertRowid;

    // 2. Insertar items asociados
    if (saleId) {
      for (const item of items) {
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) 
          VALUES (?, ?, ?, ?)
        `;
        await db.sql(itemQuery, [saleId, item.id, item.quantity, item.price]);
      }
    }

    return NextResponse.json({ success: true, message: 'Venta guardada', saleId });

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
