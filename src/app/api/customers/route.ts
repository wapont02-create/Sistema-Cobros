import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client'; // Ajusta la ruta si es necesario

export async function GET() {
  try {
    const result = await runQuery(async (db) => {
      return await db.sql("SELECT * FROM customers ORDER BY id DESC");
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rif_ci, phone } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    await runQuery(async (db) => {
      return await db.sql(`INSERT INTO customers (name, rif_ci, phone) VALUES ('${name}', '${rif_ci || ''}', '${phone || ''}')`);
    });

    return NextResponse.json({ success: true, message: 'Cliente registrado con éxito' });
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return NextResponse.json({ error: 'Error al registrar el cliente en la base de datos' }, { status: 500 });
  }
}
