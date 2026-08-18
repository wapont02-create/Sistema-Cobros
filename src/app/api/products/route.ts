import { NextResponse } from 'next/server';
// Importa tu cliente de SQLite Cloud aquí (ej. import { SqliteCloud } from '@sqlitecloud/driver'; o similar)

export async function GET() {
  try {
    // Ejemplo de consulta adaptada a las columnas reales de tu BD:
    // const products = await sql`SELECT id, name, barcode, price_usd as price, stock, 'General' as category, 1 as taxable, 0 as costPrice FROM products`;
    
    // De momento, asegúrate de devolver los campos con los nombres que espera el frontend:
    // id, name, price (o price_usd mapeado a price), stock, category, taxable, costPrice
    
    return NextResponse.json([]); 
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body.name;
    const price = body.price !== undefined ? body.price : body.price_usd;
    const stock = body.stock !== undefined ? body.stock : 0;
    const barcode = body.barcode || '759' + Math.floor(Math.random() * 1000000000);

    if (!name || price === undefined || price === null || price === '') {
      return NextResponse.json({ success: false, error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    // Inserta usando únicamente las columnas que sí existen en tu tabla de SQLite Cloud:
    // await sql`INSERT INTO products (name, price_usd, stock, barcode) VALUES (${name}, ${price}, ${stock}, ${barcode})`;

    return NextResponse.json({ success: true, message: 'Producto guardado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
