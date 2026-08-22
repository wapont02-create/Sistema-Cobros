'use client';

import React, { useEffect, useState } from 'react';

interface CashRegisterModuleProps {
  exchangeRate: number;
  currentUsername: string;
  userRole: string;
}

interface CashRegister {
  id: number;
  user_id: number;
  opened_by?: string;
  user_role?: string;
  opening_date?: string;
  closing_date?: string | null;
  opening_usd: number;
  opening_ves: number;
  closing_usd?: number | null;
  closing_ves?: number | null;
  status: string;
}

interface StoredUser {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
}

export default function CashRegisterModule({
  exchangeRate,
  currentUsername,
  userRole,
}: CashRegisterModuleProps) {

  // ======================================================
  // ESTADOS
  // ======================================================

  const [isOpened, setIsOpened] = useState<boolean | null>(null);

  const [openingUSD, setOpeningUSD] = useState('');
  const [openingBs, setOpeningBs] = useState('');

  const [closingModal, setClosingModal] = useState(false);

  const [openedBy, setOpenedBy] = useState('');
  const [registerId, setRegisterId] = useState<number | null>(null);

  const [countedUSD, setCountedUSD] = useState('');
  const [countedBs, setCountedBs] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');

  const [currentRegister, setCurrentRegister] =
    useState<CashRegister | null>(null);

  // ======================================================
  // OBTENER USUARIO DEL LOCALSTORAGE
  // ======================================================

  const getStoredUser = (): StoredUser | null => {
    try {
      const storedUser = localStorage.getItem('pos_user');

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error(
        'Error leyendo pos_user:',
        error
      );

      return null;
    }
  };

  // ======================================================
  // CONSULTAR ESTADO DE CAJA
  // ======================================================

  const checkCashStatus = async () => {
    try {
      setLoadingStatus(true);
      setErrorMsg('');

      const res = await fetch('/api/cash', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await res.json();

      console.log(
        'RESPUESTA ESTADO CAJA:',
        data
      );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          'No se pudo consultar el estado de la caja.'
        );
      }

      if (data.isOpen && data.register) {

        const register: CashRegister =
          data.register;

        setIsOpened(true);

        setCurrentRegister(register);

        setRegisterId(
          Number(register.id)
        );

        setOpenedBy(
          register.opened_by ||
          currentUsername ||
          'Usuario'
        );

        setOpeningUSD(
          String(
            register.opening_usd ?? 0
          )
        );

        setOpeningBs(
          String(
            register.opening_ves ?? 0
          )
        );

      } else {

        setIsOpened(false);

        setCurrentRegister(null);

        setRegisterId(null);

        setOpenedBy('');

        setOpeningUSD('');

        setOpeningBs('');
      }

    } catch (error: any) {

      console.error(
        'Error al sincronizar la caja:',
        error
      );

      setIsOpened(false);

      setCurrentRegister(null);

      setRegisterId(null);

      setErrorMsg(
        error?.message ||
        'No se pudo consultar la caja.'
      );

    } finally {

      setLoadingStatus(false);
    }
  };

  // ======================================================
  // CARGAR ESTADO AL MONTAR
  // ======================================================

  useEffect(() => {

    checkCashStatus();

  }, []);

  // ======================================================
  // ABRIR CAJA
  // ======================================================

  const handleOpenRegister = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setErrorMsg('');

    // ----------------------------------------------------
    // Validar montos
    // ----------------------------------------------------

    const usd =
      Number(openingUSD) || 0;

    const ves =
      Number(openingBs) || 0;

    if (usd < 0 || ves < 0) {

      setErrorMsg(
        'Los montos de apertura no pueden ser negativos.'
      );

      return;
    }

    // ----------------------------------------------------
    // Obtener usuario
    // ----------------------------------------------------

    const storedUser =
      getStoredUser();

    if (!storedUser) {

      setErrorMsg(
        'No se encontró la sesión del usuario. Cierre sesión y vuelva a ingresar.'
      );

      return;
    }

    const userId =
      Number(storedUser.id);

    if (!userId) {

      setErrorMsg(
        'La sesión no contiene un ID de usuario válido.'
      );

      console.error(
        'USUARIO SIN ID:',
        storedUser
      );

      return;
    }

    try {

      setLoading(true);

      console.log(
        'ABRIENDO CAJA:',
        {
          userId,
          username:
            storedUser.name ||
            currentUsername,
          userRole:
            storedUser.role ||
            userRole,
          openingUSD: usd,
          openingBs: ves,
        }
      );

      const res = await fetch(
        '/api/cash',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action: 'open',

            userId,

            username:
              storedUser.name ||
              currentUsername,

            userRole:
              storedUser.role ||
              userRole,

            openingUSD: usd,

            openingBs: ves,
          }),
        }
      );

      const data =
        await res.json();

      console.log(
        'RESPUESTA APERTURA:',
        data
      );

      if (!res.ok || !data.success) {

        setErrorMsg(
          data?.error ||
          'No se pudo abrir la caja.'
        );

        return;
      }

      // --------------------------------------------------
      // Actualizar inmediatamente
      // --------------------------------------------------

      if (data.register) {

        const register:
          CashRegister =
          data.register;

        setCurrentRegister(
          register
        );

        setRegisterId(
          Number(register.id)
        );

        setOpenedBy(
          register.opened_by ||
          storedUser.name ||
          currentUsername
        );

        setOpeningUSD(
          String(
            register.opening_usd ?? usd
          )
        );

        setOpeningBs(
          String(
            register.opening_ves ?? ves
          )
        );

        setIsOpened(true);

      } else {

        await checkCashStatus();
      }

      alert(
        '¡Caja abierta exitosamente!'
      );

    } catch (error: any) {

      console.error(
        'ERROR ABRIENDO CAJA:',
        error
      );

      setErrorMsg(
        error?.message ||
        'No se pudo conectar con el servidor.'
      );

    } finally {

      setLoading(false);
    }
  };

  // ======================================================
  // ABRIR MODAL DE CIERRE
  // ======================================================

  const openClosingModal = () => {

    setCountedUSD('');
    setCountedBs('');

    setErrorMsg('');

    setClosingModal(true);
  };

  // ======================================================
  // CERRAR CAJA
  // ======================================================

  const handleCloseRegister = async () => {

    if (!registerId) {

      setErrorMsg(
        'No se pudo identificar el ID de la caja.'
      );

      return;
    }

    const usd =
      Number(countedUSD) || 0;

    const ves =
      Number(countedBs) || 0;

    if (usd < 0 || ves < 0) {

      setErrorMsg(
        'Los montos del cierre no pueden ser negativos.'
      );

      return;
    }

    try {

      setLoading(true);

      setErrorMsg('');

      console.log(
        'CERRANDO CAJA:',
        {
          registerId,
          countedUSD: usd,
          countedBs: ves,
        }
      );

      const res = await fetch(
        '/api/cash',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action: 'close',

            countedUSD: usd,

            countedBs: ves,

            registerId:
              Number(registerId),
          }),
        }
      );

      const data =
        await res.json();

      console.log(
        'RESPUESTA CIERRE:',
        data
      );

      if (!res.ok || !data.success) {

        setErrorMsg(
          data?.error ||
          'No se pudo cerrar la caja.'
        );

        return;
      }

      alert(
        'Turno cerrado correctamente.'
      );

      setClosingModal(false);

      setCountedUSD('');
      setCountedBs('');

      setCurrentRegister(null);

      setRegisterId(null);

      setOpenedBy('');

      setOpeningUSD('');
      setOpeningBs('');

      setIsOpened(false);

      await checkCashStatus();

    } catch (error: any) {

      console.error(
        'ERROR CERRANDO CAJA:',
        error
      );

      setErrorMsg(
        error?.message ||
        'No se pudo conectar con el servidor.'
      );

    } finally {

      setLoading(false);
    }
  };

  // ======================================================
  // CÁLCULOS INFORMATIVOS
  // ======================================================

  const openingUsdValue =
    Number(
      currentRegister?.opening_usd ??
      openingUSD ??
      0
    );

  const openingBsValue =
    Number(
      currentRegister?.opening_ves ??
      openingBs ??
      0
    );

  const openingBsEquivalent =
    exchangeRate > 0
      ? openingUsdValue *
        exchangeRate
      : 0;

  // ======================================================
  // ESTADO DE CARGA
  // ======================================================

  if (loadingStatus) {

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />

          <span className="text-xs text-slate-500">
            Verificando estado de caja...
          </span>

        </div>

      </div>
    );
  }

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (

    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">

      {/* ==================================================
          ENCABEZADO
      ================================================== */}

      <div className="flex justify-between items-center border-b border-slate-100 pb-3">

        <div>

          <h3 className="text-lg font-bold text-slate-800">
            🔐 Módulo de Caja
          </h3>

          <p className="text-[11px] text-slate-500 mt-1">
            Control de apertura y cierre de turno
          </p>

        </div>

        <span
          className={`
            text-xs
            font-bold
            px-3
            py-1.5
            rounded-full

            ${
              isOpened
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }
          `}
        >
          Caja {isOpened
            ? 'Abierta'
            : 'Cerrada'}
        </span>

      </div>


      {/* ==================================================
          MENSAJE DE ERROR
      ================================================== */}

      {errorMsg && (

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">

          <strong>
            ⚠️ Error:
          </strong>

          <div className="mt-1">
            {errorMsg}
          </div>

        </div>

      )}


      {/* ==================================================
          CAJA CERRADA
      ================================================== */}

      {!isOpened ? (

        <form
          onSubmit={handleOpenRegister}
          className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200"
        >

          <div>

            <div className="text-sm font-bold text-blue-600">
              Apertura de Turno
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Registre el efectivo disponible al comenzar el turno.
            </div>

          </div>


          {/* FONDOS INICIALES */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* USD */}

            <div>

              <label className="block text-[11px] font-medium text-slate-600 mb-1">

                Efectivo USD ($)

              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={openingUSD}
                onChange={(e) =>
                  setOpeningUSD(
                    e.target.value
                  )
                }
                placeholder="0.00"
                disabled={loading}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />

            </div>


            {/* BOLÍVARES */}

            <div>

              <label className="block text-[11px] font-medium text-slate-600 mb-1">

                Efectivo Bs (Bs.)

              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={openingBs}
                onChange={(e) =>
                  setOpeningBs(
                    e.target.value
                  )
                }
                placeholder="0.00"
                disabled={loading}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />

            </div>

          </div>


          {/* REFERENCIA */}

          {exchangeRate > 0 && (

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">

              <div className="text-[10px] text-blue-600 font-semibold">
                Tasa de cambio actual
              </div>

              <div className="text-sm font-bold text-blue-800 mt-1">
                1 USD = Bs. {exchangeRate.toLocaleString('es-VE')}
              </div>

              {openingUsdValue > 0 && (

                <div className="text-[10px] text-blue-600 mt-1">
                  Fondo USD equivalente:
                  {' '}
                  Bs.{' '}
                  {openingBsEquivalent.toLocaleString(
                    'es-VE',
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>

              )}

            </div>

          )}


          {/* BOTÓN */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition shadow-sm"
          >

            {loading
              ? 'Abriendo caja...'
              : '🔓 Iniciar Turno y Abrir Caja'}

          </button>

        </form>

      ) : (

        /* ==================================================
           CAJA ABIERTA
        ================================================== */

        <div className="space-y-4">

          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">

            <div className="flex justify-between items-start gap-3">

              <div>

                <div className="text-xs text-emerald-600">
                  Turno activo
                </div>

                <div className="text-base font-bold text-emerald-800 mt-1">
                  {openedBy}
                </div>

              </div>

              <div className="text-right">

                <div className="text-[10px] text-emerald-600">
                  ID Caja
                </div>

                <div className="text-sm font-bold text-emerald-800">
                  #{registerId}
                </div>

              </div>

            </div>


            {/* FONDO INICIAL */}

            <div className="grid grid-cols-2 gap-3 mt-4">

              <div className="bg-white/70 rounded-lg p-3">

                <div className="text-[10px] text-slate-500">
                  Fondo USD
                </div>

                <div className="text-lg font-bold text-slate-800">
                  $
                  {openingUsdValue.toLocaleString(
                    'en-US',
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>

              </div>


              <div className="bg-white/70 rounded-lg p-3">

                <div className="text-[10px] text-slate-500">
                  Fondo Bs.
                </div>

                <div className="text-lg font-bold text-slate-800">
                  Bs.
                  {' '}
                  {openingBsValue.toLocaleString(
                    'es-VE',
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>

              </div>

            </div>


            {/* FECHA */}

            {currentRegister?.opening_date && (

              <div className="text-[10px] text-emerald-700 mt-3">

                Apertura:
                {' '}
                {currentRegister.opening_date}

              </div>

            )}

          </div>


          {/* BOTÓN CIERRE */}

          <button
            type="button"
            onClick={openClosingModal}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm"
          >

            🔒 Realizar Conteo y Cerrar Turno

          </button>

        </div>

      )}


      {/* ==================================================
          MODAL DE CIERRE
      ================================================== */}

      {closingModal && (

        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">

            {/* HEADER */}

            <div className="flex justify-between items-start mb-5">

              <div>

                <h3 className="text-xl font-bold text-slate-800">
                  🔒 Cierre de Caja
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  {openedBy}
                  {' '}
                  • Caja #{registerId}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setClosingModal(false)
                }
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>

            </div>


            {/* INFORMACIÓN */}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">

              <div className="text-xs font-semibold text-slate-600 mb-3">
                Fondo inicial registrado
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <div className="text-[10px] text-slate-500">
                    USD
                  </div>

                  <div className="font-bold text-slate-800">
                    $
                    {openingUsdValue.toFixed(2)}
                  </div>

                </div>

                <div>

                  <div className="text-[10px] text-slate-500">
                    Bolívares
                  </div>

                  <div className="font-bold text-slate-800">
                    Bs.
                    {' '}
                    {openingBsValue.toFixed(2)}
                  </div>

                </div>

              </div>

            </div>


            {/* MENSAJE */}

            <p className="text-xs text-slate-500 mb-4">

              Ingrese el efectivo físico que realmente encontró en caja.

              {' '}

              El sistema utilizará estos valores para registrar el cierre.

            </p>


            {/* INPUTS */}

            <div className="space-y-3">

              <div>

                <label className="block text-xs font-medium text-slate-600 mb-1">

                  Total USD contado

                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={countedUSD}
                  onChange={(e) =>
                    setCountedUSD(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />

              </div>


              <div>

                <label className="block text-xs font-medium text-slate-600 mb-1">

                  Total Bs contado

                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={countedBs}
                  onChange={(e) =>
                    setCountedBs(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />

              </div>

            </div>


            {/* ERROR */}

            {errorMsg && (

              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">

                {errorMsg}

              </div>

            )}


            {/* BOTONES */}

            <div className="flex gap-3 pt-5">

              <button
                type="button"
                onClick={() =>
                  setClosingModal(false)
                }
                disabled={loading}
                className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCloseRegister}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition"
              >

                {loading
                  ? 'Cerrando...'
                  : '✓ Cerrar Turno'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
