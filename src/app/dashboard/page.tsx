'use client';
import { useState, useEffect } from 'react';
import RolesManagerModule from '../../components/RolesManagerModule';
import ReceiptTicket from '../../components/ReceiptTicket';
import {
  getRoles,
  getUsers,
  Permission,
  Role,
  User,
} from '../../utils/rolesManager';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Tipos de datos principales
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

// Mapeo de permisos por pestaña
const tabPermissionMap: Record<string, Permission[]> = {
  pos: ['view_pos'],
  inventory: [
    'view_inventory',
  ],
  accounts: [
    'view_credits',
    'view_payables',
    'manage_payables',
    'manage_roles',
  ],
  reports: [
    'view_reports',
  ],
  customers: [
    'view_pos',
  ],
  roles: [
    'manage_roles',
  ],
};

export default function DashboardPOS() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'accounts' | 'customers' | 'roles'>('pos');
  
  // Estados de datos
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Cable HDMI 2m', costPrice: 3.00, price: 6.00, category: 'Accesorios', taxable: true, stock: 25 },
    { id: 2, name: 'Cargador Tipo C Fast Charge', costPrice: 5.00, price: 12.00, category: 'Accesorios', taxable: true, stock: 15 },
    { id: 3, name: 'Audífonos Bluetooth TWS', costPrice: 8.00, price: 18.50, category: 'Audio', taxable: true, stock: 10 },
    { id: 4, name: 'Smartwatch Genérica', costPrice: 15.00, price: 30.00, category: 'Wearables', taxable: true, stock: 8 },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [payables, setPayables] = useState<PayableAccount[]>([]);
  
  // Configuración financiera y usuario
  const [exchangeRate, setExchangeRate] = useState<number>(778.33);
  const [currentUsername, setCurrentUsername] = useState<string>('admin');
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Estados de interfaz y modales
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('Efectivo USD');
  const [amountReceivedUSD, setAmountReceivedUSD] = useState<string>('');
  const [clientNameInput, setClientNameInput] = useState<string>('');
  const [clientPhoneInput, setClientPhoneInput] = useState<string>('');
  const [clientDocInput, setClientDocInput] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  
  // Búsqueda en POS
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    setRolesList(getRoles());
    setUsersList(getUsers());
  }, []);

  if (!isMounted) return null;

  // ============================================================
  // USUARIO Y PERMISOS ACTUALES
  // ============================================================
  const currentUserObj = usersList.find(
    (user) =>
      String(user.username || '').toLowerCase() ===
      String(currentUsername || '').toLowerCase()
  ) || usersList[0];

  const currentRoleObj = rolesList.find(
    (role) =>
      role.id ===
        String(
          currentUserObj?.roleId ||
          currentUserObj?.role ||
          ''
        )
  ) || rolesList[0];

  const userPermissions: Permission[] =
    currentRoleObj?.permissions || ['view_pos'];

  const requiredPermissions = tabPermissionMap[activeTab] || [];
  const hasAccess =
    currentUsername === 'admin' ||
    requiredPermissions.length === 0 ||
    requiredPermissions.some(
      (permission) =>
        userPermissions.includes(permission)
    );

  const canView = (perm: Permission) => userPermissions.includes(perm) || currentUsername === 'admin';

  // Lógica del Carrito
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('No hay más stock disponible para este producto.');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    const product = products.find(p => p.id === id);
    if (product && qty > product.stock) {
      alert('La cantidad supera el stock actual.');
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Cálculos de Totales
  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ivaUSD = cart.reduce((acc, item) => item.taxable ? acc + (item.price * item.quantity * IVA_RATE) : acc, 0);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * exchangeRate;

  const numericReceivedUSD = parseFloat(amountReceivedUSD) || 0;
  const changeUSD = selectedPaymentMethod === 'Efectivo USD' ? Math.max(0, numericReceivedUSD - totalUSD) : 0;

  // Procesar Venta
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    if (selectedPaymentMethod === 'Efectivo USD' && numericReceivedUSD < totalUSD) {
      alert('El monto recibido en efectivo es menor al total a pagar.');
      return;
    }

    const newSaleId = Date.now();
    const newSale: SaleRecord = {
      id: newSaleId,
      date: new Date().toISOString(),
      items: [...cart],
      subtotalUSD,
      ivaUSD,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod: selectedPaymentMethod,
      changeUSD,
      clientName: clientNameInput.trim() || 'Cliente General',
      created_at: new Date().toLocaleString()
    };

    // Descontar inventario
    setProducts(prevProducts => 
      prevProducts.map(p => {
        const cartItem = cart.find(ci => ci.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.quantity };
        }
        return p;
      })
    );

    // Si es Crédito / Fiado, registrar en cuentas por cobrar
    if (selectedPaymentMethod === 'Crédito / Fiado') {
      if (!clientNameInput.trim() || !clientPhoneInput.trim()) {
        alert('Para ventas a crédito debe registrar al menos el Nombre y Teléfono del cliente.');
        return;
      }
      const newCredit: CreditAccount = {
        id: Date.now(),
        clientName: clientNameInput,
        clientPhone: clientPhoneInput,
        clientDocument: clientDocInput || 'N/A',
        totalDebtUSD: totalUSD,
        totalDebtBs: totalBs,
        date: new Date().toLocaleDateString(),
        status: 'Pendiente',
        saleId: newSaleId
      };
      setCredits(prev => [newCredit, ...prev]);
    }

    setSalesHistory(prev => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    setShowReceiptModal(true);

    // Limpiar carrito y campos
    setCart([]);
    setAmountReceivedUSD('');
    setClientNameInput('');
    setClientPhoneInput('');
    setClientDocInput('');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Barra Superior / Header */}
      <header className="bg-slate-900 text-white shadow px-6 py-3 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold tracking-wide">POS & Gestión Pro</h1>
          <span className="text-xs bg-indigo-600 px-2.5 py-1 rounded-full font-medium">Tasa: {exchangeRate.toFixed(2)} Bs/$</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Usuario:</span> <span className="font-semibold">{currentUsername}</span>
            <select 
              className="ml-2 bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-700"
              value={currentUsername}
              onChange={(e) => setCurrentUsername(e.target.value)}
            >
              <option value="admin">Admin (Global)</option>
              {usersList.map(u => (
                <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <nav className="bg-white border-b border-gray-200 px-6 flex space-x-6 overflow-x-auto">
        {canView('view_pos') && (
          <button 
            onClick={() => setActiveTab('pos')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Punto de Venta (POS)
          </button>
        )}
        {canView('view_inventory') && (
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Inventario
          </button>
        )}
        {canView('view_reports') && (
          <button 
            onClick={() => setActiveTab('reports')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Reportes y Ventas
          </button>
        )}
        {canView('view_credits') && (
          <button 
            onClick={() => setActiveTab('accounts')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'accounts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Cuentas (Créditos / Cuentas por Pagar)
          </button>
        )}
        {canView('view_pos') && (
          <button 
            onClick={() => setActiveTab('customers')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'customers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Clientes
          </button>
        )}
        {canView('manage_roles') && (
          <button 
            onClick={() => setActiveTab('roles')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Roles y Permisos
          </button>
        )}
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {!hasAccess ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 text-sm">No cuentas con los permisos necesarios para visualizar esta sección.</p>
          </div>
        ) : (
          <>
            {/* PESTAÑA: POS */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Listado de Productos */}
                <div className="lg:col-span-2 flex flex-col space-y-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <input 
                      type="text"
                      placeholder="Buscar producto por nombre o categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredProducts.map(prod => (
                      <div 
                        key={prod.id} 
                        onClick={() => addToCart(prod)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 cursor-pointer transition flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{prod.category}</span>
                          <h3 className="font-semibold text-gray-800 mt-2 text-sm line-clamp-2">{prod.name}</h3>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-indigo-600 font-bold">${prod.price.toFixed(2)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${prod.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Stock: {prod.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carrito y Cobro */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Carrito de Venta</h2>
                    
                    {cart.length === 0 ? (
                      <p className="text-gray-400 text-sm py-8 text-center">El carrito está vacío</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                            <div className="flex-1 pr-2">
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-xs text-gray-500">${item.price.toFixed(2)} c/u</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => updateCartQty(item.id, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded font-bold text-xs">-</button>
                              <span className="text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.id, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded font-bold text-xs">+</button>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-500 font-bold text-xs ml-2">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="mt-6 border-t pt-4 space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span>${subtotalUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>IVA (16%):</span>
                        <span>${ivaUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
                        <span>Total USD:</span>
                        <span className="text-indigo-600">${totalUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-gray-700">
                        <span>Total Bs:</span>
                        <span>Bs. {totalBs.toFixed(2)}</span>
                      </div>

                      {/* Datos del Cliente */}
                      <div className="space-y-2 pt-2">
                        <input 
                          type="text"
                          placeholder="Nombre del cliente"
                          value={clientNameInput}
                          onChange={(e) => setClientNameInput(e.target.value)}
                          className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {selectedPaymentMethod === 'Crédito / Fiado' && (
                          <>
                            <input 
                              type="text"
                              placeholder="Teléfono (Requerido para crédito)"
                              value={clientPhoneInput}
                              onChange={(e) => setClientPhoneInput(e.target.value)}
                              className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input 
                              type="text"
                              placeholder="Cédula / Documento"
                              value={clientDocInput}
                              onChange={(e) => setClientDocInput(e.target.value)}
                              className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </>
                        )}
                      </div>

                      {/* Método de Pago */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Método de Pago</label>
                        <select 
                          value={selectedPaymentMethod}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethodType)}
                          className="w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Efectivo USD">Efectivo USD</option>
                          <option value="Efectivo Bs">Efectivo Bs</option>
                          <option value="Pago Móvil">Pago Móvil</option>
                          <option value="Zelle">Zelle</option>
                          <option value="Binance Pay">Binance Pay</option>
                          <option value="Crédito / Fiado">Crédito / Fiado</option>
                        </select>
                      </div>

                      {selectedPaymentMethod === 'Efectivo USD' && (
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-600">Efectivo Recibido ($)</label>
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={amountReceivedUSD}
                            onChange={(e) => setAmountReceivedUSD(e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {numericReceivedUSD >= totalUSD && (
                            <p className="text-xs font-semibold text-green-600 mt-1">Cambio: ${changeUSD.toFixed(2)}</p>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={handleCheckout}
                        className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm"
                      >
                        Completar Venta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA: INVENTARIO */}
            {activeTab === 'inventory' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Gestión de Inventario</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 uppercase text-xs text-gray-700 border-b">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3">Costo ($)</th>
                        <th className="px-4 py-3">Precio ($)</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Gravado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.id}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                          <td className="px-4 py-3">{p.category}</td>
                          <td className="px-4 py-3">${p.costPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 font-semibold text-indigo-600">${p.price.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3">{p.taxable ? 'Sí' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PESTAÑA: REPORTES */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Ventas Totales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ${salesHistory.reduce((acc, s) => acc + s.totalUSD, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Transacciones</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{salesHistory.length}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Tasa de Cambio Activa</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{exchangeRate.toFixed(2)} Bs/$</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Historial de Ventas</h2>
                  {salesHistory.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4">No hay ventas registradas aún.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 uppercase text-xs text-gray-700 border-b">
                          <tr>
                            <th className="px-4 py-3">ID Venta</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Método</th>
                            <th className="px-4 py-3">Total USD</th>
                            <th className="px-4 py-3">Total Bs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesHistory.map(sale => (
                            <tr key={sale.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{sale.id}</td>
                              <td className="px-4 py-3">{sale.created_at}</td>
                              <td className="px-4 py-3">{sale.clientName}</td>
                              <td className="px-4 py-3 font-medium text-indigo-600">{sale.paymentMethod}</td>
                              <td className="px-4 py-3 font-bold text-gray-900">${sale.totalUSD.toFixed(2)}</td>
                              <td className="px-4 py-3">Bs. {sale.totalBs.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA: CUENTAS (CRÉDITOS Y PAGOS) */}
            {activeTab === 'accounts' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Cuentas por Cobrar (Créditos / Fiados)</h2>
                {credits.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4">No hay créditos pendientes registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 uppercase text-xs text-gray-700 border-b">
                        <tr>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Teléfono</th>
                          <th className="px-4 py-3">Documento</th>
                          <th className="px-4 py-3">Deuda USD</th>
                          <th className="px-4 py-3">Deuda Bs</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {credits.map(c => (
                          <tr key={c.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{c.clientName}</td>
                            <td className="px-4 py-3">{c.clientPhone}</td>
                            <td className="px-4 py-3">{c.clientDocument}</td>
                            <td className="px-4 py-3 font-bold text-red-600">${c.totalDebtUSD.toFixed(2)}</td>
                            <td className="px-4 py-3">Bs. {c.totalDebtBs.toFixed(2)}</td>
                            <td className="px-4 py-3">{c.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA: CLIENTES */}
            {activeTab === 'customers' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Directorio de Clientes</h2>
                <p className="text-sm text-gray-500">Visualiza el historial y datos de tus clientes registrados en ventas y créditos.</p>
              </div>
            )}

            {/* PESTAÑA: ROLES Y PERMISOS */}
            {activeTab === 'roles' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <RolesManagerModule />
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Ticket de Venta */}
      {showReceiptModal && lastCompletedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¡Venta Exitosa!</h3>
            <p className="text-sm text-gray-500 mb-4">La transacción se ha procesado correctamente.</p>
            
            <div className="border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50 mb-4 text-sm space-y-2">
              <p className="font-semibold text-gray-800">Recibo #{lastCompletedSale.id}</p>
              <p className="text-xs text-gray-500">{lastCompletedSale.created_at}</p>
              <p className="text-xs">Cliente: <span className="font-medium">{lastCompletedSale.clientName}</span></p>
              <p className="text-xs">Método: <span className="font-medium">{lastCompletedSale.paymentMethod}</span></p>
              <div className="border-t pt-2 space-y-1">
                {lastCompletedSale.items.map(i => (
                  <div key={i.id} className="flex justify-between text-xs">
                    <span>{i.quantity}x {i.name}</span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="text-indigo-600">${lastCompletedSale.totalUSD.toFixed(2)} (Bs. {lastCompletedSale.totalBs.toFixed(2)})</span>
              </div>
              {lastCompletedSale.changeUSD > 0 && (
                <div className="flex justify-between text-xs text-green-600 font-semibold">
                  <span>Cambio entregado:</span>
                  <span>${lastCompletedSale.changeUSD.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 font-medium py-2 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
