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

    // 1. Insertar la venta principal vinculada a la caja abierta
    db.run(
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

    // Obtener el ID de la última venta insertada de forma segura mediante consulta SQL
    const lastSale = db.all("SELECT id FROM sales ORDER BY id DESC LIMIT 1;") as Array<{ id: number }>;
    const saleId = lastSale && lastSale.length > 0 ? lastSale[0].id : 1;

    // 2. Insertar los ítems y descontar stock de inventario
    if (items && Array.isArray(items)) {  
      for (const item of items) {  
        db.run(
          `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [saleId, item.id || item.product_id, item.quantity, item.price]
        );  

        db.run(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [item.quantity, item.id || item.product_id]
        );  
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
    const result = db.all("SELECT * FROM sales ORDER BY id DESC");  
    return NextResponse.json(result);  
  } catch (error) {  
    return NextResponse.json({ error: 'Error al obtener el historial de ventas' }, { status: 500 });  
  }  
}
