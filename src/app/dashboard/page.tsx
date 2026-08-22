'use client';
import { useState, useEffect } from 'react';
import RolesManagerModule from '../../components/RolesManagerModule';
import ReceiptTicket from '../../components/ReceiptTicket';
import { getRoles, getUsers } from '../../utils/rolesManager';
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
          <button type="submit" className="w-full bg-blue-600 text-white rounded py-1.5 text-xs font-bold shadow-sm">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

  const currentUserObj = usersList.find(
    (u: any) =>
      String(u.username || '').toLowerCase() ===
      String(currentUsername || '').toLowerCase()
  ) || usersList[0];

  const currentRoleObj = rolesList.find(
    (r: any) =>
      String(r.id || '').toLowerCase() ===
        String(currentUserObj?.roleId || '').toLowerCase() ||
      String(r.name || '').toLowerCase() ===
        String(currentUserObj?.roleId || '').toLowerCase()
  ) || rolesList[0];

  const userPermissions = currentRoleObj ? currentRoleObj.permissions : [];

  useEffect(() => {
    const tabPermissionMap: Record<string, string[]> = {
      pos: ['view_pos'],
      inventory: ['view_inventory'],
      accounts: ['view_credits', 'view_payables', 'manage_roles'],
      reports: ['view_reports'],
      customers: ['view_pos'],
      roles: ['manage_roles'],
    };

    const requiredPermissions = tabPermissionMap[activeTab] || [];
    const hasAccess = requiredPermissions.length === 0 || requiredPermissions.some(p => (userPermissions as string[]).includes(p));

    if (!hasAccess) {
      const availableTab = Object.keys(tabPermissionMap).find(tab => {
        const perms = tabPermissionMap[tab];
        return perms.some(p => (userPermissions as string[]).includes(p));
      }) as 'pos' | 'inventory' | 'reports' | 'accounts' | 'customers' | 'roles' | undefined;

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

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">Cargando POS...</div>;

  // Lógica de Carrito de Compras
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('¡Producto agotado!');
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

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          alert('Stock máximo alcanzado.');
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

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ivaUSD = cart.reduce((acc, item) => acc + (item.taxable ? item.price * item.quantity * IVA_RATE : 0), 0);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * exchangeRate;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Crédito / Fiado' && !clientName) {
      alert('Para ventas a crédito debe indicar el Nombre del Cliente.');
      return;
    }

    const cashNum = Number(cashGivenUSD || 0);
    if (paymentMethod === 'Efectivo USD' && cashNum < totalUSD) {
      alert('El monto en efectivo recibido es menor al total de la venta.');
      return;
    }

    const changeUSD = paymentMethod === 'Efectivo USD' ? Math.max(0, cashNum - totalUSD) : 0;
    const changeBs = changeUSD * exchangeRate;

    const salePayload = {
      items: cart,
      subtotalUSD,
      ivaUSD,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      changeUSD,
      clientName: clientName || 'Cliente Genérico',
      clientDocument: clientDocument || 'N/A',
      clientPhone: clientPhone || 'N/A',
      date: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });
      const data = await res.json();

      if (data.success || data.id) {
        const newSaleRecord: SaleRecord = {
          id: data.id || Date.now(),
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
            clientDocument: clientDocument || 'N/A',
            totalDebtUSD: totalUSD,
            totalDebtBs: totalBs,
            date: new Date().toLocaleDateString(),
            status: 'Pendiente',
            saleId: newSaleRecord.id
          };
          setCredits(prev => [newCredit, ...prev]);
        }

        // Actualizar stock localmente
        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(ci => ci.id === p.id);
          if (cartItem) {
            return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
          }
          return p;
        }));

        setSuccessModalData({
          isOpen: true,
          changeUSD,
          changeBs,
          isCredit: paymentMethod === 'Crédito / Fiado',
          clientName: clientName || 'Cliente Genérico'
        });

        // Limpiar carrito
        setCart([]);
        setIsCheckoutModalOpen(false);
        setCashGivenUSD('');
        setClientName('');
        setClientPhone('');
        setClientDocument('');
      } else {
        alert('Error al procesar la venta: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al procesar la venta.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">
      {/* Barra superior de navegación e información */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center shadow-md gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            POS & Gestión Pro
          </h1>
          <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
            Tasa: {exchangeRate.toFixed(2)} Bs/$
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-300">
            Usuario: <strong className="text-white">{currentUsername}</strong>
          </div>
          <select
            value={currentUsername}
            onChange={(e) => setCurrentUsername(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            {usersList.map((u: any) => (
              <option key={u.id || u.username} value={u.username}>
                {u.username} ({u.roleId})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Pestañas de Navegación */}
      <nav className="bg-white border-b border-slate-200 px-6 flex gap-2 overflow-x-auto shadow-xs">
        {userPermissions.includes('view_pos') && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${activeTab === 'pos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🛒 Punto de Venta (POS)
          </button>
        )}
        {userPermissions.includes('view_inventory') && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            📦 Inventario
          </button>
        )}
        {userPermissions.includes('view_reports') && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            📊 Reportes y Ventas
          </button>
        )}
        {userPermissions.some(p => ['view_credits', 'view_payables'].includes(p)) && (
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${activeTab === 'accounts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            💳 Cuentas (Créditos / Cuentas por Pagar)
          </button>
        )}
        {userPermissions.includes('view_pos') && (
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${activeTab === 'customers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            👥 Clientes
          </button>
        )}
        {userPermissions.includes('manage_roles') && (
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            🔐 Roles y Permisos
          </button>
        )}
      </nav>

      {/* Contenido Principal según Pestaña Activa */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* PESTAÑA: POS */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Listado de Productos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 shadow-xs"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 shadow-xs font-bold"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[650px] overflow-y-auto pr-2">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                        {product.category}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-2 group-hover:text-blue-600 transition line-clamp-2">
                        {product.name}
                      </h4>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-100 pt-2">
                      <div>
                        <div className="text-xs font-black text-slate-900">${product.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Bs. {(product.price * exchangeRate).toFixed(2)}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrito de Compras & Checkout */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base">🛒 Carrito Actual</h3>
                  <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)} ítems
                  </span>
                </div>

                {/* Selector de Cliente Rápido */}
                <POSCustomerSelector onSelectCustomer={(c) => {
                  setClientName(c.name);
                  setClientDocument(c.document);
                  setClientPhone(c.phone);
                }} />

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">El carrito está vacío. Haga clic en un producto para agregarlo.</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                        <div className="space-y-1 flex-1 pr-2">
                          <div className="font-bold text-slate-800 line-clamp-1">{item.name}</div>
                          <div className="text-slate-500">${item.price.toFixed(2)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100">-</button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 font-bold ml-1 px-1">×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totales y Botón de Pago */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>${subtotalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (16%):</span>
                    <span>${ivaUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-100 pt-1">
                    <span>Total USD:</span>
                    <span className="text-blue-600">${totalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-500 text-xs">
                    <span>Total Bs.:</span>
                    <span>Bs. {totalBs.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  Proceder al Pago ⚡
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: INVENTARIO */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">📦 Registrar Nuevo Producto</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newName || !newPrice || !newStock) return;
                try {
                  const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: newName,
                      costPrice: Number(newCostPrice || 0),
                      price: Number(newPrice),
                      category: newCategory,
                      taxable: newTaxable,
                      stock: Number(newStock)
                    })
                  });
                  const data = await res.json();
                  if (data.success || data.id) {
                    alert('¡Producto registrado con éxito!');
                    setNewName(''); setNewCostPrice(''); setNewPrice(''); setNewStock('');
                    const updated = await fetch('/api/products').then(r => r.json());
                    if (Array.isArray(updated)) setProducts(updated);
                  } else {
                    alert('Error: ' + (data.error || 'No se pudo guardar'));
                  }
                } catch (err) {
                  console.error(err);
                }
              }} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <input type="text" placeholder="Nombre *" required value={newName} onChange={e => setNewName(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <input type="number" step="0.01" placeholder="Costo ($)" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <input type="number" step="0.01" placeholder="Precio Venta ($) *" required value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <input type="text" placeholder="Categoría" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <input type="number" placeholder="Stock Inicial *" required value={newStock} onChange={e => setNewStock(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs shadow-sm">Guardar Producto</button>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Listado de Inventario Actual</h3>
                <div className="flex gap-2">
                  <button onClick={() => setInventoryFilterMode('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${inventoryFilterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
                  <button onClick={() => setInventoryFilterMode('low')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${inventoryFilterMode === 'low' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Stock Bajo (&lt;5)</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                      <th className="p-3">Producto</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Precio Venta</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.filter(p => inventoryFilterMode === 'all' || p.stock < 5).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{p.name}</td>
                        <td className="p-3 text-slate-600">{p.category}</td>
                        <td className="p-3 text-slate-600">${p.price.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`font-bold px-2 py-0.5 rounded-md ${p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {p.stock} unids.
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductForRestock(p);
                              setRestockAmount('');
                              setIsRestockModalOpen(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Reponer Stock ➕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: REPORTES Y VENTAS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Ventas Totales</div>
                <div className="text-2xl font-black text-slate-800">
                  ${salesHistory.reduce((acc, s) => acc + s.totalUSD, 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Transacciones</div>
                <div className="text-2xl font-black text-blue-600">{salesHistory.length}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Tasa de Cambio Activa</div>
                <div className="text-2xl font-black text-emerald-600">{exchangeRate.toFixed(2)} Bs/$</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Historial de Ventas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                      <th className="p-3">ID / Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Método de Pago</th>
                      <th className="p-3">Total USD</th>
                      <th className="p-3">Total Bs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesHistory.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-6 text-slate-400">No hay ventas registradas aún.</td></tr>
                    ) : (
                      salesHistory.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">#{sale.id}</div>
                            <div className="text-[10px] text-slate-400">{sale.date}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-700">{sale.clientName || 'Cliente Genérico'}</td>
                          <td className="p-3 text-slate-600">{sale.paymentMethod}</td>
                          <td className="p-3 font-bold text-blue-600">${sale.totalUSD.toFixed(2)}</td>
                          <td className="p-3 text-slate-600">Bs. {sale.totalBs.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: CUENTAS (CRÉDITOS Y CUENTAS POR PAGAR) */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">💳 Cuentas por Cobrar (Créditos / Fiados)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Teléfono / Cédula</th>
                      <th className="p-3">Deuda USD</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {credits.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-400">No hay créditos registrados.</td></tr>
                    ) : (
                      credits.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{c.clientName}</td>
                          <td className="p-3 text-slate-600">{c.clientDocument} / {c.clientPhone}</td>
                          <td className="p-3 font-bold text-red-600">${c.totalDebtUSD.toFixed(2)}</td>
                          <td className="p-3 text-slate-600">{c.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${c.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {c.status === 'Pendiente' && (
                              <button
                                onClick={() => {
                                  setCredits(prev => prev.map(item => item.id === c.id ? { ...item, status: 'Pagado' } : item));
                                  alert('¡Crédito marcado como pagado!');
                                }}
                                className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Pagar ✓
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cuentas por Pagar a Proveedores */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">📋 Cuentas por Pagar a Proveedores</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newProviderName || !newPayableAmountUSD) return;
                const amt = Number(newPayableAmountUSD);
                const newAcc: PayableAccount = {
                  id: Date.now(),
                  providerName: newProviderName,
                  providerDocument: newProviderDoc || 'N/A',
                  description: newPayableDesc || 'Compra mercancía',
                  totalDebtUSD: amt,
                  totalDebtBs: amt * exchangeRate,
                  dueDate: newDueDate || new Date().toLocaleDateString(),
                  date: new Date().toLocaleDateString(),
                  status: 'Pendiente'
                };
                setPayables(prev => [newAcc, ...prev]);
                setNewProviderName(''); setNewProviderDoc(''); setNewPayableDesc(''); setNewPayableAmountUSD(''); setNewDueDate('');
                alert('¡Cuenta por pagar registrada!');
              }} className="grid grid-cols-1 sm:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" placeholder="Proveedor *" required value={newProviderName} onChange={e => setNewProviderName(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                <input type="text" placeholder="RIF / Doc" value={newProviderDoc} onChange={e => setNewProviderDoc(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                <input type="text" placeholder="Descripción" value={newPayableDesc} onChange={e => setNewPayableDesc(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                <input type="number" step="0.01" placeholder="Monto USD ($) *" required value={newPayableAmountUSD} onChange={e => setNewPayableAmountUSD(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs" />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Registrar Deuda</button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                      <th className="p-3">Proveedor</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Monto USD</th>
                      <th className="p-3">Vencimiento</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payables.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-400">No hay cuentas por pagar registradas.</td></tr>
                    ) : (
                      payables.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{p.providerName}</td>
                          <td className="p-3 text-slate-600">{p.description}</td>
                          <td className="p-3 font-bold text-red-600">${p.totalDebtUSD.toFixed(2)}</td>
                          <td className="p-3 text-slate-600">{p.dueDate}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${p.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {p.status === 'Pendiente' && (
                              <button
                                onClick={() => {
                                  setPayables(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Pagado' } : item));
                                  alert('¡Deuda saldada con éxito!');
                                }}
                                className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Saldar ✓
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: CLIENTES */}
        {activeTab === 'customers' && <CustomersDirectoryModule />}

        {/* PESTAÑA: ROLES Y PERMISOS */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <CashRegisterModule exchangeRate={exchangeRate} />
            <RolesManagerModule />
          </div>
        )}

      </main>

      {/* MODAL DE CHECKOUT / PAGO */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Finalizar Venta / Cobro</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Efectivo USD">Efectivo USD ($)</option>
                  <option value="Efectivo Bs">Efectivo Bs. (Bs.)</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Binance Pay">Binance Pay</option>
                  <option value="Crédito / Fiado">Crédito / Fiado</option>
                </select>
              </div>

              {paymentMethod === 'Efectivo USD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Efectivo Recibido ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashGivenUSD}
                    onChange={(e) => setCashGivenUSD(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                  {Number(cashGivenUSD) >= totalUSD && (
                    <div className="text-xs text-emerald-600 font-bold mt-1">
                      Cambio a devolver: ${(Number(cashGivenUSD) - totalUSD).toFixed(2)} (Bs. {((Number(cashGivenUSD) - totalUSD) * exchangeRate).toFixed(2)})
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-600">${totalUSD.toFixed(2)} (Bs. {totalBs.toFixed(2)})</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleCheckout} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Completar Venta ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REPOSICIÓN DE STOCK */}
      {isRestockModalOpen && selectedProductForRestock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Reponer Stock</h3>
            <p className="text-xs text-slate-500">Producto: <strong className="text-slate-800">{selectedProductForRestock.name}</strong> (Stock actual: {selectedProductForRestock.stock})</p>
            
            <input
              type="number"
              placeholder="Cantidad a agregar *"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            />

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsRestockModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={async () => {
                const addQty = Number(restockAmount);
                if (!addQty || addQty <= 0) return alert('Ingrese una cantidad válida.');
                const newStockValue = selectedProductForRestock.stock + addQty;
                try {
                  const res = await fetch(`/api/products`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedProductForRestock.id, stock: newStockValue })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setProducts(prev => prev.map(p => p.id === selectedProductForRestock.id ? { ...p, stock: newStockValue } : p));
                    alert('¡Stock actualizado con éxito!');
                    setIsRestockModalOpen(false);
                    setSelectedProductForRestock(null);
                  } else {
                    alert('Error al actualizar stock');
                  }
                } catch (err) {
                  console.error(err);
                }
              }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Actualizar Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VENTA EXITOSA Y TICKET */}
      {successModalData?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
            <h3 className="text-lg font-bold text-slate-800">¡Venta Exitosa!</h3>
            
            {successModalData.changeUSD > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
                Cambio a entregar: <strong className="font-black">${successModalData.changeUSD.toFixed(2)}</strong> (Bs. {successModalData.changeBs.toFixed(2)})
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => {
                window.print();
              }} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">
                Imprimir Recibo 🖨️
              </button>
              <button onClick={() => setSuccessModalData(null)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">
                Continuar Vendiendo ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente oculto para impresión de recibos */}
      {lastPrintedSale && (
        <div className="hidden print:block">
          <ReceiptTicket sale={lastPrintedSale} />
        </div>
      )}
    </div>
  );
}
