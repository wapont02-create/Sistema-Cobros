import { NextResponse } from 'next/server';
import { db } from '../../../db/client'; // Ajusta la ruta si es necesario según la ubicación exacta de tu cliente

export async function GET() {
  try {
    const products = await db.sql(`SELECT id, name, barcode, price_usd, stock, taxable, category, cost_price FROM products`);

    const formattedProducts = Array.isArray(products) ? products.map((p: any) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      price: p.price_usd,
      stock: p.stock,
      taxable: p.taxable !== undefined ? Boolean(p.taxable) : true,
      category: p.category || 'General',
      costPrice: p.cost_price || 0
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
    const { name, price, stock, taxable, barcode, category, costPrice } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ success: false, error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    const generatedBarcode = barcode || '759' + Math.floor(100000000 + Math.random() * 900000000);
    const finalStock = stock !== undefined ? Number(stock) : 0;
    const finalTaxable = taxable ? 1 : 0;
    const finalCategory = category || 'General';
    const finalCost = costPrice !== undefined ? Number(costPrice) : 0;

    await db.sql(`
      INSERT INTO products (name, barcode, price_usd, stock, taxable, category, cost_price) 
      VALUES ('${name}', '${generatedBarcode}', ${price}, ${finalStock}, ${finalTaxable}, '${finalCategory}', ${finalCost})
    `);

    return NextResponse.json({ success: true, message: 'Producto registrado con éxito' });
  } catch (error: any) {
    console.error("Error al guardar producto:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
