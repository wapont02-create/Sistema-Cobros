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
  clientName?: string;
};

type CreditAccount = {
  id: number;
  clientName: string;
  clientPhone: string;
  clientDocument: string;
  totalDebtUSD: number;
  totalDebtBs: number;
  date: string;
  status: 'Pendiente' | 'Pagado';
  saleId: number;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Café Americano', costPrice: 1.20, price: 2.50, category: 'Bebidas', taxable: true, stock: 45 },
  { id: 2, name: 'Tequeños (6 unid.)', costPrice: 2.50, price: 5.00, category: 'Pasapalos', taxable: true, stock: 20 },
  { id: 3, name: 'Hamburguesa Clásica', costPrice: 4.50, price: 8.50, category: 'Comida', taxable: true, stock: 15 },
  { id: 4, name: 'Refresco 350ml', costPrice: 0.80, price: 1.50, category: 'Bebidas', taxable: true, stock: 30 },
  { id: 5, name: 'Huevos (Cartón)', costPrice: 2.20, price: 3.00, category: 'Víveres', taxable: false, stock: 10 },
];

const IVA_RATE = 0.16;

export default function DashboardPOS() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'credits' | 'roles'>('pos');
  
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_products');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_PRODUCTS;
  });

  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_sales');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [credits, setCredits] = useState<CreditAccount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_credits');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_bcv');
      if (saved) return parseFloat(saved);
    }
    return 776.00;
  });

  // Estado para simular perfil de usuario actual y control de permisos
  const [currentUsername, setCurrentUsername] = useState<string>('admin');

  // Cargamos roles y usuarios de forma reactiva (para que detecte cambios si se actualizan en localStorage desde el módulo de roles)
  const [rolesList, setRolesList] = useState(getRoles());
  const [usersList, setUsersList] = useState(getUsers());

  // Efecto para actualizar la lista de usuarios y roles si cambian en el módulo de personal
  useEffect(() => {
    const interval = setInterval(() => {
      setRolesList(getRoles());
      setUsersList(getUsers());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentUserObj = usersList.find(u => u.username === currentUsername) || usersList[0];
  
  // CORRECCIÓN: Búsqueda de rol robusta ignorando mayúsculas/minúsculas
  const currentRoleObj = rolesList.find(r => r.id.toLowerCase() === currentUserObj?.roleId?.toLowerCase()) || rolesList[0];

  const userPermissions = currentRoleObj ? currentRoleObj.permissions : [];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo USD');

  // Datos para crédito / cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDocument, setClientDocument] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [newName, setNewName] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Comida');
  const [newTaxable, setNewTaxable] = useState(true);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    localStorage.setItem('pos_credits', JSON.stringify(credits));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('pos_bcv', exchangeRate.toString());
  }, [exchangeRate]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('¡Producto agotado en inventario!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Has alcanzado el límite del stock disponible.');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    const productRef = products.find(p => p.id === id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (productRef && newQty > productRef.stock) {
          alert('Has alcanzado el límite del stock disponible.');
          return item;
        }
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
    if (!newName || !newPrice || !newCostPrice || !newStock) return;

    const newProd: Product = {
      id: Date.now(),
      name: newName,
      costPrice: parseFloat(newCostPrice) || 0,
      price: parseFloat(newPrice) || 0,
      category: newCategory,
      taxable: newTaxable,
      stock: parseInt(newStock) || 0,
    };

    setProducts(prev => [...prev, newProd]);
    setNewName('');
    setNewCostPrice('');
    setNewPrice('');
    setNewStock('');
    alert('¡Producto registrado con éxito!');
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const subtotalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalIvaUSD = cart.reduce((sum, item) => item.taxable ? sum + (item.price * item.quantity * IVA_RATE) : sum, 0);
  const totalUSD = subtotalUSD + totalIvaUSD;
  const totalBs = totalUSD * exchangeRate;

  const cashUSD = cashGivenUSD ? parseFloat(cashGivenUSD) : 0;
  const changeUSD = Math.max(0, cashUSD - totalUSD);
  const changeBs = changeUSD * exchangeRate;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Crédito / Fiado' && !clientName) {
      alert('Debe ingresar el nombre del cliente para registrar una venta a crédito.');
      return;
    }

    setProducts(prev => prev.map(prod => {
      const cartItem = cart.find(c => c.id === prod.id);
      if (cartItem) {
        return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
      }
      return prod;
    }));

    const saleId = Date.now();
    const newSale: SaleRecord = {
      id: saleId,
      date: new Date().toLocaleString(),
      items: [...cart],
      subtotalUSD,
      ivaUSD: totalIvaUSD,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      changeUSD,
      clientName: paymentMethod === 'Crédito / Fiado' ? clientName : undefined,
    };

    setSalesHistory(prev => [newSale, ...prev]);

    if (paymentMethod === 'Crédito / Fiado') {
      const newCredit: CreditAccount = {
        id: Date.now(),
        clientName,
        clientPhone: clientPhone || 'N/A',
        clientDocument: clientDocument || 'N/A',
        totalDebtUSD: totalUSD,
        totalDebtBs: totalBs,
        date: new Date().toLocaleString(),
        status: 'Pendiente',
        saleId,
      };
      setCredits(prev => [newCredit, ...prev]);
      alert(`¡Crédito registrado con éxito para ${clientName}!\nTotal: $${totalUSD.toFixed(2)} (Bs. ${totalBs.toFixed(2)})`);
    } else {
      alert(`¡Pago procesado con éxito!\nMétodo: ${paymentMethod}\nVuelto: $${changeUSD.toFixed(2)} (Bs. ${changeBs.toFixed(2)})`);
    }

    setCart([]);
    setCashGivenUSD('');
    setClientName('');
    setClientPhone('');
    setClientDocument('');
    setIsCheckoutModalOpen(false);
  };

  const payCredit = (creditId: number) => {
    setCredits(prev => prev.map(c => c.id === creditId ? { ...c, status: 'Pagado', totalDebtUSD: 0, totalDebtBs: 0 } : c));
    alert('¡Cuenta por cobrar saldada con éxito!');
  };

  const getMethodStats = (method: PaymentMethodType) => {
    const filtered = salesHistory.filter(s => s.paymentMethod === method);
    const count = filtered.length;
    const totalUSD = filtered.reduce((sum, s) => sum + s.totalUSD, 0);
    const totalBs = filtered.reduce((sum, s) => sum + s.totalBs, 0);
    return { count, totalUSD, totalBs };
  };

  const statsEfectivoUSD = getMethodStats('Efectivo USD');
  const statsEfectivoBs = getMethodStats('Efectivo Bs');
  const statsPagoMovil = getMethodStats('Pago Móvil');
  const statsZelle = getMethodStats('Zelle');
  const statsBinance = getMethodStats('Binance Pay');
  const statsCredito = getMethodStats('Crédito / Fiado');

  const totalSalesRevenueUSD = salesHistory.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalSalesRevenueBs = salesHistory.reduce((sum, s) => sum + s.totalBs, 0);
  const totalTaxesCollected = salesHistory.reduce((sum, s) => sum + s.ivaUSD, 0);
  const pendingCreditsUSD = credits.filter(c => c.status === 'Pendiente').reduce((sum, c) => sum + c.totalDebtUSD, 0);
  const pendingCreditsBs = credits.filter(c => c.status === 'Pendiente').reduce((sum, c) => sum + c.totalDebtBs, 0);

  const downloadReportZ = () => {
    const reportContent = `
========================================
       REPORTE DE CIERRE DE CAJA (Z)     
========================================
Fecha de Emisión: ${new Date().toLocaleString()}
Tasa BCV Aplicada: Bs. ${exchangeRate}
----------------------------------------
RESUMEN GENERAL:
- Transacciones Totales: ${salesHistory.length}
- Ingresos Totales (USD): $${totalSalesRevenueUSD.toFixed(2)}
- Ingresos Totales (Bs.): Bs. ${totalSalesRevenueBs.toFixed(2)}
- IVA Total Recaudado (16%): $${totalTaxesCollected.toFixed(2)}
- Cuentas por Cobrar Pendientes: $${pendingCreditsUSD.toFixed(2)}
----------------------------------------
DESGLOSE POR MÉTODO DE PAGO EN CAJA:
1. Efectivo USD ($): 
   - Transacciones: ${statsEfectivoUSD.count}
   - Monto: $${statsEfectivoUSD.totalUSD.toFixed(2)}
2. Pago Móvil (Bs.): 
   - Transacciones: ${statsPagoMovil.count}
   - Monto: Bs. ${statsPagoMovil.totalBs.toFixed(2)}
3. Zelle ($): 
   - Transacciones: ${statsZelle.count}
   - Monto: $${statsZelle.totalUSD.toFixed(2)}
4. Binance Pay (USDT): 
   - Transacciones: ${statsBinance.count}
   - Monto: $${statsBinance.totalUSD.toFixed(2)}
5. Crédito / Fiado: 
   - Transacciones: ${statsCredito.count}
   - Monto: $${statsCredito.totalUSD.toFixed(2)}
----------------------------------------
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Cierre_Z_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-blue-400">⚡ POS Enterprise Venezuela</span>
          <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            {userPermissions.includes('view_pos') && (
              <button 
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                🛒 Caja POS
              </button>
            )}
            {userPermissions.includes('view_inventory') && (
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                📦 Inventario
              </button>
            )}
            {userPermissions.includes('view_credits') && (
              <button 
                onClick={() => setActiveTab('credits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'credits' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                📒 Cuentas x Cobrar
              </button>
            )}
            {userPermissions.includes('view_reports') && (
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                📊 Reportes Z
              </button>
            )}
            {userPermissions.includes('manage_roles') && (
              <button 
                onClick={() => setActiveTab('roles')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'roles' ? 'bg-cyan-600 text-white' : 'text-cyan-400 hover:text-white bg-cyan-950/40 border border-cyan-800/50'}`}
              >
                🛡️ Roles y Personal
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Tasa BCV (Bs/$):</span>
            <input 
              type="number" 
              step="0.01"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              className="bg-slate-900 text-white font-bold w-20 px-2 py-0.5 rounded border border-slate-700 text-center focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              {currentUserObj?.name ? currentUserObj.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="font-semibold text-white leading-tight">{currentUserObj?.name || 'Usuario'}</div>
              <div className="text-[10px] text-blue-400 uppercase font-bold">ROL : {currentRoleObj?.name || 'Sin Rol'}</div>
            </div>
            <div className="ml-2 pl-2 border-l border-slate-800 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 hidden sm:inline">Cambiar Perfil:</span>
              <select 
                value={currentUsername}
                onChange={(e) => {
                  setCurrentUsername(e.target.value);
                  setActiveTab('pos'); // Al cambiar de perfil, aseguramos que vuelva a POS o pestaña por defecto
                }}
                className="bg-slate-900 text-xs text-white border border-slate-700 rounded px-2 py-1 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {usersList.map(u => {
                  // CORRECCIÓN: Búsqueda segura del rol por cada usuario en el select
                  const roleOfUser = rolesList.find(r => r.id.toLowerCase() === u.roleId?.toLowerCase());
                  return (
                    <option key={u.id} value={u.username}>
                      {u.name} ({roleOfUser?.name || u.roleId})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* VISTA 1: CAJA POS */}
      {activeTab === 'pos' && (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                placeholder="Buscar producto por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-1">
              {filteredProducts.map(product => {
                const priceBs = product.price * exchangeRate;
                const isOut = product.stock <= 0;
                return (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-slate-900 border p-4 rounded-2xl text-left transition flex flex-col justify-between group shadow-lg ${
                      isOut ? 'border-red-500/30 opacity-60 cursor-not-allowed' : 'border-slate-800 hover:border-blue-500/60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.taxable ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                          {product.taxable ? 'IVA 16%' : 'Exento'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-200 mt-2 text-sm group-hover:text-white transition">
                        {product.name}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <div className="font-bold text-blue-400 text-base">${product.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">Bs. {priceBs.toFixed(2)}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isOut ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                        Stk: {product.stock}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="text-lg font-bold mb-4 border-b border-slate-800 pb-3 flex justify-between items-center">
                <span>Ticket de Venta</span>
                <span className="text-xs font-normal text-slate-400">{cart.length} items</span>
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No hay productos en el ticket.
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

            <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>${subtotalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA (16%):</span>
                  <span>${totalIvaUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                  <span className="font-bold text-white">Total a Pagar:</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-400">${totalUSD.toFixed(2)}</div>
                    <div className="text-xs text-emerald-400 font-semibold">Bs. {totalBs.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsCheckoutModalOpen(true)}
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold transition shadow-lg ${
                  cart.length > 0 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Procesar Venta 💳
              </button>
            </div>
          </div>
        </main>
      )}

      {/* MODAL DE MÉTODOS DE PAGO Y CRÉDITO */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Confirmar Pago o Crédito</h3>
                <p className="text-xs text-slate-400">Seleccione el método de pago</p>
              </div>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-xl text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">Total a Cancelar</div>
                <div className="text-xl font-black text-blue-400">${totalUSD.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Equivalente BCV</div>
                <div className="text-sm font-bold text-emerald-400">Bs. {totalBs.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold text-blue-300"
                >
                  <option value="Efectivo USD">💵 Efectivo USD ($)</option>
                  <option value="Pago Móvil">📱 Pago Móvil (Bs.)</option>
                  <option value="Zelle">🌐 Zelle ($)</option>
                  <option value="Binance Pay">🪙 Binance Pay (USDT)</option>
                  <option value="Efectivo Bs">💵 Efectivo Bolívares (Bs.)</option>
                  <option value="Crédito / Fiado">📒 Crédito / Fiado (Cuentas x Cobrar)</option>
                </select>
              </div>

              {paymentMethod === 'Crédito / Fiado' ? (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-400">Datos del Cliente (Crédito)</div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Nombre y Apellido *</label>
                    <input 
                      type="text" 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Cédula / RIF</label>
                      <input 
                        type="text" 
                        value={clientDocument}
                        onChange={(e) => setClientDocument(e.target.value)}
                        placeholder="V-12345678"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Teléfono</label>
                      <input 
                        type="text" 
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="0414-0000000"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Efectivo Recibido / Referencia ($ o Bs)</label>
                  <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
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
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCheckout}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/30"
              >
                Completar Cobro ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: INVENTARIO */}
      {activeTab === 'inventory' && (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Inventario</h2>
            <span className="text-sm text-slate-400">Control de costos y márgenes</span>
          </div>

          {userPermissions.includes('edit_inventory') && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Registrar Nuevo Producto</h3>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                  <input 
                    type="text" required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej. Maltín Polar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Costo ($)</label>
                  <input 
                    type="number" step="0.01" required
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Venta ($)</label>
                  <input 
                    type="number" step="0.01" required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stock</label>
                  <input 
                    type="number" required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="0"
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
                    <option value="Comida">Comida</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Pasapalos">Pasapalos</option>
                    <option value="Víveres">Víveres</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input 
                    type="checkbox" id="tax"
                    checked={newTaxable}
                    onChange={(e) => setNewTaxable(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="tax" className="text-xs text-slate-300 font-medium cursor-pointer">Aplica IVA (16%)</label>
                </div>
                <div className="sm:col-span-2 lg:col-span-5 flex items-end">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition">
                    Guardar Producto
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Costo</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Margen</th>
                  <th className="p-4">Fiscalidad</th>
                  <th className="p-4">Stock</th>
                  {userPermissions.includes('edit_inventory') && <th className="p-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {products.map(prod => {
                  const margin = prod.costPrice > 0 ? (((prod.price - prod.costPrice) / prod.costPrice) * 100).toFixed(0) : 0;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-medium text-white">{prod.name}</td>
                      <td className="p-4"><span className="text-[10px] uppercase font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{prod.category}</span></td>
                      <td className="p-4 text-slate-400">${prod.costPrice.toFixed(2)}</td>
                      <td className="p-4 font-bold text-blue-400">${prod.price.toFixed(2)}</td>
                      <td className="p-4 text-emerald-400 font-semibold">{margin}%</td>
                      <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded ${prod.taxable ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>{prod.taxable ? 'Gravado (16%)' : 'Exento'}</span></td>
                      <td className="p-4"><span className={`font-bold px-2 py-1 rounded text-xs ${prod.stock <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200'}`}>{prod.stock} un.</span></td>
                      {userPermissions.includes('edit_inventory') && (
                        <td className="p-4 text-right">
                          <button onClick={() => deleteProduct(prod.id)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Eliminar</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* VISTA 3: CUENTAS POR COBRAR (FIADOS / APARTADOS) */}
      {activeTab === 'credits' && (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Módulo de Cuentas por Cobrar (Fiados)</h2>
              <span className="text-sm text-slate-400">Control de créditos otorgados y estatus de cobro a clientes</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right">
              <div className="text-xs text-slate-400">Total Pendiente:</div>
              <div className="text-base font-black text-amber-400">${pendingCreditsUSD.toFixed(2)} <span className="text-xs text-emerald-400">(Bs. {pendingCreditsBs.toFixed(2)})</span></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-200">Listado de Créditos de Clientes</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {credits.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No hay cuentas por cobrar registradas.
                </div>
              )}
              {credits.map(credit => (
                <div key={credit.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{credit.clientName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${credit.status === 'Pendiente' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {credit.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Doc: <strong className="text-slate-300">{credit.clientDocument}</strong> • Tel: <strong className="text-slate-300">{credit.clientPhone}</strong> • Fecha: {credit.date}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-bold text-amber-400">${credit.totalDebtUSD.toFixed(2)}</div>
                      <div className="text-xs text-emerald-400">Bs. {credit.totalDebtBs.toFixed(2)}</div>
                    </div>

                    {credit.status === 'Pendiente' && (
                      <button 
                        onClick={() => payCredit(credit.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
                      >
                        Saldar Cuenta 💰
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* VISTA 4: REPORTES Y CIERRE DE CAJA Z */}
      {activeTab === 'reports' && (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Reportes y Cierre de Caja (Z) Detallado</h2>
              <span className="text-sm text-slate-400">Auditoría por método de pago</span>
            </div>
            {salesHistory.length > 0 && (
              <button 
                onClick={downloadReportZ}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                📥 Descargar Reporte Z (TXT)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Ingresos Totales en Caja</div>
              <div className="text-2xl font-black text-blue-400">${totalSalesRevenueUSD.toFixed(2)}</div>
              <div className="text-xs text-emerald-400 mt-1 font-semibold">Bs. {totalSalesRevenueBs.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">IVA Total Recaudado (16%)</div>
              <div className="text-2xl font-black text-amber-400">${totalTaxesCollected.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Impuesto fiscal de ley</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Total Transacciones</div>
              <div className="text-2xl font-black text-emerald-400">{salesHistory.length}</div>
              <div className="text-xs text-slate-500 mt-1">Tickets procesados</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-blue-400 font-bold mb-1">💵 Efectivo USD</div>
              <div className="text-lg font-black">${statsEfectivoUSD.totalUSD.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">{statsEfectivoUSD.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-emerald-400 font-bold mb-1">📱 Pago Móvil</div>
              <div className="text-lg font-black">Bs. {statsPagoMovil.totalBs.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">{statsPagoMovil.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-purple-400 font-bold mb-1">🌐 Zelle</div>
              <div className="text-lg font-black">${statsZelle.totalUSD.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">{statsZelle.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-amber-400 font-bold mb-1">🪙 Binance Pay</div>
              <div className="text-lg font-black">${statsBinance.totalUSD.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">{statsBinance.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-teal-400 font-bold mb-1">📒 Créditos</div>
              <div className="text-lg font-black">${statsCredito.totalUSD.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">{statsCredito.count} operaciones</div>
            </div>
          </div>
        </main>
      )}

      {/* VISTA 5: MÓDULO DE ROLES Y PERSONAL */}
      {activeTab === 'roles' && (
        <RolesManagerModule />
      )}
    </div>
  );
}
