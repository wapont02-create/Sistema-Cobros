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

    // Validación estricta del carrito
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!connectionString) {
      throw new Error('No se encontró la cadena de conexión en DATABASE_URL');
    }

    db = new Database(connectionString);

    // 1. Limpiar y preparar los datos de la venta principal (3 parámetros exactos)
    const cleanCustomerId = customerId ? Number(customerId) : null;
    const cleanTotalUSD = Number(totalUSD) || 0;
    const cleanPaymentMethod = paymentMethod ? String(paymentMethod) : 'Efectivo';

    const saleQuery = `
      INSERT INTO sales (customer_id, total_usd, payment_method) 
      VALUES (?, ?, ?)
    `;
    
    await db.sql(saleQuery, [cleanCustomerId, cleanTotalUSD, cleanPaymentMethod]);

    // 2. Obtener el ID de la última inserción de forma segura mediante consulta SQL
    const idResult = await db.sql("SELECT last_insert_rowid() as id;");
    let saleId = 0;
    
    if (Array.isArray(idResult) && idResult.length > 0) {
      saleId = Number(idResult[0].id || idResult[0][0] || 0);
    } else if (idResult && typeof idResult === 'object') {
      saleId = Number((idResult as any).id || 0);
    }

    // 3. Insertar cada producto asociado asegurando que no haya valores undefined (4 parámetros exactos)
    if (saleId && items.length > 0) {
      for (const item of items) {
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) 
          VALUES (?, ?, ?, ?)
        `;
        
        const prodId = item.id || item.product_id || 0;
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price || item.price_at_sale) || 0;

        await db.sql(itemQuery, [saleId, prodId, qty, price]);
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
