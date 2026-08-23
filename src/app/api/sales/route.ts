import { NextResponse } from 'next/server';  
import { db } from '@/db/client';  

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

    // 1. Insertar la venta principal vinculada a la caja abierta[cite: 1]
    const saleResult = await db.execute({  
      sql: `INSERT INTO sales (date, subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, paymentMethod, changeUSD, clientName, cash_register_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,  
      args: [
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
    });  

    const saleId = Number(saleResult.lastInsertRowid);  

    // 2. Insertar los ítems y descontar stock de inventario[cite: 1]
    if (items && Array.isArray(items)) {  
      for (const item of items) {  
        await db.execute({  
          sql: `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,  
          args: [saleId, item.id || item.product_id, item.quantity, item.price]  
        });  

        await db.execute({  
          sql: `UPDATE products SET stock = stock - ? WHERE id = ?`,  
          args: [item.quantity, item.id || item.product_id]  
        });  
      }  
    }  

    return NextResponse.json({ success: true, saleId, message: 'Venta registrada con éxito' });  
  } catch (error) {  
    console.error("Error al registrar venta:", error);  
    return NextResponse.json({ error: 'Error al procesar la venta en la base de datos' }, { status: 500 });  
  }  
}  

export async function GET() {  
  try {  
    const result = await db.execute("SELECT * FROM sales ORDER BY id DESC");  
    return NextResponse.json(result.rows);  
  } catch (error) {  
    return NextResponse.json({ error: 'Error al obtener el historial de ventas' }, { status: 500 });  
  }  
}
