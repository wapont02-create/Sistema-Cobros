'use client';

import React, { useState, useEffect } from 'react';

interface CashRegisterModuleProps {
  exchangeRate: number;
  currentUsername: string;
  userRole: string;
}

interface CashRegister {
  id: number;
  user_id: number | null;
  opening_date: string;
  closing_date: string | null;
  opening_usd: number;
  opening_ves: number;
  closing_usd: number | null;
  closing_ves: number | null;
  status: string;
}

export default function CashRegisterModule({
  exchangeRate,
  currentUsername,
  userRole,
}: CashRegisterModuleProps) {

  const [isOpened, setIsOpened] = useState<boolean | null>(null);

  const [openingUSD, setOpeningUSD] = useState('');
  const [openingBs, setOpeningBs] = useState('');

  const [closingModal, setClosingModal] = useState(false);

  const [openedBy, setOpenedBy] = useState('');
  const [registerId, setRegisterId] = useState<number | null>(null);

  const [countedUSD, setCountedUSD] = useState('');
  const [countedBs, setCountedBs] = useState('');

  const [loading, setLoading] = useState(false);

  // =====================================================
  // OBTENER ID DEL USUARIO LOGUEADO
  // =====================================================

  const getCurrentUserId = (): number | null => {
    try {
      const storedUser = localStorage.getItem('pos_user');

      if (!storedUser) {
        console.warn('No existe pos_user en localStorage');
        return null;
      }

      const user = JSON.parse(storedUser);

      console.log('USUARIO LOGUEADO:', user);

      return user.id ? Number(user.id) : null;

    } catch (error) {
      console.error('Error leyendo usuario:', error);
      return null;
    }
  };

  // =====================================================
  // CONSULTAR ESTADO DE CAJA
  // =====================================================

  const checkCashStatus = async () => {
    try {

      console.log('Consultando estado de caja...');

      const res = await fetch('/api/cash', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await res.json();

      console.log('RESPUESTA ESTADO CAJA:', data);

      if (data.isOpen && data.register) {

        const register: CashRegister = data.register;

        setIsOpened(true);

        setRegisterId(Number(register.id));

        setOpeningUSD(
          String(register.opening_usd ?? 0)
        );

        setOpeningBs(
          String(register.opening_ves ?? 0)
        );

        setOpenedBy(
          register.user_id
            ? `Usuario #${register.user_id}`
            : currentUsername || 'Usuario'
        );

      } else {

        setIsOpened(false);

        setOpenedBy('');

        setRegisterId(null);

        setOpeningUSD('');

        setOpeningBs('');
      }

    } catch (error) {

      console.error(
        'Error al sincronizar la caja:',
        error
      );

      setIsOpened(false);
    }
  };

  // =====================================================
  // CONSULTAR AL CARGAR
  // =====================================================

  useEffect(() => {
    checkCashStatus();
  }, []);

  // =====================================================
  // ABRIR CAJA
  // =====================================================

  const handleOpenRegister = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    const usd = Number(openingUSD) || 0;
    const bs = Number(openingBs) || 0;

    if (usd < 0 || bs < 0) {
      alert('Los montos no pueden ser negativos.');
      return;
    }

    if (usd === 0 && bs === 0) {
      alert(
        'Debes ingresar un fondo inicial en USD o Bs.'
      );
      return;
    }

    setLoading(true);

    try {

      const userId = getCurrentUserId();

      console.log(
        'ABRIENDO CAJA CON:',
        {
          userId,
          openingUSD: usd,
          openingBs: bs,
          currentUsername,
          userRole,
        }
      );

      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'open',

          openingUSD: usd,

          openingBs: bs,

          userId,

          username: currentUsername,

          userRole,
        }),
      });

      const data = await res.json();

      console.log(
        'RESPUESTA APERTURA CAJA:',
        data
      );

      if (!res.ok || !data.success) {

        alert(
          data.error ||
          'No se pudo abrir la caja.'
        );

        return;
      }

      alert(
        '¡Caja abierta exitosamente!'
      );

      // Volver a consultar directamente desde BD
      await checkCashStatus();

    } catch (error) {

      console.error(
        'Error al abrir la caja:',
        error
      );

      alert(
        'Error de conexión al intentar abrir la caja.'
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // CERRAR CAJA
  // =====================================================

  const handleCloseRegister = async () => {

    if (!registerId) {

      alert(
        'No se encontró el ID de la caja abierta.'
      );

      return;
    }

    const usd = Number(countedUSD) || 0;
    const bs = Number(countedBs) || 0;

    if (usd < 0 || bs < 0) {

      alert(
        'Los montos contados no pueden ser negativos.'
      );

      return;
    }

    setLoading(true);

    try {

      console.log(
        'CERRANDO CAJA:',
        {
          registerId,
          countedUSD: usd,
          countedBs: bs,
        }
      );

      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({

          action: 'close',

          countedUSD: usd,

          countedBs: bs,

          registerId,

          username: currentUsername,
        }),
      });

      const data = await res.json();

      console.log(
        'RESPUESTA CIERRE CAJA:',
        data
      );

      if (!res.ok || !data.success) {

        alert(
          data.error ||
          'No se pudo cerrar la caja.'
        );

        return;
      }

      alert(
        '--- REPORTE DE CIERRE DE CAJA ---\n\n' +
        'Turno cerrado correctamente.'
      );

      setClosingModal(false);

      setCountedUSD('');

      setCountedBs('');

      await checkCashStatus();

    } catch (error) {

      console.error(
        'Error al cerrar la caja:',
        error
      );

      alert(
        'Error de conexión al intentar cerrar la caja.'
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (isOpened === null) {

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-xs text-slate-500">
        Verificando estado de caja...
      </div>
    );
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (

    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

      {/* ENCABEZADO */}

      <div className="flex justify-between items-center border-b border-slate-100 pb-3">

        <h3 className="text-lg font-bold text-slate-800">
          🔐 Módulo de Caja
        </h3>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isOpened
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          Caja {isOpened ? 'Abierta' : 'Cerrada'}
        </span>

      </div>

      {/* ================================================= */}
      {/* CAJA CERRADA */}
      {/* ================================================= */}

      {!isOpened ? (

        <form
          onSubmit={handleOpenRegister}
          className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
        >

          <div className="text-xs font-bold text-blue-600">
            Apertura de Turno
          </div>

          <div className="text-[11px] text-slate-500">
            Usuario: <strong>{currentUsername}</strong>
          </div>

          <div className="text-[11px] text-slate-500">
            Rol: <strong>{userRole}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">

            {/* USD */}

            <div>

              <label className="block text-[11px] text-slate-600 mb-1">
                Efectivo USD ($)
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingUSD}
                onChange={(e) =>
                  setOpeningUSD(e.target.value)
                }
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
              />

            </div>

            {/* BS */}

            <div>

              <label className="block text-[11px] text-slate-600 mb-1">
                Efectivo Bs (Bs.)
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingBs}
                onChange={(e) =>
                  setOpeningBs(e.target.value)
                }
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
          >

            {loading
              ? 'Abriendo caja...'
              : 'Iniciar Turno y Abrir Caja 🔓'}

          </button>

        </form>

      ) : (

        /* ================================================= */
        /* CAJA ABIERTA */
        /* ================================================= */

        <div className="space-y-3">

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2 text-emerald-800">

            <div>
              Turno activo para:{' '}
              <strong>{openedBy}</strong>
            </div>

            <div>
              ID Registro:{' '}
              <strong>#{registerId}</strong>
            </div>

            <div>
              Fondo inicial:{' '}
              <strong>
                ${Number(openingUSD).toFixed(2)} USD
              </strong>
                {' / '}
              <strong>
                Bs. {Number(openingBs).toFixed(2)}
              </strong>
            </div>

            <div>
              Tasa actual:{' '}
              <strong>
                Bs. {Number(exchangeRate).toFixed(2)} / USD
              </strong>
            </div>

          </div>

          <button
            onClick={() =>
              setClosingModal(true)
            }
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
          >
            Realizar Conteo Ciego y Cerrar Turno 🔒
          </button>

        </div>
      )}

      {/* ================================================= */}
      {/* MODAL CIERRE */}
      {/* ================================================= */}

      {closingModal && (

        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">

            <h3 className="text-lg font-bold text-slate-800">
              Cierre de Turno
            </h3>

            <p className="text-xs text-slate-500">
              Ingresa el efectivo físico contado
              en caja.
            </p>

            {/* USD */}

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Total USD contado ($)"
              value={countedUSD}
              onChange={(e) =>
                setCountedUSD(e.target.value)
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            />

            {/* BS */}

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Total Bs contado (Bs.)"
              value={countedBs}
              onChange={(e) =>
                setCountedBs(e.target.value)
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            />

            <div className="flex gap-2 pt-2">

              <button
                onClick={() =>
                  setClosingModal(false)
                }
                disabled={loading}
                className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={handleCloseRegister}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >

                {loading
                  ? 'Cerrando...'
                  : 'Cerrar Turno ✓'}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
