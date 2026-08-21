import React, { useState, useEffect } from 'react';

export default function CashRegisterModule({ exchangeRate, currentUsername, userRole }: { exchangeRate: number; currentUsername: string; userRole: string }) {
  const [isOpened, setIsOpened] = useState<boolean | null>(null); // null mientras carga
  const [openingUSD, setOpeningUSD] = useState('');
  const [openingBs, setOpeningBs] = useState('');
  const [closingModal, setClosingModal] = useState(false);
  const [openedBy, setOpenedBy] = useState('');
  const [registerId, setRegisterId] = useState<number | null>(null);
  
  const [countedUSD, setCountedUSD] = useState('');
  const [countedBs, setCountedBs] = useState('');

  // Sincronización constante y forzada con la base de datos
  const checkCashStatus = async () => {
    try {
      const res = await fetch('/api/cash');
      const data = await res.json();
      if (data.isOpen && data.register) {
        setIsOpened(true);
        setOpenedBy(data.register.opened_by || 'Usuario');
        setRegisterId(data.register.id);
        setOpeningUSD(data.register.opening_usd || '0');
        setOpeningBs(data.register.opening_bs || '0');
      } else {
        setIsOpened(false);
        setOpenedBy('');
        setRegisterId(null);
      }
    } catch (err) {
      console.error("Error al sincronizar la caja:", err);
      setIsOpened(false);
    }
  };

  useEffect(() => {
    checkCashStatus();
  }, []);

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingUSD && !openingBs) return;

    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          openingUSD: parseFloat(openingUSD || '0'),
          openingBs: parseFloat(openingBs || '0'),
          username: currentUsername,
          userRole: userRole
        })
      });

      if (res.ok) {
        alert(`¡Caja abierta exitosamente!`);
        await checkCashStatus(); // Volver a consultar de inmediato para fijar el ID real
      } else {
        alert('Error al abrir la caja');
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const handleCloseRegister = async () => {
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          countedUSD: parseFloat(countedUSD || '0'),
          countedBs: parseFloat(countedBs || '0'),
          username: currentUsername,
          registerId: registerId
        })
      });

      if (res.ok) {
        alert(`--- REPORTE DE CIERRE DE CAJA ---\nTurno cerrado correctamente`);
        setClosingModal(false);
        setCountedUSD('');
        setCountedBs('');
        await checkCashStatus(); // Actualizar estado a cerrado
      } else {
        alert('Error al cerrar la caja');
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  // Mostrar un estado de carga breve para evitar parpadeos visuales
  if (isOpened === null) {
    return <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-xs text-slate-500">Verificando estado de caja...</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="text-lg font-bold text-slate-800">🔐 Módulo de Caja Chica</h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isOpened ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          Caja {isOpened ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      {!isOpened ? (
        <form onSubmit={handleOpenRegister} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-blue-600">Apertura de Turno (Rol: {userRole}): Registrar efectivo inicial</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Efectivo USD ($)</label>
              <input type="number" step="0.01" required value={openingUSD} onChange={(e) => setOpeningUSD(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Efectivo Bs (Bs.)</label>
              <input type="number" step="0.01" required value={openingBs} onChange={(e) => setOpeningBs(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
            Iniciar Turno y Abrir Caja 🔓
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-1 text-emerald-800">
            <div>Turno activo para: <strong>{openedBy}</strong> (ID Registro: #{registerId})</div>
            <div>Fondo inicial: <strong>${openingUSD} USD</strong> / <strong>Bs. {openingBs}</strong></div>
          </div>
          <button onClick={() => setClosingModal(true)} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
            Realizar Conteo Ciego y Cerrar Turno 🔒
          </button>
        </div>
      )}

      {closingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Cierre de Turno de {openedBy}</h3>
            <p className="text-xs text-slate-500">Ingrese el efectivo físico contado en caja para cuadrar el turno:</p>
            <div className="space-y-3">
              <input type="number" step="0.01" placeholder="Total USD contado ($)" value={countedUSD} onChange={(e) => setCountedUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
              <input type="number" step="0.01" placeholder="Total Bs contado (Bs.)" value={countedBs} onChange={(e) => setCountedBs(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setClosingModal(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleCloseRegister} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Cerrar Turno ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
