import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function GET() {
  try {
    const result = await db.execute("SELECT * FROM customers");
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rif_ci, phone } = body;

    await db.execute({
      sql: `INSERT INTO customers (name, rif_ci, phone) VALUES (?, ?, ?)`,
      args: [name, rif_ci, phone]
    });

    return NextResponse.json({ success: true, message: 'Cliente registrado correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar el cliente' }, { status: 500 });
  }
}
