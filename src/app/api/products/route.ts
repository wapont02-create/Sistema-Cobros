import { NextResponse } from 'next/server';
// Asegúrate de tener importada tu conexión a SQLite Cloud

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, stock, costPrice, category, taxable, barcode } = body;

    // Validación básica
    if (!name || price === undefined || price === null) {
      return NextResponse.json({ success: false, error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    const generatedBarcode = barcode || '759' + Math.floor(100000000 + Math.random() * 900000000);

    // Ejecuta la consulta asegurándote de usar los nombres de columnas de tu BD:
    // name, price_usd, stock, cost_price, category, taxable, barcode
    // Ejemplo con tu cliente SQL:
    /*
    await sql`
      INSERT INTO products (name, price_usd, stock, cost_price, category, taxable, barcode) 
      VALUES (${name}, ${price}, ${stock || 0}, ${costPrice || 0}, ${category || 'General'}, ${taxable ? 1 : 0}, ${generatedBarcode})
    `;
    */

    return NextResponse.json({ success: true, message: 'Producto registrado con éxito' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
