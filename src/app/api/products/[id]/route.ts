import { NextResponse } from 'next/server';
// Importa tu cliente de base de datos aquí (por ejemplo, sqlite-cloud o el que uses)

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Si usas Next.js 15+, params es una promesa y requiere await:
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { stock } = body;

    // Ejecuta la sentencia SQL en tu base de datos para actualizar el stock
    // Ejemplo:
    // await db.sql`UPDATE products SET stock = ${stock} WHERE id = ${id}`;

    return NextResponse.json({ success: true, message: 'Stock actualizado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
