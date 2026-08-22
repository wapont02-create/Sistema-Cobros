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

// Mapa de permisos por pestaña tipado rígidamente con Permission[]
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

// Módulo de Caja Chica (Apertura y Cierre con Conteo Ciego)
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
    alert('¡Caja abierta exitosamente! El turno permanecerá abierto aunque cambie de pantalla.');
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
      console.error('Error calculando el efectivo esperado:', error);
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
      alert('No se pudo calcular el efectivo esperado. Verifique la conexión e intente nuevamente.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!register) return;

    const actualUSD = Number(countedUSD || 0);
    const actualBs = Number(countedBs || 0);

    if (actualUSD < 0 || actualBs < 0) {
      alert('El efectivo contado no puede ser negativo.');
      return;
    }

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

    const formatUSD = (value: number) => `$${value.toFixed(2)}`;
    const formatBs = (value: number) => `Bs. ${value.toFixed(2)}`;
    const differenceLabelUSD = differenceUSD > 0 ? 'Sobrante' : differenceUSD < 0 ? 'Faltante' : 'Cuadre exacto';
    const differenceLabelBs = differenceBs > 0 ? 'Sobrante' : differenceBs < 0 ? 'Faltante' : 'Cuadre exacto';

    alert(
      `--- CIERRE DE CAJA ---\n\n` +
      `USD esperado: ${formatUSD(expectedUSD)}\n` +
      `USD contado: ${formatUSD(actualUSD)}\n` +
      `${differenceLabelUSD}: ${formatUSD(Math.abs(differenceUSD))}\n\n` +
      `Bs. esperado: ${formatBs(expectedBs)}\n` +
      `Bs. contado: ${formatBs(actualBs)}\n` +
      `${differenceLabelBs}: ${formatBs(Math.abs(differenceBs))}`
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🔐 Módulo de Caja (Apertura y Cierre)</h3>
          {register && (
            <p className="text-[10px] text-slate-500 mt-1">
              Apertura: {new Date(register.openedAt).toLocaleString()}
            </p>
          )}
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
            <div className="text-[10px] text-emerald-700">Puedes cambiar de pantalla. La caja seguirá abierta.</div>
          </div>
          <button disabled={isClosing} onClick={openClosingModal} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
            {isClosing ? 'Calculando efectivo esperado...' : 'Realizar Conteo Ciego y Cerrar Turno 🔒'}
          </button>
        </div>
      )}

      {closingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Conteo Ciego de Cierre</h3>
            <p className="text-xs text-slate-500">Ingrese el efectivo físico contado sin mirar el monto esperado. El sistema comparará ambos valores al cerrar.</p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-slate-700">Control interno</div>
              <div className="text-slate-500">Las ventas en efectivo realizadas después de la apertura se suman automáticamente al fondo inicial.</div>
            </div>

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

// Módulo de Gestión de Clientes Frecuentes (CRM Base de Datos)
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
          <h3 className="text-xl font-bold text-slate-800">👥 Gestión de Clientes Frecuentes (Base de Datos)</h3>
          <p className="text-xs text-slate-500">Guarda los datos de compradores recurrentes (cédula, teléfono, dirección) para seleccionarlos rápidamente al facturar o otorgar créditos.</p>
        </div>
        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-200">Total: {customers.length} clientes</span>
      </div>

      <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <input type="text" placeholder="Nombre y Apellido *" required value={name} onChange={e => setName(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="text" placeholder="Cédula / RIF" value={rifCi} onChange={e => setRifCi(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="text" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Registrar Cliente 💾</button>
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
            {customers.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400">No hay clientes registrados en la base de datos.</td></tr>}
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

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState('');

  const [inventoryFilterMode, setInventoryFilterMode] = useState<'all' | 'low'>('all');
  const [reportFilterPeriod, setReportFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

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

  const [lastPrintedSale, setLastPrintedSale] = useState<any>(null);
  const [successModalData, setSuccessModalData] = useState<{ isOpen: boolean; changeUSD: number; changeBs: number; isCredit: boolean; clientName?: string } | null>(null);

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

  // --- OBTENCIÓN Y TIPADO ESTRICTO DE ROLES Y PERMISOS ---
  const currentUserObj = usersList.find(
    (u: any) =>
      String(u.username || '').toLowerCase() ===
      String(currentUsername || '').toLowerCase()
  ) || usersList[0];

  const currentRole = String(currentUserObj?.role || '').toLowerCase();
  
  const currentRoleObj = rolesList.find(
    (r: any) =>
      String(r.id || '').toLowerCase() === currentRole ||
      String(r.name || '').toLowerCase() === currentRole
  ) || rolesList[0];

  const userPermissions: Permission[] = currentRoleObj?.permissions || [];
  const requiredPermissions: Permission[] = tabPermissionMap[activeTab] || [];

  const hasAccess =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  // -----------------------------------------------------

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

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">Cargando POS...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">
       {/* (Contenido del renderizado...) */}
    </div>
  );
}
