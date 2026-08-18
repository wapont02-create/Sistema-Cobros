import { NextResponse } from 'next/server';
// Importa tu cliente de conexión a SQLite Cloud

export async function GET() {
  try {
    // Realiza la consulta para traer todos los productos de tu tabla
    // (Ajusta 'sql' según el cliente que estés usando para conectar SQLite Cloud)
    const products = await sql`SELECT id, name, price_usd, stock, taxable FROM products`;

    // Mapea los campos si el frontend espera nombres específicos (ej: price en lugar de price_usd)
    const formattedProducts = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price_usd, // Mapeado para que el frontend lo lea bien
      stock: p.stock,
      taxable: p.taxable
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
