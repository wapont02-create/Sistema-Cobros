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
      items 
    } = body;

    // 1. Insertar la venta principal
    const saleResult = await db.execute({
      sql: `INSERT INTO sales (date, subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, paymentMethod, changeUSD, clientName) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [date, subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, paymentMethod, changeUSD, clientName || 'Cliente Genérico']
    });

    const saleId = Number(saleResult.lastInsertRowid);

    // 2. Insertar los ítems y descontar stock
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.execute({
          sql: `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
          args: [saleId, item.id, item.quantity, item.price]
        });

        await db.execute({
          sql: `UPDATE products SET stock = stock - ? WHERE id = ?`,
          args: [item.quantity, item.id]
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
