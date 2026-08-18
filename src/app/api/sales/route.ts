import { NextResponse } from 'next/server';
import { db } from '../../../db/client';

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

    // 1. Insertar la venta principal[cite: 1]
    await db.sql(`INSERT INTO sales (date, subtotalUSD, ivaUSD, totalUSD, totalBs, exchangeRate, paymentMethod, changeUSD, clientName) VALUES ('${date}', ${subtotalUSD}, ${ivaUSD}, ${totalUSD}, ${totalBs}, ${exchangeRate}, '${paymentMethod}', ${changeUSD}, '${clientName || 'Cliente Genérico'}')`);

    // 2. Obtener el ID de la última venta insertada[cite: 1]
    const lastSale = await db.sql("SELECT last_insert_rowid() as id");
    const saleId = lastSale[0]?.id || lastSale[0]?.['last_insert_rowid()'];

    // 3. Insertar los ítems y descontar stock[cite: 1]
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.sql(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (${saleId}, ${item.id}, ${item.quantity}, ${item.price})`);

        await db.sql(`UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.id}`);
      }
    }

    return NextResponse.json({ success: true, saleId, message: 'Venta registrada con éxito'[cite: 1] });
  } catch (error) {
    console.error("Error al registrar venta:", error);
    return NextResponse.json({ error: 'Error al procesar la venta en la base de datos'[cite: 1] }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await db.sql("SELECT * FROM sales ORDER BY id DESC");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener historial de ventas:", error);
    return NextResponse.json({ error: 'Error al obtener el historial de ventas'[cite: 1] }, { status: 500 });
  }
}
