'use client';
import { useState, useEffect } from 'react';
import RolesManagerModule from '../../components/RolesManagerModule';
import { getRoles, getUsers } from '../../utils/rolesManager';

type Product = {
  id: number;
  name: string;
  costPrice: number;
  price: number;
  category: string;
  taxable: boolean;
  stock: number;
};

type CartItem = Product & { quantity: number };

type PaymentMethodType = 'Efectivo USD' | 'Efectivo Bs' | 'Pago Móvil' | 'Zelle' | 'Binance Pay' | 'Crédito / Fiado';

type SaleRecord = {
  id: number;
  date: string;
  items: CartItem[];
  subtotalUSD: number;
  ivaUSD: number;
  totalUSD: number;
  totalBs: number;
  exchangeRate: number;
  paymentMethod: PaymentMethodType;
  changeUSD: number;
  clientName: string;
};

export default function DashboardPage() {
  // Estados de navegación y roles
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'roles'>('pos');
  
  const rolesList = getRoles();
  const usersList = getUsers();

  // Estado para el usuario/perfil activo seleccionado arriba a la derecha
  const [selectedUserId, setSelectedUserId] = useState<string>(usersList[0]?.id || '1');

  // Obtener el usuario y su rol actual
  const currentUser = usersList.find(u => u.id === selectedUserId) || usersList[0];
  const currentRoleObj = rolesList.find(r => r.id === currentUser?.roleId) || rolesList[0];
  const userPermissions = currentRoleObj?.permissions || [];

  // Estados del POS
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const exchangeRate = 778.33; // Tasa BCV de referencia

  // Productos de ejemplo
  const [products] = useState<Product[]>([
    { id: 1, name: 'Café Americano', costPrice: 1.5, price: 2.5, category: 'Bebidas', taxable: true, stock: 41 },
    { id: 2, name: 'Tequeños (6 unid.)', costPrice: 3.0, price: 5.0, category: 'Pasapalos', taxable: true, stock: 10 },
    { id: 3, name: 'Hamburguesa Clásica', costPrice: 5.0, price: 8.5, category: 'Comida', taxable: true, stock: 9 },
    { id: 4, name: 'Refresco 350ml', costPrice: 1.0, price: 1.5, category: 'Bebidas', taxable: true, stock: 29 },
    { id: 5, name: 'Huevos (Cartón)', costPrice: 2.2, price: 3.0, category: 'Víveres', taxable: false, stock: 4 },
  ]);

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

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ivaUSD = cart.reduce((acc, item) => item.taxable ? acc + (item.price * item.quantity * 0.16) : acc, 0);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * exchangeRate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER SUPERIOR */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <h1 className="font-bold text-lg tracking-wide text-white">POS Enterprise Venezuela</h1>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS CON VALIDACIÓN DE PERMISOS */}
        <nav className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'pos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            🛒 Caja POS
          </button>
          
          {userPermissions.includes('view_inventory') && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              📦 Inventario
            </button>
          )}

          {userPermissions.includes('view_reports') && (
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              📊 Reportes Z
            </button>
          )}

          {userPermissions.includes('manage_roles') && (
            <button 
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'roles' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              🛡️ Roles y Personal
            </button>
          )}
        </nav>

        {/* INFO DE TASA Y SELECTOR DE PERFIL */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="text-slate-400">Tasa BCV (Bs/$):</span>
            <span className="font-bold text-emerald-400">{exchangeRate.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
            <div className="bg-blue-600 text-white w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight text-white">{currentUser?.name}</div>
              <div className="text-[10px] uppercase text-blue-400 font-semibold tracking-wider">
                ROL : {currentRoleObj?.name}
              </div>
            </div>

            {/* SELECTOR DE PERFIL DINÁMICO */}
            <div className="ml-2 pl-2 border-l border-slate-800">
              <span className="text-[10px] text-slate-400 block">Cambiar Perfil:</span>
              <select 
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  // Si el usuario cambia a un perfil sin permisos para la pestaña actual, lo devolvemos a 'pos'
                  setActiveTab('pos');
                }}
                className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
              >
                {usersList.map((u) => {
                  const r = rolesList.find(role => role.id === u.roleId);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} ({r?.name || u.roleId})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      {activeTab === 'roles' ? (
        <RolesManagerModule />
      ) : activeTab === 'inventory' ? (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <h2 className="text-2xl font-bold mb-2">📦 Módulo de Inventario</h2>
          <p className="text-slate-400">Control de stock y productos habilitados para el punto de venta.</p>
        </main>
      ) : activeTab === 'reports' ? (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <h2 className="text-2xl font-bold mb-2">📊 Reportes Z y Cierre de Caja</h2>
          <p className="text-slate-400">Historial de ventas y recaudación fiscal diaria.</p>
        </main>
      ) : (
        /* VISTA DE CAJA POS */
        <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto w-full">
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <input 
                type="text" 
                placeholder="Buscar producto por nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl w-full sm:w-80 text-sm outline-none focus:border-blue-500"
              />
              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['Todos', 'Bebidas', 'Pasapalos', 'Comida', 'Víveres'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
              {products
                .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(product => (
                  <div 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-lg group relative overflow-hidden"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {product.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${product.taxable ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {product.taxable ? 'IVA 16%' : 'Exento'}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-white">${product.price.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-400">Bs. {(product.price * exchangeRate).toFixed(2)}</div>
                      </div>
                      <span className="text-xs font-semibold bg-slate-950 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-800">
                        Stk: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* TICKET DE VENTA LATERAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl h-[calc(100vh-120px)] sticky top-6">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <h2 className="font-bold text-base text-white">Ticket de Venta</h2>
                <span className="text-xs text-slate-400">{cart.reduce((acc, i) => acc + i.quantity, 0)} items</span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-360px)] pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No hay productos en el ticket
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-white">{item.name}</div>
                        <div className="text-xs text-slate-400">${item.price.toFixed(2)} c/u</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-0.5 text-slate-400 hover:text-white">-</button>
                          <span className="text-xs font-bold px-2">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-0.5 text-slate-400 hover:text-white">+</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span>${subtotalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA (16%):</span>
                <span>${ivaUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total a Pagar:</span>
                <div className="text-right">
                  <div className="text-blue-400">${totalUSD.toFixed(2)}</div>
                  <div className="text-xs font-semibold text-emerald-400">Bs. {totalBs.toFixed(2)}</div>
                </div>
              </div>

              <button 
                disabled={cart.length === 0}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm"
              >
                Procesar Venta 💳
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
