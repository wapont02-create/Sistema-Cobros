import { NextResponse } from 'next/server';
// Importa aquí tu cliente de SQLite Cloud o la conexión a base de datos que estés usando

export async function GET() {
  try {
    // Ejemplo de consulta a tu base de datos para listar productos
    // const rows = await sql`SELECT * FROM products`;
    return NextResponse.json([]); // Reemplaza con tus productos de la BD
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Soportar tanto nombres en inglés como en español por compatibilidad
    const name = body.name;
    const costPrice = body.costPrice !== undefined ? body.costPrice : body.cost_price;
    const price = body.price;
    const category = body.category || 'General';
    const taxable = body.taxable !== undefined ? body.taxable : true;
    const stock = body.stock !== undefined ? body.stock : 0;

    // Validación flexible y robusta
    if (!name || price === undefined || price === null || price === '') {
      return NextResponse.json({ success: false, error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    // Aquí ejecutas la inserción en tu base de datos SQLite Cloud
    // Ejemplo:
    // await sql`INSERT INTO products (name, costPrice, price, category, taxable, stock) VALUES (${name}, ${costPrice || 0}, ${price}, ${category}, ${taxable ? 1 : 0}, ${stock})`;

    return NextResponse.json({ success: true, message: 'Producto guardado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
