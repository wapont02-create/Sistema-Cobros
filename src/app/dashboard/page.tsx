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
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative space-y-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Buscar cliente (Nombre / Cédula)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            className="w-full bg-white/80 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium shadow-sm"
          />
          {showDropdown && results.length > 0 && (
            <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-slate-200 mt-1 shadow-xl max-h-48 overflow-y-auto rounded-xl text-xs">
              {results.map((c: any) => (
                <li
                  key={c.id}
                  className="p-3 hover:bg-blue-50/80 cursor-pointer border-b border-slate-100 flex justify-between items-center transition"
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
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          {isAddingNew ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {isAddingNew && (
        <form onSubmit={handleRegisterQuickCustomer} className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 p-3.5 rounded-2xl border border-blue-200/80 space-y-2.5 shadow-sm animate-fadeIn">
          <div className="text-xs font-extrabold text-blue-900">Registro Rápido de Cliente</div>
          <input
            type="text"
            placeholder="Nombre y Apellido *"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm font-medium"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Cédula / RIF"
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm font-medium"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm font-medium"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-xs font-bold shadow-md transition-all">
            Guardar y Seleccionar ⚡
          </button>
        </form>
      )}
    </div>
  );
}

type CashRegisterSession = {
  id: number;
  status: 'OPEN' | 'CLOSED' | 'Abierta' | 'Cerrada';
  opened_at?: string;
  closed_at?: string | null;
  opening_usd: number;
  opening_bs: number;
  counted_usd?: number | null;
  counted_bs?: number | null;
  expected_usd?: number | null;
  expected_bs?: number | null;
  difference_usd?: number | null;
  difference_bs?: number | null;
  opened_by?: string | null;
  closed_by?: string | null;
  // Alias usados por el componente para mantener compatibilidad visual.
  openedAt?: string;
  openingUSD?: number;
  openingBs?: number;
};

const CASH_REGISTER_STORAGE_KEY = 'pos_enterprise_cash_register_id';

function normalizeCashRegister(raw: any): CashRegisterSession | null {
  if (!raw || !raw.id) return null;
  const openedAt = raw.opened_at || raw.openedAt || new Date().toISOString();
  return {
    ...raw,
    id: Number(raw.id),
    status: String(raw.status || 'OPEN').toUpperCase() as CashRegisterSession['status'],
    opened_at: openedAt,
    openedAt,
    opening_usd: Number(raw.opening_usd ?? raw.openingUSD ?? 0),
    opening_bs: Number(raw.opening_bs ?? raw.openingBs ?? 0),
    openingUSD: Number(raw.opening_usd ?? raw.openingUSD ?? 0),
    openingBs: Number(raw.opening_bs ?? raw.openingBs ?? 0),
  };
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!contentType.toLowerCase().includes('application/json')) {
    console.error('[POS API] Respuesta no JSON:', response.status, text.slice(0, 500));
    throw new Error(`El servidor devolvió una respuesta no válida (HTTP ${response.status}).`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('[POS API] JSON inválido:', text.slice(0, 500), error);
    throw new Error('El servidor devolvió JSON inválido. Revise la ruta de la API y los logs de Vercel.');
  }
}

async function getOpenCashRegister() {
  const response = await fetch('/api/cash-register?status=open', {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const data = await readJsonResponse(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `No se pudo consultar la caja (HTTP ${response.status}).`);
  }
  return normalizeCashRegister(data.register);
}

function CashRegisterModule({ exchangeRate }: { exchangeRate: number }) {
  const [register, setRegister] = useState<CashRegisterSession | null>(null);
  const [openingUSD, setOpeningUSD] = useState('');
  const [openingBs, setOpeningBs] = useState('');
  const [closingModal, setClosingModal] = useState(false);
  const [countedUSD, setCountedUSD] = useState('');
  const [countedBs, setCountedBs] = useState('');
  const [expectedUSD, setExpectedUSD] = useState(0);
  const [expectedBs, setExpectedBs] = useState(0);
  const [summaryTransactions, setSummaryTransactions] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const loadOpenRegister = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const current = await getOpenCashRegister();
      setRegister(current);

      if (current) {
        localStorage.setItem(CASH_REGISTER_STORAGE_KEY, String(current.id));
        setOpeningUSD(String(current.opening_usd));
        setOpeningBs(String(current.opening_bs));
      } else {
        localStorage.removeItem(CASH_REGISTER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('[CAJA] Error consultando caja:', error);
      setApiError(error instanceof Error ? error.message : 'No se pudo consultar la caja.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOpenRegister();
  }, []);

  const isOpened = String(register?.status || '').toUpperCase() === 'OPEN';

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpening) return;

    const usd = Number(openingUSD || 0);
    const bs = Number(openingBs || 0);
    const username = typeof window !== 'undefined'
      ? (sessionStorage.getItem('usuario_nombre') || localStorage.getItem('usuario_nombre') || 'admin')
      : 'admin';

    if (!Number.isFinite(usd) || !Number.isFinite(bs) || usd < 0 || bs < 0) {
      alert('El fondo inicial no puede ser negativo y debe contener valores válidos.');
      return;
    }
    if (usd === 0 && bs === 0) {
      alert('Ingrese al menos un fondo inicial en USD o Bs.');
      return;
    }

    setIsOpening(true);
    setApiError('');
    try {
      const response = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ openingUSD: usd, openingBs: bs, username }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        if (data.register) setRegister(normalizeCashRegister(data.register));
        throw new Error(data.error || `No se pudo abrir la caja (HTTP ${response.status}).`);
      }

      const opened = normalizeCashRegister(data.register);
      if (!opened) throw new Error('La API abrió la caja pero no devolvió el registro.');

      setRegister(opened);
      localStorage.setItem(CASH_REGISTER_STORAGE_KEY, String(opened.id));
      setOpeningUSD(String(opened.opening_usd));
      setOpeningBs(String(opened.opening_bs));
      alert(`¡Caja #${opened.id} abierta exitosamente!`);
    } catch (error) {
      console.error('[CAJA] Error abriendo caja:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido al abrir la caja.';
      setApiError(message);
      alert(`No se pudo abrir la caja.\n\n${message}`);
    } finally {
      setIsOpening(false);
    }
  };

  const calculateExpectedCash = async () => {
    if (!register?.id) return { usd: 0, bs: 0, transactions: 0 };

    const response = await fetch(`/api/cash-register?id=${register.id}&summary=1`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = await readJsonResponse(response);

    if (!response.ok || !data.success) {
      if (data.code === 'REGISTER_CLOSED') {
        setRegister(null);
        localStorage.removeItem(CASH_REGISTER_STORAGE_KEY);
      }
      throw new Error(data.error || `No se pudo calcular el cierre (HTTP ${response.status}).`);
    }

    const freshRegister = normalizeCashRegister(data.register);
    if (!freshRegister || freshRegister.status !== 'OPEN') {
      setRegister(null);
      localStorage.removeItem(CASH_REGISTER_STORAGE_KEY);
      throw new Error('La caja ya no está abierta en la base de datos.');
    }

    setRegister(freshRegister);
    const summary = data.summary || {};
    const usd = Number(summary.expectedUSD || 0);
    const bs = Number(summary.expectedBs || 0);
    const transactions = Number(summary.transactions || 0);

    setExpectedUSD(usd);
    setExpectedBs(bs);
    setSummaryTransactions(transactions);

    return { usd, bs, transactions };
  };

  const openClosingModal = async () => {
    if (!register?.id || isClosing) return;
    setIsClosing(true);
    setApiError('');
    try {
      await calculateExpectedCash();
      setCountedUSD('');
      setCountedBs('');
      setClosingModal(true);
    } catch (error) {
      console.error('[CAJA] Error preparando cierre:', error);
      const message = error instanceof Error ? error.message : 'No se pudo calcular el efectivo esperado.';
      setApiError(message);
      alert(message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!register?.id || isClosing) return;

    const actualUSD = Number(countedUSD || 0);
    const actualBs = Number(countedBs || 0);
    if (!Number.isFinite(actualUSD) || !Number.isFinite(actualBs) || actualUSD < 0 || actualBs < 0) {
      alert('El efectivo contado debe ser un número válido y no puede ser negativo.');
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmar cierre de la caja #${register.id}?\n\n` +
      `USD esperado: $${expectedUSD.toFixed(2)}\n` +
      `USD contado: $${actualUSD.toFixed(2)}\n` +
      `Bs. esperado: Bs. ${expectedBs.toFixed(2)}\n` +
      `Bs. contado: Bs. ${actualBs.toFixed(2)}`
    );
    if (!confirmed) return;

    setIsClosing(true);
    setApiError('');
    try {
      // La API vuelve a calcular expectedUSD/expectedBs desde SQLite Cloud.
      const username = typeof window !== 'undefined'
        ? (sessionStorage.getItem('usuario_nombre') || localStorage.getItem('usuario_nombre') || 'admin')
        : 'admin';

      const response = await fetch('/api/cash-register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: register.id,
          countedUSD: actualUSD,
          countedBs: actualBs,
          username,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        if (data.code === 'REGISTER_CLOSED') {
          setRegister(null);
          localStorage.removeItem(CASH_REGISTER_STORAGE_KEY);
          setClosingModal(false);
        }
        throw new Error(data.error || `No se pudo cerrar la caja (HTTP ${response.status}).`);
      }

      const closed = normalizeCashRegister(data.register);
      const serverSummary = data.summary || {};
      const finalExpectedUSD = Number(serverSummary.expectedUSD ?? data.register?.expected_usd ?? expectedUSD);
      const finalExpectedBs = Number(serverSummary.expectedBs ?? data.register?.expected_bs ?? expectedBs);
      const differenceUSD = actualUSD - finalExpectedUSD;
      const differenceBs = actualBs - finalExpectedBs;

      // El servidor es la fuente de verdad. El localStorage solo se limpia después del cierre exitoso.
      localStorage.removeItem(CASH_REGISTER_STORAGE_KEY);
      setRegister(null);
      setOpeningUSD('');
      setOpeningBs('');
      setClosingModal(false);
      setCountedUSD('');
      setCountedBs('');

      alert(
        `--- CIERRE DE CAJA #${register.id} ---\n\n` +
        `Transacciones en caja: ${summaryTransactions}\n\n` +
        `USD Esperado: $${finalExpectedUSD.toFixed(2)}\n` +
        `USD Contado: $${actualUSD.toFixed(2)}\n` +
        `Diferencia USD: $${differenceUSD.toFixed(2)}\n\n` +
        `Bs. Esperado: Bs. ${finalExpectedBs.toFixed(2)}\n` +
        `Bs. Contado: Bs. ${actualBs.toFixed(2)}\n` +
        `Diferencia Bs.: Bs. ${differenceBs.toFixed(2)}`
      );

      void closed;
    } catch (error) {
      console.error('[CAJA] Error cerrando caja:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido al cerrar la caja.';
      setApiError(message);
      alert(`No se pudo cerrar la caja.\n\n${message}`);
      await loadOpenRegister();
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-lg shadow-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">🔐 Control de Caja y Turno</h3>
          {register && <p className="text-xs text-slate-500 font-medium mt-0.5">Caja #{register.id} · Abierta: {new Date(register.opened_at || new Date()).toLocaleTimeString()}</p>}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isOpened ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-rose-50 text-rose-700 border border-rose-200/80'}`}>
          {isLoading ? '⏳ Consultando...' : isOpened ? '🟢 Abierta' : '🔴 Cerrada'}
        </span>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-xs font-semibold">
          ⚠️ {apiError}
          <button onClick={loadOpenRegister} className="ml-2 underline font-black">Reintentar</button>
        </div>
      )}

      {!isOpened ? (
        <form onSubmit={handleOpenRegister} className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div className="text-xs font-bold text-slate-700">Fondo Inicial de Caja</div>
          <div className="grid grid-cols-2 gap-2.5">
            <input type="number" min="0" step="0.01" required value={openingUSD} onChange={(e) => setOpeningUSD(e.target.value)} placeholder="USD ($)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-sm" />
            <input type="number" min="0" step="0.01" required value={openingBs} onChange={(e) => setOpeningBs(e.target.value)} placeholder="Bs. (Bs.)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-sm" />
          </div>
          <button disabled={isOpening || isLoading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md">
            {isOpening ? 'Abriendo caja...' : 'Abrir Turno 🔓'}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl text-xs space-y-1 text-emerald-900 shadow-sm">
            <div className="font-bold">Turno en curso activo · Caja #{register.id}</div>
            <div className="text-slate-600">Inicial: <strong className="font-bold text-slate-900">${register.opening_usd.toFixed(2)}</strong> / <strong className="font-bold text-slate-900">Bs. {register.opening_bs.toFixed(2)}</strong></div>
          </div>
          <button disabled={isClosing} onClick={openClosingModal} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md">
            {isClosing ? 'Consultando caja...' : 'Conteo Ciego y Cierre 🔒'}
          </button>
        </div>
      )}

      {closingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-black text-slate-900">Conteo Ciego de Cierre · Caja #{register?.id}</h3>
            <p className="text-xs text-slate-500">Ingrese el efectivo físico total contado en gaveta. El sistema verificará nuevamente la caja al confirmar.</p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>USD esperado</span><strong>${expectedUSD.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Bs. esperado</span><strong>Bs. {expectedBs.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Transacciones</span><strong>{summaryTransactions}</strong></div>
            </div>
            <div className="space-y-3">
              <input type="number" min="0" step="0.01" placeholder="Total USD contado ($)" value={countedUSD} onChange={(e) => setCountedUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm" />
              <input type="number" min="0" step="0.01" placeholder="Total Bs contado (Bs.)" value={countedBs} onChange={(e) => setCountedBs(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <button disabled={isClosing} onClick={() => setClosingModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition">Cancelar</button>
              <button disabled={isClosing} onClick={handleCloseRegister} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold shadow-md">{isClosing ? 'Cerrando...' : 'Confirmar Cierre ✓'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Stock límite alcanzado.');
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

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ivaUSD = cart.reduce((acc, item) => acc + (item.taxable ? item.price * item.quantity * IVA_RATE : 0), 0);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * exchangeRate;

  const totalSalesTodayUSD = salesHistory.reduce((acc, s) => acc + s.totalUSD, 0);
  const totalTransactionsCount = salesHistory.length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const givenUSD = parseFloat(cashGivenUSD || '0');
    let changeUSD = 0;
    let changeBs = 0;

    if (paymentMethod === 'Efectivo USD') {
      if (givenUSD < totalUSD) {
        alert('El monto entregado es menor al total.');
        return;
      }
      changeUSD = givenUSD - totalUSD;
      changeBs = changeUSD * exchangeRate;
    }

    if (paymentMethod === 'Crédito / Fiado' && !clientName) {
      alert('Especifique el nombre del cliente para ventas a crédito.');
      return;
    }

    // La caja se consulta directamente en SQLite Cloud justo antes de vender.
    // localStorage solo conserva una referencia visual y nunca es la fuente de verdad.
    let openRegister: CashRegisterSession | null = null;
    try {
      openRegister = await getOpenCashRegister();
    } catch (error) {
      console.error('[VENTA] No se pudo verificar la caja:', error);
      alert(error instanceof Error ? error.message : 'No se pudo verificar la caja.');
      return;
    }

    if (!openRegister?.id || String(openRegister.status).toUpperCase() !== 'OPEN') {
      alert('No hay una caja abierta en la base de datos. Abra una caja antes de generar la venta.');
      return;
    }

    const salePayload = {
      cashRegisterId: openRegister.id,
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
      const data = await readJsonResponse(res);

      if (data.success && res.ok) {
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
            await fetch(`/api/products/${prod.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...prod, stock: prod.stock - item.quantity })
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
        if (data.code === 'REGISTER_CLOSED' || data.code === 'NO_OPEN_REGISTER') {
          alert(data.error || 'No hay una caja abierta.');
        } else {
          alert('Error: ' + (data.error || 'Desconocido'));
        }
      }
    } catch (err) {
      console.error('[VENTA] Error procesando la venta:', err);
      alert(err instanceof Error ? err.message : 'Error procesando la venta.');
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
        alert('¡Producto creado exitosamente!');
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

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock || !restockAmount) return;
    const qty = parseInt(restockAmount);
    if (isNaN(qty) || qty <= 0) return;

    try {
      const res = await fetch(`/api/products/${selectedProductForRestock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedProductForRestock, stock: selectedProductForRestock.stock + qty })
      });
      if (res.ok) {
        alert('¡Inventario reabastecido!');
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
      description: newPayableDesc || 'Compra mercancía',
      totalDebtUSD: amountUSD,
      totalDebtBs: amountUSD * exchangeRate,
      dueDate: newDueDate || new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      status: 'Pendiente'
    };
    setPayables(prev => [newPayable, ...prev]);
    setNewProviderName(''); setNewProviderDoc(''); setNewPayableDesc(''); setNewPayableAmountUSD(''); setNewDueDate('');
    alert('¡Cuenta por pagar registrada!');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-200/50 text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar Corporativo con diseño Glassmorphism */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/90 flex flex-col justify-between p-5 hidden md:flex sticky top-0 h-screen z-40 shadow-xl shadow-slate-200/50">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl font-black text-xs shadow-md shadow-blue-500/20">⚡</div>
            <div>
              <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider">POS Enterprise</h1>
              <p className="text-[10px] text-blue-600 font-bold">Venezuela</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            {userPermissions.includes('view_pos') && (
              <button onClick={() => setActiveTab('pos')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'pos' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'}`}>
                🛒 <span>POS Caja</span>
              </button>
            )}
            {userPermissions.includes('view_inventory') && (
              <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'}`}>
                📦 <span>Inventario</span>
              </button>
            )}
            {userPermissions.includes('view_reports') && (
              <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'}`}>
                📊 <span>Reportes</span>
              </button>
            )}
            {(userPermissions.includes('view_credits') || userPermissions.includes('view_payables') || userPermissions.includes('manage_roles')) && (
              <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'}`}>
                📑 <span>Finanzas</span>
              </button>
            )}
            {userPermissions.includes('view_pos') && (
              <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'customers' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'}`}>
                👥 <span>Clientes</span>
              </button>
            )}
            {userPermissions.includes('manage_roles') && (
              <button onClick={() => setActiveTab('roles')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'roles' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-black' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'}`}>
                🔐 <span>Roles y Accesos</span>
              </button>
            )}
          </nav>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 p-3.5 rounded-2xl space-y-2 shadow-sm">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tasa BCV Activa</div>
          <div className="text-xs font-black text-blue-600">Bs. {exchangeRate.toFixed(2)} / $1</div>
        </div>
      </aside>

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header con Glassmorphism */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider hidden sm:inline">Módulo Actual:</span>
            <span className="text-xs font-black text-blue-700 uppercase bg-blue-50/90 px-3 py-1.5 rounded-xl border border-blue-200/80 shadow-xs">
              {activeTab === 'pos' && 'Punto de Venta'}
              {activeTab === 'inventory' && 'Control de Inventario'}
              {activeTab === 'reports' && 'Analítica Comercial'}
              {activeTab === 'accounts' && 'Cuentas y Finanzas'}
              {activeTab === 'customers' && 'Directorio de Clientes'}
              {activeTab === 'roles' && 'Gestión de Roles'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-white/90 border border-slate-200/90 hover:bg-white text-slate-700 font-bold px-3.5 py-1.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5">
              <span>🌙</span> Modo Oscuro
            </button>

            <div className="flex items-center gap-3 bg-white/90 border border-slate-200/80 px-3 py-1.5 rounded-2xl shadow-sm">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">{currentUserObj?.name || currentUsername}</div>
                <div className="text-[10px] text-blue-600 font-semibold">{currentRoleObj?.name || 'Operador'}</div>
              </div>
              <select value={currentUsername} onChange={(e) => setCurrentUsername(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none shadow-xs">
                {usersList.map((u: any) => (<option key={u.id || u.username} value={u.username}>{u.name || u.username}</option>))}
              </select>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          
          {/* KPI Header Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-lg shadow-slate-100 flex items-center justify-between transition-all hover:shadow-xl">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ventas Totales Registradas</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">${totalSalesTodayUSD.toFixed(2)}</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Bs. {(totalSalesTodayUSD * exchangeRate).toFixed(2)}</p>
              </div>
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">📈</div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-lg shadow-slate-100 flex items-center justify-between transition-all hover:shadow-xl">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Transacciones Realizadas</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{totalTransactionsCount}</h3>
                <p className="text-[10px] text-blue-600 font-bold mt-0.5">Órdenes procesadas en sistema</p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">🧾</div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-lg shadow-slate-100 flex items-center justify-between transition-all hover:shadow-xl">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Alertas de Stock Bajo</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{lowStockCount}</h3>
                <p className="text-[10px] text-amber-600 font-bold mt-0.5">Productos por reponer</p>
              </div>
              <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">⚠️</div>
            </div>
          </div>

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
                    className="flex-1 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-blue-600 shadow-sm transition-all"
                  />
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25' : 'bg-white/90 border border-slate-200/90 text-slate-700 hover:bg-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`bg-white/90 backdrop-blur-md border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${product.stock <= 0 ? 'opacity-50 border-rose-200 bg-rose-50/20' : 'border-slate-200/90 hover:border-blue-500'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{product.category}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${product.stock > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : product.stock > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-rose-100 text-rose-700'}`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mt-2.5 line-clamp-2">{product.name}</h4>
                      </div>
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-end">
                        <div>
                          <div className="text-sm font-black text-slate-900">${product.price.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Bs. {(product.price * exchangeRate).toFixed(2)}</div>
                        </div>
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-sm">＋</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="space-y-4">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-lg shadow-slate-100 space-y-4 flex flex-col h-[calc(100vh-170px)] sticky top-20">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">🛒 Carrito Actual</h3>
                    <button onClick={() => setCart([])} className="text-xs text-rose-500 font-bold hover:underline">Vaciar</button>
                  </div>

                  <POSCustomerSelector onSelectCustomer={(c) => {
                    setClientName(c.name);
                    setClientDocument(c.document);
                    setClientPhone(c.phone);
                  }} />

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6 font-medium">
                        <span className="text-3xl mb-2">🛍️</span>
                        El carrito está vacío. Selecciona productos para facturar.
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 flex justify-between items-center gap-2.5 shadow-xs">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-500 font-medium">${item.price.toFixed(2)} c/u</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100">-</button>
                              <span className="px-2 text-xs font-bold">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 text-sm font-bold p-1">×</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>Subtotal</span>
                      <span>${subtotalUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>IVA (16%)</span>
                      <span>${ivaUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
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
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 mt-1"
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
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-4">
                  <h3 className="font-black text-slate-900 text-sm">➕ Nuevo Producto</h3>
                  <form onSubmit={handleAddProduct} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nombre *</label>
                      <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Hamburguesa Doble" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Costo ($)</label>
                        <input type="number" step="0.01" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Precio Venta ($) *</label>
                        <input type="number" step="0.01" required value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Categoría</label>
                        <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Comida, Bebidas..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Stock Inicial *</label>
                        <input type="number" required value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" id="taxableCheck" checked={newTaxable} onChange={e => setNewTaxable(e.target.checked)} className="rounded text-blue-600 w-4 h-4 shadow-sm" />
                      <label htmlFor="taxableCheck" className="text-xs text-slate-800 font-semibold">Aplica IVA (16%)</label>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-500/25 mt-2 transition-all">Guardar Producto 💾</button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-black text-slate-900 text-sm">📦 Listado de Inventario</h3>
                    <div className="flex gap-1.5">
                      <button onClick={() => setInventoryFilterMode('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${inventoryFilterMode === 'all' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Todos</button>
                      <button onClick={() => setInventoryFilterMode('low')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${inventoryFilterMode === 'low' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Stock Bajo</button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 uppercase font-extrabold tracking-wider">
                          <th className="p-3">Producto</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Precio</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.filter(p => inventoryFilterMode === 'all' || p.stock <= 5).map(p => (
                          <tr key={p.id} className="hover:bg-blue-50/30 transition">
                            <td className="p-3 font-bold text-slate-900">{p.name}</td>
                            <td className="p-3 text-slate-600">{p.category}</td>
                            <td className="p-3 font-black text-slate-900">${p.price.toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${p.stock > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                {p.stock} unids.
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => { setSelectedProductForRestock(p); setIsRestockModalOpen(true); }}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl text-[10px] transition-all shadow-sm"
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
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-3">
                  <h3 className="text-sm font-black text-slate-900">💱 Tasa Oficial BCV</h3>
                  <p className="text-xs text-slate-500">Actualiza la tasa de referencia para el cálculo instantáneo en bolívares.</p>
                  <div className="flex gap-2 pt-2">
                    <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm" />
                    <button onClick={() => alert('¡Tasa de cambio guardada!')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md">Guardar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">📊 Reportes y Analítica Comercial</h3>
                  <p className="text-xs text-slate-500">Monitoreo de ingresos y tendencias de venta.</p>
                </div>
                <div className="flex gap-1.5">
                  {(['all', 'today', 'week', 'month'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => setReportFilterPeriod(period)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-sm ${reportFilterPeriod === period ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {period === 'all' ? 'Histórico' : period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-3">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Tendencia de Ventas ($)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesHistory.slice(0, 10).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="totalUSD" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-3">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Volumen por Transacción</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesHistory.slice(0, 10).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="totalUSD" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-4">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Historial Detallado</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 uppercase font-extrabold tracking-wider">
                        <th className="p-3">ID / Fecha</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Método de Pago</th>
                        <th className="p-3">Total USD</th>
                        <th className="p-3">Total Bs.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesHistory.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No hay ventas registradas.</td></tr>}
                      {salesHistory.map(sale => (
                        <tr key={sale.id} className="hover:bg-blue-50/30 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">#{sale.id}</div>
                            <div className="text-[10px] text-slate-500">{sale.date}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-800">{sale.clientName || 'Cliente Genérico'}</td>
                          <td className="p-3"><span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-100"> {sale.paymentMethod}</span></td>
                          <td className="p-3 font-black text-slate-900">${sale.totalUSD.toFixed(2)}</td>
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
              <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-4">
                <h3 className="text-base font-black text-slate-900">📑 Cuentas por Cobrar (Créditos / Fiados)</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 uppercase font-extrabold tracking-wider">
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Contacto</th>
                        <th className="p-3">Deuda USD</th>
                        <th className="p-3">Deuda Bs.</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {credits.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-medium">No hay créditos activos.</td></tr>}
                      {credits.map(c => (
                        <tr key={c.id} className="hover:bg-blue-50/30 transition">
                          <td className="p-3 font-bold text-slate-900">{c.clientName}</td>
                          <td className="p-3 text-slate-600">{c.clientPhone} / {c.clientDocument}</td>
                          <td className="p-3 font-black text-slate-900">${c.totalDebtUSD.toFixed(2)}</td>
                          <td className="p-3 text-slate-600">Bs. {c.totalDebtBs.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${c.status === 'Pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
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
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition-all shadow-sm"
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
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-4">
                  <h3 className="font-black text-slate-900 text-sm">➕ Registrar Cuenta por Pagar</h3>
                  <form onSubmit={handleAddPayable} className="space-y-3">
                    <input type="text" placeholder="Proveedor *" required value={newProviderName} onChange={e => setNewProviderName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                    <input type="text" placeholder="Rif / Cédula" value={newProviderDoc} onChange={e => setNewProviderDoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                    <input type="text" placeholder="Descripción de la deuda" value={newPayableDesc} onChange={e => setNewPayableDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                    <input type="number" step="0.01" placeholder="Monto USD ($) *" required value={newPayableAmountUSD} onChange={e => setNewPayableAmountUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                    <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-500/25 transition-all">Guardar Deuda 💾</button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-lg shadow-slate-100 space-y-4">
                  <h3 className="font-black text-slate-900 text-sm">📋 Cuentas por Pagar a Proveedores</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 uppercase font-extrabold tracking-wider">
                          <th className="p-3">Proveedor</th>
                          <th className="p-3">Descripción</th>
                          <th className="p-3">Monto USD</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payables.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No hay cuentas por pagar.</td></tr>}
                        {payables.map(p => (
                          <tr key={p.id} className="hover:bg-blue-50/30 transition">
                            <td className="p-3 font-bold text-slate-900">{p.providerName}</td>
                            <td className="p-3 text-slate-600">{p.description}</td>
                            <td className="p-3 font-black text-slate-900">${p.totalDebtUSD.toFixed(2)}</td>
                            <td className="p-3"><span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${p.status === 'Pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{p.status}</span></td>
                            <td className="p-3 text-right">
                              {p.status === 'Pendiente' && (
                                <button onClick={() => {
                                  setPayables(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Pagado' } : item));
                                  alert('¡Cuenta pagada!');
                                }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] shadow-sm">Pagar ✓</button>
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
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-black text-slate-900">💳 Procesar Pago</h3>
            <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/90 space-y-1 shadow-sm">
              <div className="flex justify-between text-xs font-bold text-slate-700"><span>Total a Pagar:</span><span className="font-black text-slate-900">${totalUSD.toFixed(2)} / Bs. {totalBs.toFixed(2)}</span></div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-sm"
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
                  <input type="number" step="0.01" placeholder="0.00" value={cashGivenUSD} onChange={e => setCashGivenUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm" />
                </div>
              )}

              {paymentMethod === 'Crédito / Fiado' && (
                <div className="space-y-2.5">
                  <input type="text" placeholder="Nombre del Cliente *" required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                  <input type="text" placeholder="Cédula / RIF" value={clientDocument} onChange={e => setClientDocument(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                  <input type="text" placeholder="Teléfono" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-sm font-medium" />
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-xs font-bold text-slate-700 transition">Cancelar</button>
              <button onClick={handleCheckout} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all">Confirmar Venta ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && selectedProductForRestock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-black text-slate-900">Reponer Inventario</h3>
            <p className="text-xs text-slate-600">Producto: <strong className="text-slate-900">{selectedProductForRestock.name}</strong> (Actual: {selectedProductForRestock.stock})</p>
            <form onSubmit={handleRestock} className="space-y-3">
              <input type="number" min="1" required placeholder="Cantidad a agregar *" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsRestockModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs font-bold text-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md">Actualizar ➕</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success / Receipt Modal */}
      {successModalData && successModalData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-scaleUp">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-sm">✓</div>
            <h3 className="text-lg font-black text-slate-900">¡Venta Exitosa!</h3>
            {successModalData.changeUSD > 0 && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900 space-y-1 shadow-sm">
                <div className="font-bold text-[10px] text-emerald-700 uppercase tracking-wider">Cambio a Entregar</div>
                <div className="text-sm font-black">${successModalData.changeUSD.toFixed(2)} / Bs. {successModalData.changeBs.toFixed(2)}</div>
              </div>
            )}
            {lastPrintedSale && <ReceiptTicket sale={lastPrintedSale} />}
            <button onClick={() => setSuccessModalData(null)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all">Continuar Vendiendo ⚡</button>
          </div>
        </div>
      )}
    </div>
  );
}
