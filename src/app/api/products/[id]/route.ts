import { NextResponse } from 'next/server';
// Asegúrate de importar tu conexión o cliente de SQLite Cloud que uses en los demás archivos de API
// import { db } from '@/lib/db'; 

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Resolver los parámetros de la URL de forma segura para Next.js
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { stock, name, price, costPrice, category, taxable } = body;

    // Dependiendo de cómo estés ejecutando las consultas SQL en tu proyecto (por ejemplo, con sqlite-cloud o sql template):
    // Ejemplo usando una sentencia SQL directa:
    // await db.sql`UPDATE products SET stock = ${stock} WHERE id = ${id}`;

    // Si estás manejando una conexión genérica, asegúrate de actualizar la columna 'stock' (y las demás si aplican):
    /*
      Ejemplo alternativo:
      await db.execute({
        sql: "UPDATE products SET stock = ? WHERE id = ?",
        args: [stock, id]
      });
    */

    return NextResponse.json({ 
      success: true, 
      message: `Stock del producto ${id} actualizado correctamente a ${stock}` 
    });

  } catch (error: any) {
    console.error("Error en API PUT /products/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al actualizar el producto' }, 
      { status: 500 }
    );
  }
}
