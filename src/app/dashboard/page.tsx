import { db } from "../../db";
import { products } from "../../db/schema";

export default async function DashboardPage() {
  // Obtenemos los productos desde SQLite Cloud
  const productList = await db.select().from(products);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Inventario</h1>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Producto</th>
                <th className="p-4 font-semibold text-gray-700">Precio (USD)</th>
                <th className="p-4 font-semibold text-gray-700">Stock</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-4 text-gray-800">{product.name}</td>
                  <td className="p-4 text-green-600 font-bold">${product.priceUsd}</td>
                  <td className="p-4 text-gray-600">{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
