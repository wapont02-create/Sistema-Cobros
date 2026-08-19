import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

// Configura tu conexión utilizando las variables de entorno de Vercel
const connectionString = process.env.SQLITE_CLOUD_CONNECTION_STRING || '';

export async function POST(request: Request) {
  let db;
  try {
    const body = await request.json();
    const { date, subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, paymentMethod, changeUSD, clientName, items } = body;

    // Validación básica del carrito
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!connectionString) {
      throw new Error('Falta la variable de entorno SQLITE_CLOUD_CONNECTION_STRING en Vercel');
    }

    // Inicializar la conexión a SQLite Cloud
    db = new Database(connectionString);

    // 1. Insertar la venta principal en la tabla 'sales'
    const saleQuery = `
      INSERT INTO sales (date, subtotal_usd, iva_usd, total_usd, total_bs, exchange_rate, payment_method, change_usd, client_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const saleResult = await db.sql(saleQuery, [
      date || new Date().toISOString(), 
      subtotalUSD || 0, 
      ivaUSD || 0, 
      totalUSD || 0, 
      totalBs || 0, 
      exchangeRate || 0, 
      paymentMethod || 'Efectivo', 
      changeUSD || 0, 
      clientName || 'General'
    ]);

    // Obtener el ID de la venta recién creada para los items
    const saleId = saleResult.lastInsertRowid;

    // 2. Insertar cada producto en la tabla 'sale_items' y descontar stock si corresponde
    if (saleId && items.length > 0) {
      for (const item of items) {
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) 
          VALUES (?, ?, ?, ?)
        `;
        await db.sql(itemQuery, [saleId, item.id, item.quantity, item.price]);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Venta procesada y guardada correctamente',
      saleId: saleId 
    });

  } catch (error: any) {
    console.error('Error detallado al guardar la venta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la venta en la base de datos' },
      { status: 500 }
    );
  }
}

export async function GET() {
  let db;
  try {
    if (!connectionString) {
      throw new Error('Falta la variable de entorno SQLITE_CLOUD_CONNECTION_STRING');
    }

    db = new Database(connectionString);
    
    // Consulta real para obtener el historial de ventas y alimentar los Reportes Z
    const sales = await db.sql("SELECT * FROM sales ORDER BY id DESC");
    
    return NextResponse.json(sales, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener ventas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
