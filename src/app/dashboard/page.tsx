"use client";

import { useState } from "react";

// Datos de ejemplo simulados mientras conectamos la base de datos completa
const initialProducts = [
  { id: 1, name: "Café Americano", price: 2.50, category: "Bebidas" },
  { id: 2, name: "Tequeños (6 unid.)", price: 5.00, category: "Pasapalos" },
  { id: 3, name: "Hamburguesa Clásica", price: 8.50, category: "Comida" },
  { id: 4, name: "Refresco 350ml", price: 1.50, category: "Bebidas" },
];

export default function POSPage() {
  const [cart, setCart] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);

  const addToCart = (product: typeof initialProducts[0]) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra superior */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">⚡ Sistema de Cobros - POS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-emerald-100 text-emerald-800 font-medium px-3 py-1 rounded-full">
            Caja Activa #1
          </span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Catálogo de Productos (2 columnas) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-700">Productos Disponibles</h2>
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-medium text-slate-800 text-lg mt-1">{product.name}</h3>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Facturación / Carrito (1 columna) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-3 mb-4">Ticket de Venta</h2>
            
            {cart.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-12">No hay productos agregados al ticket.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-slate-500">${item.price.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-800">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales y Botones de Cobro */}
          <div className="border-t pt-4 mt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xl font-bold text-slate-900">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                disabled={cart.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition"
              >
                Cobrar Efectivo
              </button>
              <button 
                disabled={cart.length === 0}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition"
              >
                Pago Móvil / Zelle
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
