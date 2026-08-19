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
  items?: CartItem[];
  subtotalUSD?: number;
  ivaUSD?: number;
  totalUSD: number;
  totalBs?: number;
  exchangeRate?: number;
  paymentMethod: PaymentMethodType;
  changeUSD?: number;
  clientName?: string;
  created_at?: string; 
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

type PayableAccount = {
  id: number;
  providerName: string;
  providerDocument: string;
  description: string;
  totalDebtUSD: number;
  totalDebtBs: number;
  dueDate: string;
  date: string;
  status: 'Pendiente' | 'Pagado';
};

const IVA_RATE = 0.16;

export default function DashboardPOS() {
  const [isMounted, setIsMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'accounts' | 'roles'>('pos');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [payables, setPayables] = useState<PayableAccount[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(778.33);

  const [currentUsername, setCurrentUsername] = useState<string>('admin');
  const [rolesList, setRolesList] = useState(getRoles());
  const [usersList, setUsersList] = useState(getUsers());

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState('');

  const [inventoryFilterMode, setInventoryFilterMode] = useState<'all' | 'low'>('all');

  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderDoc, setNewProviderDoc] = useState('');
  const [newPayableDesc, setNewPayableDesc] = useState('');
  const [newPayableAmountUSD, setNewPayableAmountUSD] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo USD');

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
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedCredits = localStorage.getItem('pos_credits');
      if (savedCredits) {
        try { setCredits(JSON.parse(savedCredits)); } catch (e) {}
      }
      const savedPayables = localStorage.getItem('pos_payables');
      if (savedPayables) {
        try { setPayables(JSON.parse(savedPayables)); } catch (e) {}
      }
      const savedBcv = localStorage.getItem('pos_bcv');
      if (savedBcv) {
        const parsedBcv = parseFloat(savedBcv);
        if (!isNaN(parsedBcv)) setExchangeRate(parsedBcv);
      }
    }
  }, []);

  useEffect(() => {
    async function loadCloudData() {
      try {
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);

        const salesRes = await fetch('/api/sales');
        const salesData = await salesRes.json();
        
        if (Array.isArray(salesData)) {
          const formattedSales = salesData.map(sale => ({
            id: sale.id,
            totalUSD: Number(sale.total_usd || sale.totalUSD || 0),
            paymentMethod: sale.payment_method || sale.paymentMethod || 'Efectivo USD',
            date: sale.created_at || sale.date || new Date().toISOString(),
            totalBs: Number(sale.total_usd || sale.totalUSD || 0) * exchangeRate,
            ivaUSD: 0
          }));
          setSalesHistory(formattedSales as SaleRecord[]);
        }
      } catch (error) {
        console.error("Error al sincronizar datos:", error);
      }
    }
    loadCloudData();
  }, [exchangeRate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRolesList(getRoles());
      setUsersList(getUsers());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentUserObj = usersList.find(u => u.username.toLowerCase() === currentUsername.toLowerCase()) || usersList[0];
  const currentRoleObj = rolesList.find(r => 
    r.id.toLowerCase() === currentUserObj?.roleId?.toLowerCase() ||
    r.name.toLowerCase() === currentUserObj?.roleId?.toLowerCase()
  ) || rolesList[0];
  const userPermissions = currentRoleObj ? currentRoleObj.permissions : [];

  useEffect(() => {
    const tabPermissionMap: Record<string, string[]> = {
      pos: ['view_pos'],
      inventory: ['view_inventory'],
      accounts: ['view_credits', 'view_payables', 'manage_roles'],
      reports: ['view_reports'],
      roles: ['manage_roles'],
    };

    const requiredPermissions = tabPermissionMap[activeTab] || [];
    const hasAccess = requiredPermissions.length === 0 || requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasAccess) {
      const availableTab = Object.keys(tabPermissionMap).find(tab => {
        const perms = tabPermissionMap[tab];
        return perms.some(p => userPermissions.includes(p));
      }) as 'pos' | 'inventory' | 'reports' | 'accounts' | 'roles' | undefined;

      if (availableTab && availableTab !== activeTab) {
        setActiveTab(availableTab);
      }
    }
  }, [currentUsername, currentRoleObj, userPermissions, activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_credits', JSON.stringify(credits));
      localStorage.setItem('pos_payables', JSON.stringify(payables));
      localStorage.setItem('pos_bcv', exchangeRate.toString());
    }
  }, [credits, payables, exchangeRate]);

  if (!isMounted) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando POS...</div>;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert('¡Producto agotado!');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
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
        if (productRef && newQty > productRef.stock) return item;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newCostPrice || !newStock) return;
    const newProdPayload = {
      name: newName,
      costPrice: parseFloat(newCostPrice) || 0,
      price: parseFloat(newPrice) || 0,
      category: newCategory,
      taxable: newTaxable,
      stock: parseInt(newStock) || 0,
    };
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProdPayload)
      });
      const data = await res.json();
      if (data.success) {
        const prodRes = await fetch('/api/products');
        setProducts(await prodRes.json());
        setNewName(''); setNewCostPrice(''); setNewPrice(''); setNewStock('');
        alert('¡Producto registrado!');
      }
    } catch (error) {}
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const prodRes = await fetch('/api/products');
        setProducts(await prodRes.json());
      }
    } catch (error) {}
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock || !restockAmount) return;
    const amount = parseInt(restockAmount) || 0;
    const newStockTotal = selectedProductForRestock.stock + amount;
    try {
      const res = await fetch(`/api/products/${selectedProductForRestock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStockTotal })
      });
      if (res.ok) {
        const prodRes = await fetch('/api/products');
        setProducts(await prodRes.json());
        setIsRestockModalOpen(false);
        setRestockAmount('');
      }
    } catch (error) {}
  };

  const exportInventoryToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Producto,Categoria,Costo_USD,Precio_USD,Stock,Gravado_IVA\n";
    products.forEach(p => {
      csvContent += `${p.id},"${p.name}","${p.category}",${p.costPrice},${p.price},${p.stock},${p.taxable ? 'SI' : 'NO'}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `inventario_${Date.now()}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const subtotalUSD = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const totalIvaUSD = cart.reduce((sum, item) => item.taxable ? sum + ((item.price || 0) * item.quantity * IVA_RATE) : sum, 0);
  const totalUSD = subtotalUSD + totalIvaUSD;
  const totalBs = totalUSD * exchangeRate;

  const cashUSD = cashGivenUSD ? parseFloat(cashGivenUSD) : 0;
  const changeUSD = Math.max(0, cashUSD - totalUSD);
  const changeBs = changeUSD * exchangeRate;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Crédito / Fiado' && !clientName) return alert('Debe ingresar el nombre del cliente.');
    const salePayload = {
      date: new Date().toISOString(),
      subtotalUSD,
      ivaUSD: totalIvaUSD,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      changeUSD,
      clientName: paymentMethod === 'Crédito / Fiado' ? clientName : 'Generico',
      items: cart
    };
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });
      const result = await res.json();
      if (result.success) {
        setProducts(prev => prev.map(prod => {
          const cItem = cart.find(c => c.id === prod.id);
          return cItem ? { ...prod, stock: Math.max(0, prod.stock - cItem.quantity) } : prod;
        }));
        
        const salesRes = await fetch('/api/sales');
        const salesData = await salesRes.json();
        const formattedSales = Array.isArray(salesData) ? salesData.map(sale => ({
          id: sale.id,
          totalUSD: Number(sale.total_usd || sale.totalUSD || 0),
          paymentMethod: sale.payment_method || sale.paymentMethod || 'Efectivo USD',
          date: sale.created_at || sale.date || new Date().toISOString(),
          totalBs: Number(sale.total_usd || sale.totalUSD || 0) * exchangeRate,
          ivaUSD: 0
        })) : [];
        setSalesHistory(formattedSales as SaleRecord[]);

        if (paymentMethod === 'Crédito / Fiado') {
          setCredits(prev => [{
            id: Date.now(), clientName, clientPhone: clientPhone || 'N/A', clientDocument: clientDocument || 'N/A',
            totalDebtUSD: totalUSD, totalDebtBs: totalBs, date: new Date().toISOString(), status: 'Pendiente', saleId: result.saleId
          }, ...prev]);
        }
        setCart([]); setCashGivenUSD(''); setClientName(''); setIsCheckoutModalOpen(false);
      }
    } catch (error) {}
  };

  const payCredit = (id: number) => setCredits(prev => prev.map(c => c.id === id ? { ...c, status: 'Pagado', totalDebtUSD: 0, totalDebtBs: 0 } : c));

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newPayableAmountUSD) return;
    const amountUSD = parseFloat(newPayableAmountUSD) || 0;
    setPayables(prev => [{
      id: Date.now(), providerName: newProviderName, providerDocument: newProviderDoc || 'J-000',
      description: newPayableDesc || 'Mercancía', totalDebtUSD: amountUSD, totalDebtBs: amountUSD * exchangeRate,
      dueDate: newDueDate || 'Sin límite', date: new Date().toLocaleDateString(), status: 'Pendiente'
    }, ...prev]);
    setNewProviderName(''); setNewPayableAmountUSD('');
  };

  const payPayable = (id: number) => setPayables(prev => prev.map(p => p.id === id ? { ...p, status: 'Pagado', totalDebtUSD: 0, totalDebtBs: 0 } : p));

  const pendingCreditsUSD = credits.filter(c => c.status === 'Pendiente').reduce((sum, c) => sum + (c.totalDebtUSD || 0), 0);
  const pendingPayablesUSD = payables.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + (p.totalDebtUSD || 0), 0);

  const totalSalesRevenueUSD = salesHistory.reduce((sum, s) => sum + Number(s.totalUSD || 0), 0);
  const totalSalesRevenueBs = salesHistory.reduce((sum, s) => sum + Number(s.totalBs || 0), 0);
  const totalTaxesCollected = salesHistory.reduce((sum, s) => sum + Number(s.ivaUSD || 0), 0);

  const getMethodStats = (method: string) => {
    const filtered = salesHistory.filter(s => {
      const sMethod = s.paymentMethod as string;
      if (method === 'Efectivo USD' && (sMethod === 'Efectivo' || sMethod === 'Efectivo USD')) return true;
      if (method === 'Pago Móvil' && (sMethod === 'Pago Móvil' || sMethod === 'Pago Movil')) return true;
      return sMethod === method;
    });
    const count = filtered.length;
    const totalUSD = filtered.reduce((sum, s) => sum + Number(s.totalUSD || 0), 0);
    const totalBs = filtered.reduce((sum, s) => sum + Number(s.totalBs || 0), 0);
    return { count, totalUSD, totalBs };
  };

  const statsEfectivoUSD = getMethodStats('Efectivo USD');
  const statsPagoMovil = getMethodStats('Pago Móvil');
  const statsZelle = getMethodStats('Zelle');
  const statsBinance = getMethodStats('Binance Pay');
  const statsCredito = getMethodStats('Crédito / Fiado');

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
- Ingresos Totales (USD): $${Number(totalSalesRevenueUSD || 0).toFixed(2)}
- Ingresos Totales (Bs.): Bs. ${Number(totalSalesRevenueBs || 0).toFixed(2)}
- IVA Total Recaudado (16%): $${Number(totalTaxesCollected || 0).toFixed(2)}
- Cuentas por Cobrar Pendientes: $${Number(pendingCreditsUSD || 0).toFixed(2)}
- Cuentas por Pagar Pendientes: $${Number(pendingPayablesUSD || 0).toFixed(2)}
----------------------------------------`.trim();
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `Reporte_Z_${Date.now()}.txt`;
    link.click(); URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const inventoryProducts = products.filter(p => inventoryFilterMode === 'low' ? p.stock <= 5 : true);
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-blue-400">⚡ POS Enterprise Venezuela</span>
          <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button onClick={() => setActiveTab('pos')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'pos' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>🛒 Caja POS</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>📦 Inventario</button>
            <button onClick={() => setActiveTab('accounts')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'accounts' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>📒 Cuentas</button>
            <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>📊 Reportes Z</button>
            <button onClick={() => setActiveTab('roles')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'roles' ? 'bg-cyan-600 text-white' : 'text-cyan-400'}`}>🛡️ Roles</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Tasa BCV (Bs/$):</span>
            <input type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)} className="bg-slate-900 text-white w-20 px-2 text-center" />
          </div>
        </div>
      </header>

      {activeTab === 'pos' && (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
          <div className="lg:col-span-7 flex flex-col gap-4">
             <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm" />
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {filteredProducts.map(product => (
                 <button key={product.id} onClick={() => addToCart(product)} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left">
                   <div className="text-sm font-semibold">{product.name}</div>
                   <div className="font-bold text-blue-400">${Number(product.price).toFixed(2)}</div>
                 </button>
               ))}
             </div>
          </div>
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-bold mb-4">Ticket</h2>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center mb-2">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${Number(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 pt-4 mt-4">
              <div className="text-xl font-black text-blue-400">Total: ${Number(totalUSD).toFixed(2)}</div>
              <button onClick={() => setIsCheckoutModalOpen(true)} className="w-full mt-3 py-3 rounded-xl bg-blue-600 font-bold">Procesar Venta</button>
            </div>
          </div>
        </main>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6">
             <h3 className="font-bold mb-4">Confirmar Pago</h3>
             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded mb-4">
               <option value="Efectivo USD">Efectivo USD</option>
               <option value="Pago Móvil">Pago Móvil</option>
               <option value="Zelle">Zelle</option>
               <option value="Binance Pay">Binance Pay</option>
               <option value="Crédito / Fiado">Crédito / Fiado</option>
             </select>
             <button onClick={handleCheckout} className="w-full bg-blue-600 py-3 rounded font-bold">Completar Cobro</button>
           </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Reportes y Cierre de Caja (Z)</h2>
            <button onClick={downloadReportZ} className="bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold">📥 Descargar Reporte</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Ingresos Totales (Caja Fuerte)</div>
              <div className="text-2xl font-black text-blue-400">${Number(totalSalesRevenueUSD || 0).toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Cuentas x Cobrar Pendientes</div>
              <div className="text-2xl font-black text-amber-400">${Number(pendingCreditsUSD || 0).toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Cuentas x Pagar (Proveedores)</div>
              <div className="text-2xl font-black text-red-400">${Number(pendingPayablesUSD || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-blue-400 font-bold mb-1">💵 Efectivo USD</div>
              <div className="text-lg font-black">${Number(statsEfectivoUSD.totalUSD || 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">{statsEfectivoUSD.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-emerald-400 font-bold mb-1">📱 Pago Móvil</div>
              <div className="text-lg font-black">Bs. {Number(statsPagoMovil.totalBs || 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">{statsPagoMovil.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-purple-400 font-bold mb-1">🌐 Zelle</div>
              <div className="text-lg font-black">${Number(statsZelle.totalUSD || 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">{statsZelle.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-amber-400 font-bold mb-1">🪙 Binance Pay</div>
              <div className="text-lg font-black">${Number(statsBinance.totalUSD || 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">{statsBinance.count} operaciones</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-teal-400 font-bold mb-1">📒 Créditos</div>
              <div className="text-lg font-black">${Number(statsCredito.totalUSD || 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">{statsCredito.count} operaciones</div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
