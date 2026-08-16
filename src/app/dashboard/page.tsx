'use client';
import { useState } from 'react';

// Definimos el tipo de producto
type Product = { id: number; name: string; price: number };
type CartItem = Product & { quantity: number };

const PRODUCTS: Product[] = [
  { id: 1, name: 'Café Americano', price: 2.50 },
  { id: 2, name: 'Tequeños (6 unid.)', price: 5.00 },
  { id: 3, name: 'Hamburguesa Clásica', price: 8.50 },
  { id: 4, name: 'Refresco 350ml', price: 1.50 },
];

export default function DashboardPOS() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Función para agregar o sumar cantidad al carrito
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-blue-400">⚡ Terminal POS</h1>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Productos */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PRODUCTS.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-blue-500 transition text-center"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium text-sm">{product.name}</div>
              <div className="text-blue-400 font-bold">${product.price.toFixed(2)}</div>
            </button>
          ))}
        </div>

        {/* Ticket */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-slate-800 pb-2">Ticket de Venta</h2>
          
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
            {cart.length === 0 && <p className="text-slate-600 text-center py-10">Vacío</p>}
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span>{item.quantity}x {item.name}</span>
                <div className="flex items-center gap-3">
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400">✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xl font-bold mb-6">
              <span>Total:</span>
              <span className="text-blue-400">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => { alert(`Venta procesada: $${total.toFixed(2)}`); setCart([]); }}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition shadow-lg shadow-blue-600/20"
            >
              Procesar Pago
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
