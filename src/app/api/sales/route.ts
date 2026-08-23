import { NextResponse } from 'next/server';  
import { runQuery } from '@/db/client';  

export async function POST(request: Request) {  
  try {  
    const body = await request.json();  
    const {   
      date,   
      subtotalUSD,   
      ivaUSD,   
      totalUSD,   
      totalBs,   
      exchangeRate,   
      paymentMethod,   
      changeUSD,   
      clientName,  
      items,
      cash_register_id 
    } = body;  

    // Validar obligatoriamente que venga el ID de la caja abierta
    if (!cash_register_id) {
      return NextResponse.json(
        { success: false, error: 'No se puede registrar la venta: La caja se encuentra cerrada o no hay un turno activo.' }, 
        { status: 400 }
      );
    }

    // 1. Insertar la venta principal vinculada a la caja abierta usando runQuery
    const saleResult: any = await runQuery(async (db) => {
      return await db.sql(
        `INSERT INTO sales (date, subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, paymentMethod, changeUSD, clientName, cash_register_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          date || new Date().toLocaleString(), 
          subtotalUSD || 0, 
          ivaUSD || 0, 
          totalUSD, 
          totalBs, 
          exchangeRate, 
          paymentMethod, 
          changeUSD || 0, 
          clientName || 'Cliente Genérico',
          cash_register_id
        ]
      );
    });  

    // Obtener el ID de la venta insertada de forma segura
    const rows = saleResult?.rows || [];
    const saleId = saleResult?.lastInsertRowid ? Number(saleResult.lastInsertRowid) : 1;

    // 2. Insertar los ítems y descontar stock de inventario
    if (items && Array.isArray(items)) {  
      for (const item of items) {  
        await runQuery(async (db) => {
          return await db.sql(
            `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
            [saleId, item.id || item.product_id, item.quantity, item.price]
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
    return NextResponse.json({ error: error?.message || 'Error al procesar la venta en la base de datos' }, { status: 500 });  
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
