import { NextResponse } from 'next/server';  
import { runQuery } from '@/db/client';  

export async function POST(request: Request) {  
  try {  
    const body = await request.json();  
    let {  
      date,  
      totalUSD,  
      totalBs,  
      exchangeRate,  
      paymentMethod,  
      items,
      cash_register_id  
    } = body;  

    // Si el frontend no envió el cash_register_id, buscarlo automáticamente en la base de datos
    if (!cash_register_id) {
      const activeRegisterResult: any = await runQuery(async (db) => {
        return await db.sql(
          "SELECT id FROM cash_registers WHERE status = 'open' AND closing_date IS NULL ORDER BY id DESC LIMIT 1"
        );
      });
      
      const activeRows = Array.isArray(activeRegisterResult) ? activeRegisterResult : activeRegisterResult?.rows || [];
      
      if (activeRows.length > 0) {
        cash_register_id = activeRows[0].id;
      }
    }

    // Si tras la búsqueda aún no hay ninguna caja abierta, bloquear la venta
    if (!cash_register_id) {
      return NextResponse.json(
        { success: false, error: 'No se puede registrar la venta: La caja se encuentra cerrada o no hay un turno activo.' },  
        { status: 400 }
      );
    }

    // 1. Insertar la venta principal usando exactamente las columnas reales de la tabla sales
    const saleResult: any = await runQuery(async (db) => {
      return await db.sql(
        `INSERT INTO sales (total_usd, payment_method, cash_register_id, total_ves, exchange_rate, created_at)  
         VALUES (?, ?, ?, ?, ?, ?)`,
        [  
          totalUSD || 0,  
          paymentMethod || 'Efectivo USD',  
          cash_register_id,  
          totalBs || 0,  
          exchangeRate || 1,  
          date || new Date().toISOString()  
        ]  
      );
    });  

    // Obtener el ID de la venta insertada de forma segura
    const saleId = saleResult?.lastInsertRowid ? Number(saleResult.lastInsertRowid) : 1;

    // 2. Insertar los ítems y descontar stock de inventario
    if (items && Array.isArray(items)) {  
      for (const item of items) {  
        await runQuery(async (db) => {
          return await db.sql(
            `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)`,
            [saleId, item.id || item.product_id, item.quantity, item.price || item.price_usd || 0]
          );
        });  

        await runQuery(async (db) => {
          return await db.sql(
            `UPDATE products SET stock = stock - ? WHERE id = ?`,
            [item.quantity, item.id || item.product_id]
          );
        });  
      }  
    }  

    return NextResponse.json({ success: true, saleId, message: 'Venta registrada con éxito' });  
  } catch (error: any) {  
    console.error("Error al registrar venta:", error);  
    return NextResponse.json({ success: false, error: error?.message || 'Error al procesar la venta en la base de datos' }, { status: 500 });  
  }  
}  

export async function GET() {  
  try {  
    const result: any = await runQuery(async (db) => {
      return await db.sql("SELECT * FROM sales ORDER BY id DESC");
    });
    const rows = Array.isArray(result) ? result : result?.rows || [];
    return NextResponse.json(rows);  
  } catch (error) {  
    return NextResponse.json({ error: 'Error al obtener el historial de ventas' }, { status: 500 });  
  }  
}
