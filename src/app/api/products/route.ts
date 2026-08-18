import { NextResponse } from 'next/server';
import { db } from '../../../db/client'; // Asegúrate de que esta ruta apunte a tu cliente de base de datos

export async function GET() {
  try {
    // Usamos 'db.sql' tal como lo tienes configurado en el resto de tus rutas
    const products = await db.sql(`SELECT id, name, price_usd, stock, 1 as taxable, 'General' as category, 0 as costPrice FROM products`);

    const formattedProducts = Array.isArray(products) ? products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price_usd,
      stock: p.stock,
      taxable: p.taxable !== undefined ? Boolean(p.taxable) : true,
      category: p.category || 'General',
      costPrice: p.cost_price || p.costPrice || 0
    })) : [];

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, stock, costPrice, category, taxable, barcode } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ success: false, error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    const generatedBarcode = barcode || '759' + Math.floor(100000000 + Math.random() * 900000000);

    await db.sql(`
      INSERT INTO products (name, price_usd, stock, cost_price, category, taxable, barcode) 
      VALUES ('${name}', ${price}, ${stock || 0}, ${costPrice || 0}, '${category || 'General'}', ${taxable ? 1 : 0}, '${generatedBarcode}')
    `);

    return NextResponse.json({ success: true, message: 'Producto registrado con éxito' });
  } catch (error: any) {
    console.error("Error al guardar producto:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
