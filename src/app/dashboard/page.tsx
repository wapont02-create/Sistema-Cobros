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
        try { setCredits(JSON.parse(savedCredits)); } catch (e) { console.error(e); }
      }
      const savedPayables = localStorage.getItem('pos_payables');
      if (savedPayables) {
        try { setPayables(JSON.parse(savedPayables)); } catch (e) { console.error(e); }
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
            items: sale.items || [],
            subtotalUSD: Number(sale.subtotal_usd || sale.subtotalUSD || 0),
            ivaUSD: Number(sale.iva_usd || sale.ivaUSD || 0),
            totalUSD: Number(sale.total_usd || sale.totalUSD || 0),
            totalBs: Number(sale.total_bs || sale.totalBs || (Number(sale.total_usd || sale.totalUSD || 0) * exchangeRate)),
            exchangeRate: Number(sale.exchange_rate || sale.exchangeRate || exchangeRate),
            paymentMethod: sale.payment_method || sale.paymentMethod || 'Efectivo USD',
            changeUSD: Number(sale.change_usd || sale.changeUSD || 0),
            clientName: sale.client_name || sale.clientName || 'Cliente Genérico',
            date: sale.created_at || sale.date || new Date().toLocaleString()
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
    }
  }, [credits]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_payables', JSON.stringify(payables));
    }
  }, [payables]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_bcv', exchangeRate.toString());
    }
  }, [exchangeRate]);

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">Cargando POS...</div>;

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
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
        setNewName(''); setNewCostPrice(''); setNewPrice(''); setNewStock('');
        alert('¡Producto registrado con éxito en la nube!');
      } else {
        alert('Error al guardar el producto: ' + data.error);
      }
    } catch (error) {
      console.error("Error al registrar producto:", error);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto de la base de datos?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      let data = {};
      try { data = await res.json(); } catch (err) { /* sin json */ }

      if (res.ok || (data as any).success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
        alert('¡Producto eliminado con éxito de la nube!');
      } else {
        alert('Error al eliminar el producto: ' + ((data as any).error || 'Desconocido'));
      }
    } catch (error) {
      console.error("Error de conexión al eliminar producto:", error);
      alert('Error de conexión al intentar eliminar el producto.');
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock || !restockAmount) return;
    const amount = parseInt(restockAmount) || 0;
    if (amount <= 0) return;
    const newStockTotal = selectedProductForRestock.stock + amount;
    try {
      const res = await fetch(`/api/products/${selectedProductForRestock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStockTotal })
      });
      const data = await res.json();
      if (res.ok || data.success) {
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
        alert(`¡Se han añadido ${amount} unidades a "${selectedProductForRestock.name}" con éxito!`);
        setIsRestockModalOpen(false);
        setSelectedProductForRestock(null);
        setRestockAmount('');
      } else {
        alert('Error al actualizar el stock en la nube.');
      }
    } catch (error) {
      console.error("Error al reponer stock:", error);
    }
  };

  const exportInventoryToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Producto,Categoria,Costo_USD,Precio_USD,Stock,Gravado_IVA\n";
    products.forEach(p => {
      const row = [p.id, `"${p.name}"`, `"${p.category}"`, p.costPrice, p.price, p.stock, p.taxable ? 'SI' : 'NO'];
      csvContent += row.join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_pos_${Date.now()}.csv`);
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
    if (paymentMethod === 'Crédito / Fiado' && !clientName) {
      alert('Debe ingresar el nombre del cliente para registrar una venta a crédito.');
      return;
    }
    const salePayload = {
      date: new Date().toLocaleString(),
      subtotalUSD,
      ivaUSD: totalIvaUSD,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      changeUSD,
      clientName: paymentMethod === 'Crédito / Fiado' ? clientName : 'Cliente Genérico',
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
        for (const item of cart) {
          const productRef = products.find(p => p.id === item.id);
          if (productRef) {
            const newStock = Math.max(0, productRef.stock - item.quantity);
            await fetch(`/api/products/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stock: newStock })
            });
          }
        }

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);

        const salesRes = await fetch('/api/sales');
        const salesData = await salesRes.json();
        if (Array.isArray(salesData)) {
          const formattedSales = salesData.map(sale => ({
            id: sale.id,
            items: sale.items || [],
            subtotalUSD: Number(sale.subtotal_usd || sale.subtotalUSD || 0),
            ivaUSD: Number(sale.iva_usd || sale.ivaUSD || 0),
            totalUSD: Number(sale.total_usd || sale.totalUSD || 0),
            totalBs: Number(sale.total_bs || sale.totalBs || (Number(sale.total_usd || sale.totalUSD || 0) * exchangeRate)),
            exchangeRate: Number(sale.exchange_rate || sale.exchangeRate || exchangeRate),
            paymentMethod: sale.payment_method || sale.paymentMethod || 'Efectivo USD',
            changeUSD: Number(sale.change_usd || sale.changeUSD || 0),
            clientName: sale.client_name || sale.clientName || 'Cliente Genérico',
            date: sale.created_at || sale.date || new Date().toLocaleString()
          }));
          setSalesHistory(formattedSales as SaleRecord[]);
        }

        if (paymentMethod === 'Crédito / Fiado') {
          const newCredit: CreditAccount = {
            id: Date.now(), clientName, clientPhone: clientPhone || 'N/A', clientDocument: clientDocument || 'N/A',
            totalDebtUSD: totalUSD, totalDebtBs: totalBs, date: new Date().toLocaleString(), status: 'Pendiente', saleId: result.saleId,
          };
          setCredits(prev => [newCredit, ...prev]);
          alert(`¡Crédito registrado con éxito para ${clientName}!`);
        } else {
          alert(`¡Pago procesado con éxito!\nVuelto: $${Number(changeUSD || 0).toFixed(2)}`);
        }

        setCart([]); setCashGivenUSD(''); setClientName(''); setClientPhone(''); setClientDocument(''); setIsCheckoutModalOpen(false);
      } else {
        alert('Error al procesar la venta: ' + result.error);
      }
    } catch (error) {
      console.error("Error al procesar venta:", error);
    }
  };

  const payCredit = (creditId: number) => {
    setCredits(prev => prev.map(c => c.id === creditId ? { ...c, status: 'Pagado', totalDebtUSD: 0, totalDebtBs: 0 } : c));
    alert('¡Cuenta por cobrar saldada con éxito!');
  };

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newPayableAmountUSD) return;
    const amountUSD = parseFloat(newPayableAmountUSD) || 0;
    const newPayable: PayableAccount = {
      id: Date.now(), providerName: newProviderName, providerDocument: newProviderDoc || 'J-00000000-0',
      description: newPayableDesc || 'Compra de mercancía', totalDebtUSD: amountUSD, totalDebtBs: amountUSD * exchangeRate,
      dueDate: newDueDate || 'Sin fecha límite', date: new Date().toLocaleDateString(), status: 'Pendiente',
    };
    setPayables(prev => [newPayable, ...prev]);
    setNewProviderName(''); setNewProviderDoc(''); setNewPayableDesc(''); setNewPayableAmountUSD(''); setNewDueDate('');
    alert('¡Cuenta por pagar registrada con éxito!');
  };

  const payPayable = (payableId: number) => {
    setPayables(prev => prev.map(p => p.id === payableId ? { ...p, status: 'Pagado', totalDebtUSD: 0, totalDebtBs: 0 } : p));
    alert('¡Cuenta por pagar saldada con éxito!');
  };

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
    const link = document.createElement('a'); link.href = url; link.download = `Reporte_Cierre_Z_${Date.now()}.txt`;
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-blue-600">⚡ POS Enterprise Venezuela</span>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button onClick={() => setActiveTab('pos')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}>🛒 Caja POS</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}>
              📦 Inventario
              {lowStockCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">{lowStockCount}</span>}
            </button>
            <button onClick={() => setActiveTab('accounts')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'accounts' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}>📒 Cuentas (Cobrar/Pagar)</button>
            <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}>📊 Reportes Z</button>
            <button onClick={() => setActiveTab('roles')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'roles' ? 'bg-cyan-600 text-white shadow' : 'text-cyan-700 hover:text-cyan-900 bg-cyan-50 border border-cyan-200'}`}>🛡️ Roles y Personal</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-sm">
            <span className="text-slate-600">Tasa BCV (Bs/$):</span>
            <input type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)} className="bg-slate-50 text-slate-900 font-bold w-20 px-2 py-0.5 rounded border border-slate-300 text-center" />
          </div>

          <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">{currentUserObj?.name ? currentUserObj.name.charAt(0) : 'U'}</div>
            <div>
              <div className="font-semibold text-slate-900 leading-tight">{currentUserObj?.name || 'Usuario'}</div>
              <div className="text-[10px] text-blue-600 uppercase font-bold">ROL : {currentRoleObj?.name || 'Sin Rol'}</div>
            </div>
            <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-1.5">
              <select value={currentUsername} onChange={(e) => setCurrentUsername(e.target.value)} className="bg-slate-50 text-xs text-slate-800 border border-slate-300 rounded px-2 py-1 font-medium cursor-pointer">
                {usersList.map(u => {
                  const roleOfUser = rolesList.find(r => r.id.toLowerCase() === u.roleId?.toLowerCase() || r.name.toLowerCase() === u.roleId?.toLowerCase());
                  return <option key={u.id} value={u.username}>{u.name} ({roleOfUser?.name || u.roleId})</option>;
                })}
              </select>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'pos' && (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Buscar producto por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:border-blue-500" />
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-1">
              {filteredProducts.map(product => {
                const priceBs = (product.price || 0) * exchangeRate;
                const isOut = product.stock <= 0;
                return (
                  <button key={product.id} onClick={() => addToCart(product)} className={`bg-white border p-4 rounded-2xl text-left transition flex flex-col justify-between group shadow-sm hover:shadow-md ${isOut ? 'border-red-300 opacity-60 cursor-not-allowed bg-red-50/20' : 'border-slate-200 hover:border-blue-400'}`}>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{product.category}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.taxable ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>{product.taxable ? 'IVA 16%' : 'Exento'}</span>
                      </div>
                      <div className="font-semibold text-slate-800 mt-2 text-sm">{product.name}</div>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <div className="font-bold text-blue-600 text-base">${Number(product.price || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Bs. {Number(priceBs || 0).toFixed(2)}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isOut ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>Stk: {product.stock}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <h2 className="text-lg font-bold mb-4 border-b border-slate-200 pb-3 flex justify-between items-center text-slate-900">
                <span>Ticket de Venta</span>
                <span className="text-xs font-normal text-slate-500">{cart.length} items</span>
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No hay productos en el ticket.</div>}
                {cart.map(item => {
                  const itemTotalUSD = (item.price || 0) * item.quantity;
                  const itemTotalBs = itemTotalUSD * exchangeRate;
                  return (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center">
                      <div className="flex-1 pr-2">
                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-blue-600">${Number(item.price || 0).toFixed(2)} c/u</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white shadow-sm">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-l-lg text-xs">-</button>
                          <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-r-lg text-xs">+</button>
                        </div>
                        <div className="text-right w-20">
                          <div className="text-sm font-bold text-slate-900">${Number(itemTotalUSD || 0).toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400">Bs. {Number(itemTotalBs || 0).toFixed(2)}</div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 text-xs ml-1">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>${Number(subtotalUSD || 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600"><span>IVA (16%):</span><span>${Number(totalIvaUSD || 0).toFixed(2)}</span></div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total a Pagar:</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-600">${Number(totalUSD || 0).toFixed(2)}</div>
                    <div className="text-xs text-emerald-600 font-semibold">Bs. {Number(totalBs || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsCheckoutModalOpen(true)} disabled={cart.length === 0} className={`w-full py-3.5 rounded-xl font-bold transition shadow-md ${cart.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                Procesar Venta 💳
              </button>
            </div>
          </div>
        </main>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Confirmar Pago o Crédito</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-500 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-xs transition">✕</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-500">Total a Cancelar</div>
                <div className="text-xl font-black text-blue-600">${Number(totalUSD || 0).toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Equivalente BCV</div>
                <div className="text-sm font-bold text-emerald-600">Bs. {Number(totalBs || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Método de Pago</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500">
                  <option value="Efectivo USD">💵 Efectivo USD ($)</option>
                  <option value="Pago Móvil">📱 Pago Móvil (Bs.)</option>
                  <option value="Zelle">🌐 Zelle ($)</option>
                  <option value="Binance Pay">🪙 Binance Pay (USDT)</option>
                  <option value="Crédito / Fiado">📒 Crédito / Fiado (Cuentas x Cobrar)</option>
                </select>
              </div>

              {paymentMethod === 'Crédito / Fiado' ? (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="text-xs font-bold text-amber-700">Datos del Cliente (Crédito)</div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Nombre y Apellido *</label>
                    <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ej. Juan Pérez" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Cédula / RIF</label>
                      <input type="text" value={clientDocument} onChange={(e) => setClientDocument(e.target.value)} placeholder="V-12345678" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Teléfono</label>
                      <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="0414-0000000" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Efectivo Recibido ($)</label>
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5">
                    <input type="number" step="0.1" value={cashGivenUSD} onChange={(e) => setCashGivenUSD(e.target.value)} placeholder="0.00" className="bg-transparent text-slate-900 focus:outline-none w-full text-sm" />
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Vuelto: <strong className="text-emerald-600">${Number(changeUSD || 0).toFixed(2)}</strong></span>
                      <div className="text-[10px] text-slate-400">Bs. {Number(changeBs || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition">Cancelar</button>
              <button onClick={handleCheckout} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-md">Completar Cobro ⚡</button>
            </div>
          </div>
        </div>
      )}

      {isRestockModalOpen && selectedProductForRestock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Reponer Inventario</h3>
              <button onClick={() => { setIsRestockModalOpen(false); setSelectedProductForRestock(null); }} className="text-slate-500 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-xs transition">✕</button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">Producto:</div>
              <div className="font-bold text-blue-600 text-sm">{selectedProductForRestock.name}</div>
              <div className="text-slate-500 pt-1">Stock Actual: <strong className="text-slate-800">{selectedProductForRestock.stock} unidades</strong></div>
            </div>
            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad a Agregar *</label>
                <input type="number" min="1" required value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} placeholder="Ej. 24" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setIsRestockModalOpen(false); setSelectedProductForRestock(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition">Sumar Stock 📦</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Gestión de Inventario</h2>
              <span className="text-sm text-slate-500">Control de costos, márgenes y alertas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white border border-slate-200 p-1 rounded-xl gap-1 shadow-sm">
                <button onClick={() => setInventoryFilterMode('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${inventoryFilterMode === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-600'}`}>Todos ({products.length})</button>
                <button onClick={() => setInventoryFilterMode('low')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${inventoryFilterMode === 'low' ? 'bg-red-600 text-white shadow' : 'text-slate-600'}`}>⚠️ Stock Bajo ({lowStockCount})</button>
              </div>
              <button onClick={exportInventoryToCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow flex items-center gap-1.5">📥 Exportar CSV</button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Registrar Nuevo Producto</h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-600 mb-1">Nombre</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej. Maltín Polar" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Costo ($)</label>
                <input type="number" step="0.01" required value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Venta ($)</label>
                <input type="number" step="0.01" required value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Stock</label>
                <input type="number" required value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Categoría</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900">
                  <option value="Comida">Comida</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Pasapalos">Pasapalos</option>
                  <option value="Víveres">Víveres</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="tax" checked={newTaxable} onChange={(e) => setNewTaxable(e.target.checked)} className="w-4 h-4 rounded bg-slate-50 border-slate-300 text-blue-600" />
                <label htmlFor="tax" className="text-xs text-slate-700 font-medium cursor-pointer">Aplica IVA (16%)</label>
              </div>
              <div className="sm:col-span-2 lg:col-span-5 flex items-end">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm">Guardar Producto</button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Costo</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Margen</th>
                  <th className="p-4">Fiscalidad</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {inventoryProducts.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">No hay productos que mostrar en este filtro.</td></tr>}
                {inventoryProducts.map(prod => {
                  const margin = (prod.costPrice || 0) > 0 ? (((prod.price - prod.costPrice) / prod.costPrice) * 100).toFixed(0) : 0;
                  const isLow = prod.stock <= 5;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                        {prod.name}
                        {isLow && <span className="bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">⚠️ Stock Bajo</span>}
                      </td>
                      <td className="p-4"><span className="text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{prod.category}</span></td>
                      <td className="p-4 text-slate-500">${Number(prod.costPrice || 0).toFixed(2)}</td>
                      <td className="p-4 font-bold text-blue-600">${Number(prod.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-emerald-600 font-semibold">{margin}%</td>
                      <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded ${prod.taxable ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>{prod.taxable ? 'Gravado (16%)' : 'Exento'}</span></td>
                      <td className="p-4"><span className={`font-bold px-2 py-1 rounded text-xs ${isLow ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-800'}`}>{prod.stock} un.</span></td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => { setSelectedProductForRestock(prod); setIsRestockModalOpen(true); }} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition">+ Stock</button>
                        <button onClick={() => deleteProduct(prod.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {activeTab === 'accounts' && (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Módulo de Cuentas (Cobrar y Pagar)</h2>
              <span className="text-sm text-slate-500">Gestión unificada de créditos a clientes (Fiados) y deudas con proveedores</span>
            </div>
            <div className="flex gap-3">
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-right shadow-sm">
                <div className="text-xs text-slate-500">Total x Cobrar:</div>
                <div className="text-sm font-black text-amber-600">${Number(pendingCreditsUSD || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-right shadow-sm">
                <div className="text-xs text-slate-500">Total x Pagar:</div>
                <div className="text-sm font-black text-red-600">${Number(pendingPayablesUSD || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-amber-600">📒 Cuentas por Cobrar (Clientes)</h3>
                  <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded">Pendientes: ${Number(pendingCreditsUSD || 0).toFixed(2)}</span>
                </div>
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {credits.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No hay cuentas por cobrar registradas.</div>}
                  {credits.map(credit => (
                    <div key={credit.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{credit.clientName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${credit.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{credit.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Doc: <strong className="text-slate-700">{credit.clientDocument}</strong> • Tel: <strong className="text-slate-700">{credit.clientPhone}</strong></div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-sm font-bold text-amber-600">${Number(credit.totalDebtUSD || 0).toFixed(2)}</div>
                          <div className="text-[10px] text-emerald-600">Bs. {Number(credit.totalDebtBs || 0).toFixed(2)}</div>
                        </div>
                        {credit.status === 'Pendiente' && <button onClick={() => payCredit(credit.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm">Saldar 💰</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-bold text-red-600">📥 Cuentas por Pagar (Proveedores)</h3>
                  <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-1 rounded">Pendientes: ${Number(pendingPayablesUSD || 0).toFixed(2)}</span>
                </div>
                <form onSubmit={handleAddPayable} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-blue-600">Registrar Nuevo Proveedor / Deuda</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" required value={newProviderName} onChange={(e) => setNewProviderName(e.target.value)} placeholder="Nombre Proveedor *" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900" />
                    <input type="text" value={newProviderDoc} onChange={(e) => setNewProviderDoc(e.target.value)} placeholder="RIF / Cédula" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" value={newPayableDesc} onChange={(e) => setNewPayableDesc(e.target.value)} placeholder="Concepto" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 sm:col-span-1" />
                    <input type="number" step="0.01" required value={newPayableAmountUSD} onChange={(e) => setNewPayableAmountUSD(e.target.value)} placeholder="Monto USD ($) *" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900" />
                    <input type="text" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} placeholder="Fecha Límite" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition shadow-sm">Guardar Cuenta x Pagar 📥</button>
                </form>

                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {payables.length === 0 && <div className="text-center py-6 text-slate-400 text-xs">No hay cuentas por pagar registradas.</div>}
                  {payables.map(payable => (
                    <div key={payable.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{payable.providerName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${payable.status === 'Pendiente' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{payable.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Concepto: <strong className="text-slate-700">{payable.description}</strong> • Vence: <strong className="text-amber-700">{payable.dueDate}</strong></div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">${Number(payable.totalDebtUSD || 0).toFixed(2)}</div>
                          <div className="text-[10px] text-emerald-600">Bs. {Number(payable.totalDebtBs || 0).toFixed(2)}</div>
                        </div>
                        {payable.status === 'Pendiente' && <button onClick={() => payPayable(payable.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm">Pagar ✅</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {activeTab === 'reports' && (
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Reportes y Cierre de Caja (Z) Detallado</h2>
              <span className="text-sm text-slate-500">Auditoría por método de pago y flujos de caja</span>
            </div>
            {salesHistory.length > 0 && (
              <button onClick={downloadReportZ} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2">
                📥 Descargar Reporte Z (TXT)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Ingresos Totales en Caja</div>
              <div className="text-2xl font-black text-blue-600">${Number(totalSalesRevenueUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-emerald-600 mt-1 font-semibold">Bs. {Number(totalSalesRevenueBs || 0).toFixed(2)}</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Cuentas x Cobrar Pendientes</div>
              <div className="text-2xl font-black text-amber-600">${Number(pendingCreditsUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">Fiados a clientes</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Cuentas x Pagar (Proveedores)</div>
              <div className="text-2xl font-black text-red-600">${Number(pendingPayablesUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">Deudas pendientes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-blue-600 font-bold mb-1">💵 Efectivo USD</div>
              <div className="text-lg font-black text-slate-900">${Number(statsEfectivoUSD.totalUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">{statsEfectivoUSD.count} operaciones</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-emerald-600 font-bold mb-1">📱 Pago Móvil</div>
              <div className="text-lg font-black text-slate-900">Bs. {Number(statsEfectivoUSD.totalBs || statsPagoMovil.totalBs || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">{statsPagoMovil.count} operaciones</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-purple-600 font-bold mb-1">🌐 Zelle</div>
              <div className="text-lg font-black text-slate-900">${Number(statsZelle.totalUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">{statsZelle.count} operaciones</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-amber-600 font-bold mb-1">🪙 Binance Pay</div>
              <div className="text-lg font-black text-slate-900">${Number(statsBinance.totalUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">{statsBinance.count} operaciones</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-teal-600 font-bold mb-1">📒 Créditos</div>
              <div className="text-lg font-black text-slate-900">${Number(statsCredito.totalUSD || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">{statsCredito.count} operaciones</div>
            </div>
          </div>
        </main>
      )}

      {activeTab === 'roles' && <RolesManagerModule />}
    </div>
  );
}
