import { NextResponse } from 'next/server';
import { db } from '../../../../db/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { stock } = body;

    if (stock === undefined) {
      return NextResponse.json({ success: false, error: 'Falta el campo stock' }, { status: 400 });
    }

    await db.sql(`UPDATE products SET stock = ${stock} WHERE id = ${id};`);

    return NextResponse.json({ 
      success: true, 
      message: 'Stock actualizado correctamente' 
    });

  } catch (error: any) {
    console.error("Error al actualizar stock:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al actualizar' }, 
      { status: 500 }
    );
  }
}
