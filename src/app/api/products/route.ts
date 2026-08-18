import { NextResponse } from 'next/server';
import { db } from '../../../db/client';

export async function GET() {
  try {
    const result = await db.execute("SELECT * FROM products");
    // Convertir el campo taxable de 0/1 a booleano para el frontend
    const formattedRows = result.rows.map((row: any) => ({
      ...row,
      taxable: row.taxable === 1
    }));
    return NextResponse.json(formattedRows);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener los productos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, costPrice, price, category, taxable, stock } = body;

    await db.execute({
      sql: `INSERT INTO products (name, costPrice, price, category, taxable, stock) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [name, costPrice, price, category, taxable ? 1 : 0, stock]
    });

    return NextResponse.json({ success: true, message: 'Producto registrado en la nube' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar el producto' }, { status: 500 });
  }
}
