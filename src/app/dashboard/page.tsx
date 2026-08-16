'use client';
import { useState } from 'react';

type Product = { id: number; name: string; price: number; category: string };
type CartItem = Product & { quantity: number };

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Café Americano', price: 2.50, category: 'Bebidas' },
  { id: 2, name: 'Tequeños (6 unid.)', price: 5.00, category: 'Pasapalos' },
  { id: 3, name: 'Hamburguesa Clásica', price: 8.50, category: 'Comida' },
  { id: 4, name: 'Refresco 350ml', price: 1.50, category: 'Bebidas' },
];

export default function DashboardPOS() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory'>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(36.50);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');

  // Estados para el formulario de nuevo producto
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Bebidas');

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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    const newProd: Product = {
      id: Date.now(),
      name: newName,
      price: parseFloat(newPrice) || 0,
      category: newCategory,
    };

    setProducts(prev => [...prev, newProd]);
    setNewName('');
    setNewPrice('');
    alert('¡Producto agregado al inventario exitosamente!');
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const totalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalBs = totalUSD * exchangeRate;
  const cashUSD = cashGivenUSD ? parseFloat(cashGivenUSD) : 0;
  const changeUSD = Math.max(0, cashUSD - totalUSD);
  const changeBs = changeUSD * exchangeRate;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    alert(`¡Venta procesada con éxito!\nTotal: $${totalUSD.toFixed(2)} (Bs. ${totalBs.toFixed(2)})`);
    setCart([]);
    setCashGivenUSD('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Barra superior con navegación de pestañas */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-blue-400">⚡ POS Cloud</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              🛒 Caja / POS
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              📦 Gestión de Inventario
            </button>
          </div>
        </div>

        {/* Tasa BCV */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <span className="text-slate-400">Tasa BCV (Bs/$):</span>
          <input 
            type="number" 
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
            className="bg-slate-900 text-white font-bold w-20 px-2 py-1 rounded border border-slate-700 text-center focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-sm text-slate-400">
          Operador: <span className="text-white font-medium">Administrador</span>
        </div>
      </header>

      {/* VISTA 1: CAJA / POS */}
      {activeTab === 'pos' && (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
          {/* Catálogo */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Catálogo de Productos</h2>
              <span className="text-xs text-slate-400">{products.length} artículos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map(product => {
                const priceBs = product.price * exchangeRate;
                return (
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
                    <div className="mt-4">
                      <div className="font-bold text-blue-400 text-base">${product.price.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">Bs. {priceBs.toFixed(2)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket de Venta */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-black/30">
            <div>
              <h2 className="text-lg font-bold mb-4 border-b border-slate-800 pb-3 flex justify-between items-center">
                <span>Ticket de Venta</span>
                <span className="text-xs font-normal text-slate-400">{cart.length} items</span>
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No hay productos agregados al ticket.
                  </div>
                )}
                {cart.map(item => {
                  const itemTotalUSD = item.price * item.quantity;
                  const itemTotalBs = itemTotalUSD * exchangeRate;
                  return (
                    <div key={item.id} className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-xl flex justify-between items-center">
                      <div className="flex-1 pr-2">
                        <div className="text-sm font-medium text-slate-200">{item.name}</div>
                        <div className="text-xs text-blue-400">${item.price.toFixed(2)} c/u</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-slate-400 hover:text-white text-xs">-</button>
                          <span className="px-2 text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 text-slate-400 hover:text-white text-xs">+</button>
                        </div>

                        <div className="text-right w-20">
                          <div className="text-sm font-bold">${itemTotalUSD.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">Bs. {itemTotalBs.toFixed(2)}</div>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 text-xs ml-1">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-400">Total a Pagar:</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-400">${totalUSD.toFixed(2)}</div>
                    <div className="text-xs text-emerald-400 font-semibold">Bs. {totalBs.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Efectivo Recibido ($)</label>
                <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                  <input 
                    type="number" 
                    step="0.1"
                    value={cashGivenUSD}
                    onChange={(e) => setCashGivenUSD(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-white focus:outline-none w-full text-sm"
                  />
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Vuelto: <strong className="text-emerald-400">${changeUSD.toFixed(2)}</strong></span>
                    <div className="text-[10px] text-slate-500">Bs. {changeBs.toFixed(2)}</div>
                  </div>
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
      )}

      {/* VISTA 2: GESTIÓN DE INVENTARIO */}
      {activeTab === 'inventory' && (
        <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Inventario</h2>
            <span className="text-sm text-slate-400">Administra los productos de tu tienda</span>
          </div>

          {/* Formulario para agregar producto */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Agregar Nuevo Producto</h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Pastelito"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Precio ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Categoría</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Bebidas">Bebidas</option>
                  <option value="Comida">Comida</option>
                  <option value="Pasapalos">Pasapalos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-sm transition shadow-lg shadow-blue-600/20"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Productos Existentes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Precio ($)</th>
                  <th className="p-4">Precio (Bs.)</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {products.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-medium text-white">{prod.name}</td>
                    <td className="p-4">
                      <span className="text-[10px] uppercase font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-blue-400">${prod.price.toFixed(2)}</td>
                    <td className="p-4 text-slate-400">Bs. {(prod.price * exchangeRate).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => deleteProduct(prod.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </div>
  );
}
