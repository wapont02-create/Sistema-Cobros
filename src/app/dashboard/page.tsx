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

  const currentUserObj = usersList.find(
    (u: any) =>
      String(u.username || '').toLowerCase() ===
      String(currentUsername || '').toLowerCase()
  ) || usersList[0];

  const currentRoleObj = rolesList.find(
    (r: any) =>
      String(r.id || '').toLowerCase() ===
        String(currentUserObj?.role || '').toLowerCase() ||
      String(r.name || '').toLowerCase() ===
        String(currentUserObj?.role || '').toLowerCase()
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
    const hasAccess = requiredPermissions.length === 0 || requiredPermissions.some(p => (userPermissions as string[]).includes(p as string));

    if (!hasAccess) {
      const availableTab = Object.keys(tabPermissionMap).find(tab => {
        const perms = tabPermissionMap[tab];
        return perms.some(p => (userPermissions as string[]).includes(p as string));
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

  // Carrito y operaciones
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

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const prod = products.find(p => p.id === id);
        if (prod && newQty > prod.stock) {
          alert('Stock insuficiente.');
          return item;
        }
        return { ...item, quantity: newQty };
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const givenUSD = parseFloat(cashGivenUSD || '0');
    let changeUSD = 0;
    let changeBs = 0;

    if (paymentMethod === 'Efectivo USD') {
      if (givenUSD < totalUSD) {
        alert('El monto en efectivo entregado es menor al total.');
        return;
      }
      changeUSD = givenUSD - totalUSD;
      changeBs = changeUSD * exchangeRate;
    }

    if (paymentMethod === 'Crédito / Fiado' && !clientName) {
      alert('Para ventas a crédito debe especificar el nombre del cliente.');
      return;
    }

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
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });
      const data = await res.json();

      if (data.success || res.ok) {
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
          clientName: clientName || 'Cliente Genérico',
          created_at: new Date().toISOString()
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

        for (const item of cart) {
          const prod = products.find(p => p.id === item.id);
          if (prod) {
            const newStockVal = prod.stock - item.quantity;
            await fetch(`/api/products/${prod.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...prod, stock: newStockVal })
            }).catch(err => console.error(err));
          }
        }

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);

        setSuccessModalData({
          isOpen: true,
          changeUSD,
          changeBs,
          isCredit: paymentMethod === 'Crédito / Fiado',
          clientName: clientName || undefined
        });

        setCart([]);
        setIsCheckoutModalOpen(false);
        setCashGivenUSD('');
        setClientName('');
        setClientPhone('');
        setClientDocument('');
      } else {
        alert('Error al registrar la venta: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al procesar la venta.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newStock) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          costPrice: parseFloat(newCostPrice || '0'),
          price: parseFloat(newPrice),
          category: newCategory,
          taxable: newTaxable,
          stock: parseInt(newStock)
        })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        alert('¡Producto creado con éxito!');
        setNewName('');
        setNewCostPrice('');
        setNewPrice('');
        setNewStock('');
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

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock || !restockAmount) return;
    const qty = parseInt(restockAmount);
    if (isNaN(qty) || qty <= 0) return;

    try {
      const newStockVal = selectedProductForRestock.stock + qty;
      const res = await fetch(`/api/products/${selectedProductForRestock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedProductForRestock, stock: newStockVal })
      });
      if (res.ok) {
        alert('¡Inventario actualizado correctamente!');
        setIsRestockModalOpen(false);
        setSelectedProductForRestock(null);
        setRestockAmount('');
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newPayableAmountUSD) return;
    const amountUSD = parseFloat(newPayableAmountUSD);
    const newPayable: PayableAccount = {
      id: Date.now(),
      providerName: newProviderName,
      providerDocument: newProviderDoc || 'N/A',
      description: newPayableDesc || 'Compra de mercancía / servicio',
      totalDebtUSD: amountUSD,
      totalDebtBs: amountUSD * exchangeRate,
      dueDate: newDueDate || new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      status: 'Pendiente'
    };
    setPayables(prev => [newPayable, ...prev]);
    setNewProviderName('');
    setNewProviderDoc('');
    setNewPayableDesc('');
    setNewPayableAmountUSD('');
    setNewDueDate('');
    alert('¡Cuenta por pagar registrada con éxito!');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex flex-wrap justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            ⚡ POS Enterprise & Dashboard
          </h1>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700">
            BCV: Bs. {exchangeRate.toFixed(2)} / $1
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {userPermissions.includes('view_pos') && (
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'pos' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🛒 POS Caja
            </button>
          )}
          {userPermissions.includes('view_inventory') && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📦 Inventario
            </button>
          )}
          {userPermissions.includes('view_reports') && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'reports' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📊 Reportes
            </button>
          )}
          {(userPermissions.includes('view_credits') || userPermissions.includes('view_payables') || userPermissions.includes('manage_roles')) && (
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'accounts' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📑 Cuentas / Finanzas
            </button>
          )}
          {userPermissions.includes('view_pos') && (
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'customers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              👥 Clientes
            </button>
          )}
          {userPermissions.includes('manage_roles') && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'roles' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🔐 Roles y Usuarios
            </button>
          )}
        </nav>

        {/* User Selector */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{currentUserObj?.name || currentUsername}</div>
            <div className="text-[10px] text-slate-500">{currentRoleObj?.name || 'Operador'}</div>
          </div>
          <select
            value={currentUsername}
            onChange={(e) => setCurrentUsername(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
          >
            {usersList.map((u: any) => (
              <option key={u.id || u.username} value={u.username}>{u.name || u.username}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: POS */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 shadow-xs"
                />
                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-xs hover:shadow-md ${product.stock <= 0 ? 'opacity-50 border-red-200 bg-red-50/20' : 'border-slate-200 hover:border-blue-400'}`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{product.category}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${product.stock > 5 ? 'bg-emerald-50 text-emerald-700' : product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-2 line-clamp-2">{product.name}</h4>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">${product.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Bs. {(product.price * exchangeRate).toFixed(2)}</div>
                      </div>
                      <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">＋</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar: Cart & Checkout */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[calc(100vh-140px)] sticky top-20">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">🛒 Carrito de Compras</h3>
                  <button onClick={() => setCart([])} className="text-xs text-red-500 font-bold hover:underline">Vaciar</button>
                </div>

                <POSCustomerSelector onSelectCustomer={(c) => {
                  setClientName(c.name);
                  setClientDocument(c.document);
                  setClientPhone(c.phone);
                }} />

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                      <span className="text-2xl mb-2">🛍️</span>
                      El carrito está vacío. Selecciona productos para comenzar la venta.
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500">${item.price.toFixed(2)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <button onClick={() => updateCartQuantity(item.id, -1)} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">-</button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1)} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold p-1">×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Subtotal</span>
                    <span>${subtotalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>IVA (16%)</span>
                    <span>${ivaUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total USD</span>
                    <span>${totalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-blue-600">
                    <span>Total Bs.</span>
                    <span>Bs. {totalBs.toFixed(2)}</span>
                  </div>

                  <button
                    disabled={cart.length === 0}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm mt-2"
                  >
                    Proceder al Pago 💳
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base">➕ Nuevo Producto</h3>
                <form onSubmit={handleAddProduct} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre del Producto *</label>
                    <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Hamburguesa Doble" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Costo ($)</label>
                      <input type="number" step="0.01" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Precio Venta ($) *</label>
                      <input type="number" step="0.01" required value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoría</label>
                      <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Comida, Bebidas..." className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Stock Inicial *</label>
                      <input type="number" required value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="taxableCheck" checked={newTaxable} onChange={e => setNewTaxable(e.target.checked)} className="rounded text-blue-600" />
                    <label htmlFor="taxableCheck" className="text-xs text-slate-700">Aplica IVA (16%)</label>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm mt-2">Guardar Producto 💾</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base">📦 Listado de Inventario</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setInventoryFilterMode('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${inventoryFilterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
                    <button onClick={() => setInventoryFilterMode('low')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${inventoryFilterMode === 'low' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Stock Bajo</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                        <th className="p-3">Producto</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Precio</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.filter(p => inventoryFilterMode === 'all' || p.stock <= 5).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{p.name}</td>
                          <td className="p-3 text-slate-600">{p.category}</td>
                          <td className="p-3 font-bold text-slate-900">${p.price.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${p.stock > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {p.stock} unids.
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => { setSelectedProductForRestock(p); setIsRestockModalOpen(true); }}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Reponer ➕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CashRegisterModule exchangeRate={exchangeRate} />
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800">💱 Tasa de Cambio BCV</h3>
                <p className="text-xs text-slate-500">Actualiza la tasa oficial del Banco Central de Venezuela para el cálculo automático en Bolívares.</p>
                <div className="flex gap-3">
                  <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
                  <button onClick={() => alert('¡Tasa de cambio actualizada con éxito!')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Guardar Tasa</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-slate-800">📊 Reportes de Ventas y Analítica</h3>
                <p className="text-xs text-slate-500">Resumen financiero y rendimiento comercial del establecimiento.</p>
              </div>
              <div className="flex gap-2">
                {(['all', 'today', 'week', 'month'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setReportFilterPeriod(period)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${reportFilterPeriod === period ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {period === 'all' ? 'Histórico' : period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Ventas por Día ($)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesHistory.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalUSD" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Comparativa de Transacciones</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesHistory.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="totalUSD" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Historial Detallado de Ventas</h4>
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
                    {salesHistory.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No hay ventas registradas.</td></tr>}
                    {salesHistory.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">#{sale.id}</div>
                          <div className="text-[10px] text-slate-500">{sale.date}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{sale.clientName || 'Cliente Genérico'}</td>
                        <td className="p-3"><span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">{sale.paymentMethod}</span></td>
                        <td className="p-3 font-extrabold text-slate-900">${sale.totalUSD.toFixed(2)}</td>
                        <td className="p-3 text-slate-600">Bs. {sale.totalBs.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-800">📑 Cuentas por Cobrar (Créditos / Fiados)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Teléfono / Cédula</th>
                      <th className="p-3">Deuda USD</th>
                      <th className="p-3">Deuda Bs.</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {credits.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">No hay créditos activos.</td></tr>}
                    {credits.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{c.clientName}</td>
                        <td className="p-3 text-slate-600">{c.clientPhone} / {c.clientDocument}</td>
                        <td className="p-3 font-bold text-slate-900">${c.totalDebtUSD.toFixed(2)}</td>
                        <td className="p-3 text-slate-600">Bs. {c.totalDebtBs.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${c.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Cobrar ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base">➕ Registrar Cuenta por Pagar</h3>
                <form onSubmit={handleAddPayable} className="space-y-3">
                  <input type="text" placeholder="Proveedor *" required value={newProviderName} onChange={e => setNewProviderName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <input type="text" placeholder="Rif / Cédula" value={newProviderDoc} onChange={e => setNewProviderDoc(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <input type="text" placeholder="Descripción de la deuda" value={newPayableDesc} onChange={e => setNewPayableDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <input type="number" step="0.01" placeholder="Monto USD ($) *" required value={newPayableAmountUSD} onChange={e => setNewPayableAmountUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm">Guardar Deuda 💾</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base">📋 Cuentas por Pagar a Proveedores</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">
                        <th className="p-3">Proveedor</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Monto USD</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payables.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No hay cuentas por pagar registradas.</td></tr>}
                      {payables.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{p.providerName}</td>
                          <td className="p-3 text-slate-600">{p.description}</td>
                          <td className="p-3 font-bold text-slate-900">${p.totalDebtUSD.toFixed(2)}</td>
                          <td className="p-3"><span className={`px-2 py-0.5 rounded-md font-bold ${p.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{p.status}</span></td>
                          <td className="p-3 text-right">
                            {p.status === 'Pendiente' && (
                              <button onClick={() => {
                                setPayables(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Pagado' } : item));
                                alert('¡Cuenta pagada con éxito!');
                              }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold">Pagar ✓</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMERS */}
        {activeTab === 'customers' && <CustomersDirectoryModule />}

        {/* TAB 6: ROLES */}
        {activeTab === 'roles' && <RolesManagerModule />}
      </main>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">💳 Completar Pago</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700"><span>Total a Pagar:</span><span>${totalUSD.toFixed(2)} / Bs. {totalBs.toFixed(2)}</span></div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="Efectivo USD">Efectivo USD ($)</option>
                <option value="Efectivo Bs">Efectivo Bs (Bs.)</option>
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Zelle">Zelle</option>
                <option value="Binance Pay">Binance Pay</option>
                <option value="Crédito / Fiado">Crédito / Fiado</option>
              </select>

              {paymentMethod === 'Efectivo USD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Efectivo Recibido ($)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={cashGivenUSD} onChange={e => setCashGivenUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
                </div>
              )}

              {paymentMethod === 'Crédito / Fiado' && (
                <div className="space-y-2">
                  <input type="text" placeholder="Nombre del Cliente *" required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <input type="text" placeholder="Cédula / RIF" value={clientDocument} onChange={e => setClientDocument(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                  <input type="text" placeholder="Teléfono" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleCheckout} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Confirmar Venta ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && selectedProductForRestock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Reponer Inventario</h3>
            <p className="text-xs text-slate-500">Producto: <strong className="text-slate-800">{selectedProductForRestock.name}</strong> (Stock actual: {selectedProductForRestock.stock})</p>
            <form onSubmit={handleRestock} className="space-y-3">
              <input type="number" min="1" required placeholder="Cantidad a agregar *" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsRestockModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold">Actualizar ➕</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success / Receipt Modal */}
      {successModalData && successModalData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
            <h3 className="text-lg font-bold text-slate-800">¡Venta Exitosa!</h3>
            {successModalData.changeUSD > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                <div className="font-bold">Cambio a Entregar:</div>
                <div className="text-sm font-extrabold">${successModalData.changeUSD.toFixed(2)} / Bs. {successModalData.changeBs.toFixed(2)}</div>
              </div>
            )}
            {lastPrintedSale && <ReceiptTicket sale={lastPrintedSale} />}
            <button onClick={() => setSuccessModalData(null)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Continuar Vendiendo ⚡</button>
          </div>
        </div>
      )}
    </div>
  );
}
