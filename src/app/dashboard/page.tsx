'use client';
import { useState, useEffect } from 'react';
import RolesManagerModule from '../../components/RolesManagerModule';
import ReceiptTicket from '../../components/ReceiptTicket';
import {
  getRoles,
  getUsers,
  hasPermission,
  type Permission,
} from '../../utils/rolesManager';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

const tabPermissionMap: Record<string, Permission[]> = {
  pos: ['view_pos'],
  inventory: ['view_inventory', 'edit_inventory'],
  accounts: ['view_receivable', 'manage_roles'],
  reports: ['view_reports'],
  customers: ['view_pos'],
  roles: ['manage_roles'],
};

// Componente para buscar o registrar clientes rápidamente al facturar
function POSCustomerSelector({ onSelectCustomer }: { onSelectCustomer: (client: { name: string; document: string; phone: string }) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (query.length > 1) {
      fetch(`/api/customers?q=${query}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setResults(data);
            setShowDropdown(true);
          }
        })
        .catch(err => console.error("Error buscando clientes:", err));
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  const handleRegisterQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, rif_ci: newDoc, phone: newPhone })
      });
      const data = await res.json();
      if (data.success) {
        onSelectCustomer({ name: newName, document: newDoc || 'V-00000000', phone: newPhone || 'N/A' });
        setIsAddingNew(false);
        setQuery(newName);
        setNewName(''); setNewDoc(''); setNewPhone('');
        alert('¡Cliente registrado y seleccionado!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Buscar cliente registrado (Nombre / Cédula)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          />
          {showDropdown && results.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-1 shadow-lg max-h-40 overflow-y-auto rounded-lg text-xs">
              {results.map((c: any) => (
                <li
                  key={c.id}
                  className="p-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 flex justify-between items-center"
                  onClick={() => {
                    onSelectCustomer({ name: c.name, document: c.rif_ci || 'N/A', phone: c.phone || 'N/A' });
                    setQuery(c.name);
                    setShowDropdown(false);
                  }}
                >
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="text-slate-500">{c.rif_ci}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold transition"
        >
          {isAddingNew ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {isAddingNew && (
        <form onSubmit={handleRegisterQuickCustomer} className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 space-y-2">
          <div className="text-[11px] font-bold text-blue-800">Registrar Cliente Rápido</div>
          <input
            type="text"
            placeholder="Nombre y Apellido *"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Cédula / RIF"
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white rounded py-1.5 text-xs font-bold shadow-2xs">
            Guardar y Seleccionar ⚡
          </button>
        </form>
      )}
    </div>
  );
}

type CashRegisterSession = {
  id: number;
  status: 'Abierta' | 'Cerrada';
  openedAt: string;
  closedAt?: string;
  openingUSD: number;
  openingBs: number;
  countedUSD?: number;
  countedBs?: number;
  expectedUSD?: number;
  expectedBs?: number;
  differenceUSD?: number;
  differenceBs?: number;
};

const CASH_REGISTER_STORAGE_KEY = 'pos_enterprise_cash_register_session';

function CashRegisterModule({ exchangeRate }: { exchangeRate: number }) {
  const [register, setRegister] = useState<CashRegisterSession | null>(null);
  const [openingUSD, setOpeningUSD] = useState('');
  const [openingBs, setOpeningBs] = useState('');
  const [closingModal, setClosingModal] = useState(false);
  const [countedUSD, setCountedUSD] = useState('');
  const [countedBs, setCountedBs] = useState('');
  const [expectedUSD, setExpectedUSD] = useState(0);
  const [expectedBs, setExpectedBs] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CASH_REGISTER_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as CashRegisterSession;
      if (parsed?.status === 'Abierta') {
        setRegister(parsed);
        setOpeningUSD(String(parsed.openingUSD));
        setOpeningBs(String(parsed.openingBs));
      }
    } catch (error) {
      console.error('Error recuperando la caja:', error);
    }
  }, []);

  const isOpened = register?.status === 'Abierta';

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = Number(openingUSD || 0);
    const bs = Number(openingBs || 0);

    if (usd < 0 || bs < 0) {
      alert('El fondo inicial no puede ser negativo.');
      return;
    }
    if (usd === 0 && bs === 0) {
      alert('Ingrese al menos un fondo inicial en USD o Bs.');
      return;
    }

    const newSession: CashRegisterSession = {
      id: Date.now(),
      status: 'Abierta',
      openedAt: new Date().toISOString(),
      openingUSD: usd,
      openingBs: bs,
    };

    setRegister(newSession);
    localStorage.setItem(CASH_REGISTER_STORAGE_KEY, JSON.stringify(newSession));
    alert('¡Caja abierta exitosamente!');
  };

  const calculateExpectedCash = async () => {
    if (!register) return { usd: 0, bs: 0 };
    try {
      const response = await fetch('/api/sales');
      if (!response.ok) throw new Error('No se pudieron consultar las ventas.');
      const sales = await response.json();
      if (!Array.isArray(sales)) return { usd: register.openingUSD, bs: register.openingBs };

      const openingTime = new Date(register.openedAt).getTime();
      let cashUSD = register.openingUSD;
      let cashBs = register.openingBs;

      sales.forEach((sale: any) => {
        const saleDateValue = sale.created_at || sale.createdAt || sale.date;
        const saleTime = saleDateValue ? new Date(saleDateValue).getTime() : NaN;
        if (!Number.isFinite(saleTime) || saleTime < openingTime) return;

        const method = sale.payment_method || sale.paymentMethod || 'Efectivo USD';
        const totalUSD = Number(sale.total_usd ?? sale.totalUSD ?? 0) || 0;
        const totalBs = Number(sale.total_bs ?? sale.totalBs ?? 0) || 0;

        if (method === 'Efectivo USD' || method === 'Efectivo') {
          cashUSD += totalUSD;
        } else if (method === 'Efectivo Bs') {
          cashBs += totalBs || (totalUSD * exchangeRate);
        }
      });
      return { usd: cashUSD, bs: cashBs };
    } catch (error) {
      console.error('Error calculando efectivo esperado:', error);
      throw error;
    }
  };

  const openClosingModal = async () => {
    if (!register) return;
    setIsClosing(true);
    try {
      const expected = await calculateExpectedCash();
      setExpectedUSD(expected.usd);
      setExpectedBs(expected.bs);
      setClosingModal(true);
    } catch (error) {
      alert('No se pudo calcular el efectivo esperado.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!register) return;
    const actualUSD = Number(countedUSD || 0);
    const actualBs = Number(countedBs || 0);

    const differenceUSD = actualUSD - expectedUSD;
    const differenceBs = actualBs - expectedBs;
    const closedAt = new Date().toISOString();

    const closedSession: CashRegisterSession = {
      ...register,
      status: 'Cerrada',
      closedAt,
      countedUSD: actualUSD,
      countedBs: actualBs,
      expectedUSD,
      expectedBs,
      differenceUSD,
      differenceBs,
    };

    const historyKey = 'pos_enterprise_cash_register_history';
    try {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      localStorage.setItem(historyKey, JSON.stringify([closedSession, ...(Array.isArray(history) ? history : [])]));
    } catch (error) {
      console.error('Error guardando historial de caja:', error);
    }

    localStorage.removeItem(CASH_REGISTER_STORAGE_KEY);
    setRegister(null);
    setOpeningUSD('');
    setOpeningBs('');
    setClosingModal(false);
    setCountedUSD('');
    setCountedBs('');

    alert('Caja cerrada con éxito.');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🔐 Módulo de Caja (Apertura y Cierre)</h3>
          {register && <p className="text-[10px] text-slate-500 mt-1">Apertura: {new Date(register.openedAt).toLocaleString()}</p>}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isOpened ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          Caja {isOpened ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      {!isOpened ? (
        <form onSubmit={handleOpenRegister} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-blue-600">Apertura de Turno: Registrar efectivo inicial en caja</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Efectivo USD ($)</label>
              <input type="number" min="0" step="0.01" required value={openingUSD} onChange={(e) => setOpeningUSD(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Efectivo Bs (Bs.)</label>
              <input type="number" min="0" step="0.01" required value={openingBs} onChange={(e) => setOpeningBs(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
            Abrir Caja 🔓
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2 text-emerald-800">
            <div className="font-bold">🟢 Turno activo</div>
            <div>Fondo inicial: <strong>${register?.openingUSD.toFixed(2)} USD</strong> / <strong>Bs. {register?.openingBs.toFixed(2)}</strong></div>
          </div>
          <button disabled={isClosing} onClick={openClosingModal} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
            {isClosing ? 'Calculando efectivo...' : 'Realizar Conteo Ciego y Cerrar Turno 🔒'}
          </button>
        </div>
      )}

      {closingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Conteo Ciego de Cierre</h3>
            <div className="space-y-3">
              <input type="number" min="0" step="0.01" placeholder="Total USD contado ($)" value={countedUSD} onChange={(e) => setCountedUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
              <input type="number" min="0" step="0.01" placeholder="Total Bs contado (Bs.)" value={countedBs} onChange={(e) => setCountedBs(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setClosingModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleCloseRegister} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Confirmar Cierre ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersDirectoryModule() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [rifCi, setRifCi] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCustomers(data); })
      .catch(err => console.error(err));
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rif_ci: rifCi, phone, address })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Cliente frecuente guardado con éxito!');
        setName(''); setRifCi(''); setPhone(''); setAddress('');
        const updated = await fetch('/api/customers').then(r => r.json());
        if (Array.isArray(updated)) setCustomers(updated);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800">👥 Gestión de Clientes Frecuentes</h3>
        </div>
        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-200">Total: {customers.length} clientes</span>
      </div>

      <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <input type="text" placeholder="Nombre *" required value={name} onChange={e => setName(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="text" placeholder="Cédula / RIF" value={rifCi} onChange={e => setRifCi(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="text" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Guardar 💾</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
              <th className="p-3">Cliente</th>
              <th className="p-3">Cédula / RIF</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Dirección</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400">No hay clientes registrados.</td></tr>}
            {customers.map((c, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-800">{c.name}</td>
                <td className="p-3 text-slate-600">{c.rif_ci || 'N/A'}</td>
                <td className="p-3 text-slate-600">{c.phone || 'N/A'}</td>
                <td className="p-3 text-slate-600">{c.address || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPOS() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'accounts' | 'customers' | 'roles'>('pos');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [payables, setPayables] = useState<PayableAccount[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(778.33);

  const [currentUsername, setCurrentUsername] = useState<string>('admin');
  const [rolesList, setRolesList] = useState(getRoles());
  const [usersList, setUsersList] = useState(getUsers());

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

  const [lastPrintedSale, setLastPrintedSale] = useState<any>(null);
  const [successModalData, setSuccessModalData] = useState<{ isOpen: boolean; changeUSD: number; changeBs: number; isCredit: boolean; clientName?: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedCredits = localStorage.getItem('pos_credits');
      if (savedCredits) try { setCredits(JSON.parse(savedCredits)); } catch (e) { console.error(e); }
      const savedPayables = localStorage.getItem('pos_payables');
      if (savedPayables) try { setPayables(JSON.parse(savedPayables)); } catch (e) { console.error(e); }
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
        console.error("Error sincronizando datos:", error);
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

  const currentUserObj = usersList.find(
    (u: any) => String(u.username || '').toLowerCase() === String(currentUsername || '').toLowerCase()
  ) || usersList[0];

  const currentRole = String(currentUserObj?.role || '').toLowerCase();
  
  const currentRoleObj = rolesList.find(
    (r: any) => String(r.id || '').toLowerCase() === currentRole || String(r.name || '').toLowerCase() === currentRole
  ) || rolesList[0];

  const userPermissions: Permission[] = currentRoleObj?.permissions || [];
  const requiredPermissions: Permission[] = tabPermissionMap[activeTab] || [];

  const hasAccess =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) => userPermissions.includes(permission));

  useEffect(() => {
    if (!hasAccess) {
      const availableTab = Object.keys(tabPermissionMap).find(tab => {
        const perms = tabPermissionMap[tab];
        return perms.some(p => userPermissions.includes(p));
      }) as 'pos' | 'inventory' | 'reports' | 'accounts' | 'customers' | 'roles' | undefined;

      if (availableTab && availableTab !== activeTab) {
        setActiveTab(availableTab);
      }
    }
  }, [currentUsername, currentRoleObj, userPermissions, activeTab, hasAccess]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible.');
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

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const prod = products.find(p => p.id === id);
        const maxStock = prod ? prod.stock : 9999;
        if (newQty > maxStock) {
          alert('No hay suficiente stock disponible.');
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ivaUSD = cart.reduce((acc, item) => acc + (item.taxable ? item.price * item.quantity * IVA_RATE : 0), 0);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * exchangeRate;

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          cost_price: Number(newCostPrice || 0),
          price: Number(newPrice),
          category: newCategory,
          taxable: newTaxable,
          stock: Number(newStock || 0)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Producto creado con éxito!');
        setNewName(''); setNewCostPrice(''); setNewPrice(''); setNewStock('');
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    let changeUSD = 0;
    if (paymentMethod === 'Efectivo USD') {
      const given = Number(cashGivenUSD || 0);
      if (given < totalUSD) {
        alert('El monto en efectivo entregado es menor al total.');
        return;
      }
      changeUSD = given - totalUSD;
    }

    const salePayload = {
      items: cart,
      subtotal_usd: subtotalUSD,
      iva_usd: ivaUSD,
      total_usd: totalUSD,
      total_bs: totalBs,
      exchange_rate: exchangeRate,
      payment_method: paymentMethod,
      change_usd: changeUSD,
      client_name: clientName || 'Cliente Genérico'
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });
      const data = await res.json();
      if (data.success) {
        const newSaleRecord: SaleRecord = {
          id: data.saleId || Date.now(),
          date: new Date().toLocaleString(),
          items: [...cart],
          subtotalUSD,
          ivaUSD,
          totalUSD,
          totalBs,
          exchangeRate,
          paymentMethod,
          changeUSD,
          clientName: clientName || 'Cliente Genérico'
        };

        setSalesHistory(prev => [newSaleRecord, ...prev]);
        setLastPrintedSale(newSaleRecord);

        if (paymentMethod === 'Crédito / Fiado') {
          const newCredit: CreditAccount = {
            id: Date.now(),
            clientName: clientName || 'Cliente Genérico',
            clientPhone: clientPhone || 'N/A',
            clientDocument: clientDocument || 'V-00000000',
            totalDebtUSD: totalUSD,
            totalDebtBs: totalBs,
            date: new Date().toLocaleDateString(),
            status: 'Pendiente',
            saleId: newSaleRecord.id
          };
          setCredits(prev => [newCredit, ...prev]);
        }

        setSuccessModalData({
          isOpen: true,
          changeUSD,
          changeBs: changeUSD * exchangeRate,
          isCredit: paymentMethod === 'Crédito / Fiado',
          clientName: clientName || 'Cliente Genérico'
        });

        setCart([]);
        setIsCheckoutModalOpen(false);
        setCashGivenUSD('');
        setClientName('');
        setClientPhone('');
        setClientDocument('');

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
      } else {
        alert('Error al procesar venta: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al procesar la venta.');
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">Cargando POS...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">
      {/* Header del Dashboard */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            POS & ERP Enterprise
          </h1>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
            <span className="px-2 text-slate-500 font-bold">Tasa BCV:</span>
            <input 
              type="number" 
              step="0.01" 
              value={exchangeRate} 
              onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} 
              className="bg-white border border-slate-300 rounded px-2 py-1 w-24 text-xs font-bold text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">Usuario: {currentUserObj?.username}</div>
            <div className="text-[10px] text-blue-600 font-bold uppercase">Rol: {currentRoleObj?.name}</div>
          </div>
          <select 
            value={currentUsername} 
            onChange={e => setCurrentUsername(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            {usersList.map((u: any) => (
              <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
            ))}
          </select>
        </div>
      </header>

      {/* Barra de Navegación de Módulos */}
      <nav className="bg-white border-b border-slate-200 px-6 flex gap-2 overflow-x-auto">
        {userPermissions.includes('view_pos') && (
          <button 
            onClick={() => setActiveTab('pos')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition ${activeTab === 'pos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🛒 Terminal POS
          </button>
        )}
        {userPermissions.includes('view_inventory') && (
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition ${activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            📦 Inventario y Productos
          </button>
        )}
        {userPermissions.includes('view_reports') && (
          <button 
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            📊 Reportes de Ventas
          </button>
        )}
        {userPermissions.includes('view_receivable') && (
          <button 
            onClick={() => setActiveTab('accounts')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition ${activeTab === 'accounts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            💳 Cuentas por Cobrar / Pagar
          </button>
        )}
        {userPermissions.includes('view_pos') && (
          <button 
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition ${activeTab === 'customers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            👥 Clientes
          </button>
        )}
        {userPermissions.includes('manage_roles') && (
          <button 
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition ${activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🛡️ Gestión de Roles y Usuarios
          </button>
        )}
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {!hasAccess ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-700">
            <h2 className="text-lg font-bold mb-2">Acceso Denegado</h2>
            <p className="text-xs">No tienes permisos suficientes para visualizar este módulo.</p>
          </div>
        ) : (
          <>
            {/* TERMINAL POS */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar producto por nombre..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs flex-1 shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto pr-1">
                    {products
                      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(p => (
                        <div 
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Stock: {p.stock}</div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="text-xs font-black text-blue-600">${p.price.toFixed(2)}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Bs. {(p.price * exchangeRate).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <CashRegisterModule exchangeRate={exchangeRate} />
                </div>

                {/* Carrito de Compras */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center">
                      <span>🛒 Carrito de Venta</span>
                      <span className="text-xs text-slate-500 font-normal">{cart.length} ítems</span>
                    </h3>

                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto my-3">
                      {cart.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">El carrito está vacío</div>
                      ) : (
                        cart.map(item => (
                          <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                            <div className="flex-1 pr-2">
                              <div className="font-bold text-slate-800 line-clamp-1">{item.name}</div>
                              <div className="text-[10px] text-slate-500">${item.price.toFixed(2)} c/u</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded flex items-center justify-center font-bold">-</button>
                              <span className="w-5 text-center font-bold">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded flex items-center justify-center font-bold">+</button>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-1 font-bold">×</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal:</span>
                      <span>${subtotalUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>IVA (16%):</span>
                      <span>${ivaUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-800 pt-1 border-t border-slate-100">
                      <span>Total USD:</span>
                      <span className="text-blue-600">${totalUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Total Bs.:</span>
                      <span>Bs. {totalBs.toFixed(2)}</span>
                    </div>

                    <button 
                      disabled={cart.length === 0}
                      onClick={() => setIsCheckoutModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs shadow-sm transition mt-2"
                    >
                      Procesar Pago 💳
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* INVENTARIO */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                {userPermissions.includes('edit_inventory') && (
                  <form onSubmit={handleCreateProduct} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">📦 Registrar Nuevo Producto</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <input type="text" placeholder="Nombre *" required value={newName} onChange={e => setNewName(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                      <input type="number" step="0.01" placeholder="Costo ($)" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                      <input type="number" step="0.01" placeholder="Precio Venta ($) *" required value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                      <input type="text" placeholder="Categoría" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                      <input type="number" placeholder="Stock Inicial" value={newStock} onChange={e => setNewStock(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Guardar Producto ✓</button>
                    </div>
                  </form>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Inventario Actual</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                          <th className="p-3">Producto</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Precio USD</th>
                          <th className="p-3">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{p.name}</td>
                            <td className="p-3 text-slate-600">{p.category}</td>
                            <td className="p-3 text-blue-600 font-bold">${p.price.toFixed(2)}</td>
                            <td className="p-3 font-bold text-slate-700">{p.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTES */}
            {activeTab === 'reports' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-800">📊 Historial y Gráfica de Ventas</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" textAnchor="end" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalUSD" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CUENTAS POR COBRAR / PAGAR */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">💳 Cuentas por Cobrar (Créditos Fiados)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Teléfono</th>
                          <th className="p-3">Deuda USD</th>
                          <th className="p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {credits.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-slate-400">No hay créditos registrados.</td></tr>
                        ) : (
                          credits.map(c => (
                            <tr key={c.id}>
                              <td className="p-3 font-bold text-slate-800">{c.clientName}</td>
                              <td className="p-3 text-slate-600">{c.clientPhone}</td>
                              <td className="p-3 text-blue-600 font-bold">${c.totalDebtUSD.toFixed(2)}</td>
                              <td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold">{c.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CLIENTES */}
            {activeTab === 'customers' && <CustomersDirectoryModule />}

            {/* ROLES Y USUARIOS */}
            {activeTab === 'roles' && <RolesManagerModule />}
          </>
        )}
      </main>

      {/* Modal de Pago / Checkout */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Confirmar Pago 💳</h3>
            
            <div className="space-y-3">
              <POSCustomerSelector onSelectCustomer={(c) => {
                setClientName(c.name);
                setClientDocument(c.document);
                setClientPhone(c.phone);
              }} />

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Método de Pago</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Efectivo USD">Efectivo USD ($)</option>
                  <option value="Efectivo Bs">Efectivo Bs (Bs.)</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Binance Pay">Binance Pay</option>
                  <option value="Crédito / Fiado">Crédito / Fiado</option>
                </select>
              </div>

              {paymentMethod === 'Efectivo USD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Efectivo Entregado ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={cashGivenUSD} 
                    onChange={e => setCashGivenUSD(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={processSale} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Completar Venta ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito y Ticket Impreso */}
      {successModalData?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
            <h3 className="text-lg font-bold text-slate-800">¡Venta Exitosa!</h3>
            {successModalData.changeUSD > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
                Cambio a devolver: <strong>${successModalData.changeUSD.toFixed(2)}</strong> (Bs. {successModalData.changeBs.toFixed(2)})
              </div>
            )}
            {lastPrintedSale && <ReceiptTicket sale={lastPrintedSale} />}
            <button onClick={() => setSuccessModalData(null)} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
