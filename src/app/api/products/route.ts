import { NextResponse } from 'next/server';
import { db } from '../../../db/client';

export async function GET() {
  try {
    const result = await db.sql("SELECT * FROM products ORDER BY id DESC");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, barcode, price_usd, stock } = body;

    if (!name || price_usd === undefined) {
      return NextResponse.json({ error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    await db.sql(`INSERT INTO products (name, barcode, price_usd, stock) VALUES ('${name}', '${barcode || ''}', ${Number(price_usd)}, ${Number(stock || 0)})`);

    return NextResponse.json({ success: true, message: 'Producto registrado con éxito' });
  } catch (error) {
    console.error("Error al registrar producto:", error);
    return NextResponse.json({ error: 'Error al registrar el producto' }, { status: 500 });
  }
}
