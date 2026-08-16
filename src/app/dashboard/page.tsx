'use client';
import { useState } from 'react';

type Product = { id: number; name: string; price: number; category: string };
type CartItem = Product & { quantity: number };

const PRODUCTS: Product[] = [
  { id: 1, name: 'Café Americano', price: 2.50, category: 'Bebidas' },
  { id: 2, name: 'Tequeños (6 unid.)', price: 5.00, category: 'Pasapalos' },
  { id: 3, name: 'Hamburguesa Clásica', price: 8.50, category: 'Comida' },
  { id: 4, name: 'Refresco 350ml', price: 1.50, category: 'Bebidas' },
];

export default function DashboardPOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashGiven, setCashGiven] = useState<string>('');

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = cashGiven ? Math.max(0, parseFloat(cashGiven) - total) : 0;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    alert(`¡Venta procesada con éxito!\nTotal cobrado: $${total.toFixed(2)}`);
    setCart([]);
    setCashGiven('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Barra superior */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-blue-400">⚡ POS Cloud</span>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-medium">
            Caja Activa #1
          </span>
        </div>
        <div className="text-sm text-slate-400">
          Operador: <span className="text-white font-medium">Administrador</span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Sección Izquierda: Catálogo de Productos (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Productos Disponibles</h2>
            <span className="text-xs text-slate-400">{PRODUCTS.length} artículos</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PRODUCTS.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 p-4 rounded-2xl text-left transition flex flex-col justify-between group shadow-lg shadow-black/20"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    {product.category}
                  </span>
                  <div className="font-semibold text-slate-200 mt-2 text-sm group-hover:text-white transition">
                    {product.name}
                  </div>
                </div>
                <div className="mt-4 font-bold text-blue-400 text-base">
                  ${product.price.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sección Derecha: Ticket de Venta y Cobro (5 columnas) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-black/30">
          <div>
            <h2 className="text-lg font-bold mb-4 border-b border-slate-800 pb-3 flex justify-between items-center">
              <span>Ticket de Venta</span>
              <span className="text-xs font-normal text-slate-400">{cart.length} items</span>
            </h2>

            {/* Lista de productos en el ticket */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No hay productos agregados al ticket.
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-xl flex justify-between items-center">
                  <div className="flex-1 pr-2">
                    <div className="text-sm font-medium text-slate-200">{item.name}</div>
                    <div className="text-xs text-blue-400">${item.price.toFixed(2)} c/u</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-bold w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-500 hover:text-red-400 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales y opciones de pago */}
          <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total a Pagar:</span>
                <span className="text-blue-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Input para calcular vuelto */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Efectivo Recibido ($)</label>
              <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <input 
                  type="number" 
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-white focus:outline-none w-full text-sm"
                />
                <span className="text-xs text-slate-500">Vuelto: <strong className="text-emerald-400">${change.toFixed(2)}</strong></span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-xl font-bold transition shadow-lg ${
                cart.length > 0 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Procesar Pago
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
