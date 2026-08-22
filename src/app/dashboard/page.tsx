'use client';

import React, { useEffect, useState } from 'react';

// ============================================================
// TIPOS
// ============================================================

type PaymentMethodType =
  | 'Efectivo USD'
  | 'Efectivo Bs'
  | 'Pago Móvil'
  | 'Zelle'
  | 'Binance Pay'
  | 'Crédito / Fiado';

interface Product {
  id: number;
  name: string;
  costPrice?: number;
  price: number;
  category: string;
  taxable: boolean;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface SaleRecord {
  id: number;
  items: CartItem[];
  subtotalUSD: number;
  ivaUSD: number;
  totalUSD: number;
  totalBs: number;
  exchangeRate: number;
  paymentMethod: PaymentMethodType;
  changeUSD: number;
  clientName: string;
  clientDocument?: string;
  clientPhone?: string;
  date: string;
}

interface CreditAccount {
  id: number;
  clientName: string;
  clientPhone: string;
  clientDocument: string;
  totalDebtUSD: number;
  totalDebtBs: number;
  date: string;
  status: 'Pendiente' | 'Pagado';
  saleId: number;
}

interface PayableAccount {
  id: number;
  providerName: string;
  providerDocument: string;
  description: string;
  totalDebtUSD: number;
  totalDebtBs: number;
  dueDate: string;
  date: string;
  status: 'Pendiente' | 'Pagado';
}

const IVA_RATE = 0.16;

// ============================================================
// COMPONENTE DE TICKET
// ============================================================

interface ReceiptProps {
  sale: SaleRecord | any;
}

function ReceiptTicket({ sale }: ReceiptProps) {
  return (
    <div className="receipt-ticket w-[80mm] bg-white text-black p-4 text-sm">

      {/* ENCABEZADO */}
      <div className="text-center border-b border-black pb-2 mb-3">

        <h2 className="text-lg font-black">
          POS & Gestión Pro
        </h2>

        <p className="text-xs">
          Comprobante de Venta
        </p>

        <p className="text-xs font-bold">
          #{sale?.id || 'N/A'}
        </p>

        <p className="text-xs">
          {sale?.date || new Date().toLocaleString()}
        </p>

      </div>

      {/* DATOS DEL CLIENTE */}
      <div className="mb-3 text-xs">

        <p>
          <strong>Cliente:</strong>{' '}
          {sale?.clientName || 'Cliente Genérico'}
        </p>

        {sale?.clientDocument &&
          sale.clientDocument !== 'N/A' && (
            <p>
              <strong>Cédula/RIF:</strong>{' '}
              {sale.clientDocument}
            </p>
          )}

        {sale?.clientPhone &&
          sale.clientPhone !== 'N/A' && (
            <p>
              <strong>Teléfono:</strong>{' '}
              {sale.clientPhone}
            </p>
          )}

      </div>

      {/* PRODUCTOS */}
      <div className="border-t border-b border-black py-2 mb-3">

        {Array.isArray(sale?.items) &&
        sale.items.length > 0 ? (

          sale.items.map((item: any, index: number) => (

            <div
              key={item.id || index}
              className="flex justify-between gap-2 text-xs mb-2"
            >

              <div className="flex-1">

                <div className="font-bold">
                  {item.name}
                </div>

                <div>
                  {item.quantity} x $
                  {Number(item.price || 0).toFixed(2)}
                </div>

              </div>

              <div className="font-bold">
                $
                {(
                  Number(item.price || 0) *
                  Number(item.quantity || 0)
                ).toFixed(2)}
              </div>

            </div>

          ))

        ) : (

          <p className="text-center text-xs">
            Sin productos
          </p>

        )}

      </div>

      {/* TOTALES */}
      <div className="space-y-1 text-xs">

        <div className="flex justify-between">
          <span>Subtotal:</span>

          <span>
            ${Number(
              sale?.subtotalUSD || 0
            ).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">

          <span>IVA:</span>

          <span>
            ${Number(
              sale?.ivaUSD || 0
            ).toFixed(2)}
          </span>

        </div>

        <div className="flex justify-between font-black text-sm border-t border-black pt-1">

          <span>TOTAL USD:</span>

          <span>
            ${Number(
              sale?.totalUSD || 0
            ).toFixed(2)}
          </span>

        </div>

        <div className="flex justify-between font-bold">

          <span>TOTAL Bs:</span>

          <span>
            Bs. {Number(
              sale?.totalBs || 0
            ).toFixed(2)}
          </span>

        </div>

        <div className="flex justify-between mt-2">

          <span>Método:</span>

          <span>
            {sale?.paymentMethod || 'Efectivo USD'}
          </span>

        </div>

        {Number(sale?.changeUSD || 0) > 0 && (

          <div className="flex justify-between font-bold">

            <span>Cambio:</span>

            <span>
              ${Number(
                sale.changeUSD
              ).toFixed(2)}
            </span>

          </div>

        )}

      </div>

      {/* PIE DEL TICKET */}
      <div className="text-center border-t border-black mt-4 pt-3 text-xs">

        <p className="font-bold">
          ¡Gracias por su compra!
        </p>

        <p>
          Conserve este comprobante.
        </p>

      </div>

    </div>
  );
}

// ============================================================
// MÓDULO DE CLIENTES FRECUENTES
// ============================================================

function CustomersDirectoryModule() {

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [name, setName] =
    useState('');

  const [rifCi, setRifCi] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [address, setAddress] =
    useState('');

  // ----------------------------------------------------------
  // CARGAR CLIENTES
  // ----------------------------------------------------------

  useEffect(() => {

    async function loadCustomers() {

      try {

        const res =
          await fetch('/api/customers');

        if (!res.ok) {
          throw new Error(
            'Error al cargar clientes'
          );
        }

        const data =
          await res.json();

        if (Array.isArray(data)) {
          setCustomers(data);
        }

      } catch (err) {

        console.error(
          'Error cargando clientes:',
          err
        );

      }

    }

    loadCustomers();

  }, []);

  // ----------------------------------------------------------
  // GUARDAR CLIENTE
  // ----------------------------------------------------------

  const handleSaveCustomer = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!name.trim()) {

      alert(
        'Debe ingresar el nombre del cliente.'
      );

      return;
    }

    try {

      const res =
        await fetch('/api/customers', {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            name: name.trim(),

            rif_ci:
              rifCi.trim(),

            phone:
              phone.trim(),

            address:
              address.trim()

          })

        });

      const data =
        await res.json();

      if (data.success || data.id) {

        alert(
          '¡Cliente frecuente guardado con éxito!'
        );

        setName('');
        setRifCi('');
        setPhone('');
        setAddress('');

        const updatedRes =
          await fetch('/api/customers');

        const updated =
          await updatedRes.json();

        if (Array.isArray(updated)) {
          setCustomers(updated);
        }

      } else {

        alert(
          'Error: ' +
          (
            data.error ||
            'No se pudo guardar el cliente'
          )
        );

      }

    } catch (err) {

      console.error(
        'Error guardando cliente:',
        err
      );

      alert(
        'Error de conexión al guardar el cliente.'
      );

    }

  };

  // ----------------------------------------------------------
  // INTERFAZ
  // ----------------------------------------------------------

  return (

    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">

      <div className="flex justify-between items-center border-b border-slate-100 pb-3">

        <div>

          <h3 className="text-xl font-bold text-slate-800">
            👥 Gestión de Clientes Frecuentes
          </h3>

          <p className="text-xs text-slate-500">
            Guarda los datos de compradores recurrentes
            para seleccionarlos rápidamente al facturar
            o otorgar créditos.
          </p>

        </div>

        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-200">

          Total: {customers.length} clientes

        </span>

      </div>

      <form
        onSubmit={handleSaveCustomer}
        className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
      >

        <input
          type="text"
          placeholder="Nombre y Apellido *"
          required
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <input
          type="text"
          placeholder="Cédula / RIF"
          value={rifCi}
          onChange={(e) =>
            setRifCi(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <input
          type="text"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <input
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm"
        >
          Registrar Cliente 💾
        </button>

      </form>

      <div className="overflow-x-auto">

        <table className="w-full text-left border-collapse text-xs">

          <thead>

            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">

              <th className="p-3">
                Cliente
              </th>

              <th className="p-3">
                Cédula / RIF
              </th>

              <th className="p-3">
                Teléfono
              </th>

              <th className="p-3">
                Dirección
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-100">

            {customers.length === 0 && (

              <tr>

                <td
                  colSpan={4}
                  className="text-center py-6 text-slate-400"
                >
                  No hay clientes registrados
                  en la base de datos.
                </td>

              </tr>

            )}

            {customers.map(
              (c, idx) => (

                <tr
                  key={
                    c.id || idx
                  }
                  className="hover:bg-slate-50"
                >

                  <td className="p-3 font-bold text-slate-800">
                    {c.name}
                  </td>

                  <td className="p-3 text-slate-600">
                    {c.rif_ci || 'N/A'}
                  </td>

                  <td className="p-3 text-slate-600">
                    {c.phone || 'N/A'}
                  </td>

                  <td className="p-3 text-slate-600">
                    {c.address || 'N/A'}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}

// ============================================================
// DASHBOARD POS
// ============================================================

export default function DashboardPOS() {

  const [isMounted, setIsMounted] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<
      | 'pos'
      | 'inventory'
      | 'reports'
      | 'accounts'
      | 'customers'
      | 'roles'
    >('pos');

  const [products, setProducts] =
    useState<Product[]>([]);

  const [salesHistory, setSalesHistory] =
    useState<SaleRecord[]>([]);

  const [credits, setCredits] =
    useState<CreditAccount[]>([]);

  const [payables, setPayables] =
    useState<PayableAccount[]>([]);

  const [exchangeRate, setExchangeRate] =
    useState<number>(778.33);

  const [currentUsername, setCurrentUsername] =
    useState<string>('admin');

  const [rolesList, setRolesList] =
    useState(getRoles());

  const [usersList, setUsersList] =
    useState(getUsers());

  const [isRestockModalOpen, setIsRestockModalOpen] =
    useState(false);

  const [selectedProductForRestock, setSelectedProductForRestock] =
    useState<Product | null>(null);

  const [restockAmount, setRestockAmount] =
    useState('');

  const [inventoryFilterMode, setInventoryFilterMode] =
    useState<'all' | 'low'>('all');

  const [reportFilterPeriod, setReportFilterPeriod] =
    useState<
      'all' |
      'today' |
      'week' |
      'month'
    >('all');

  const [newProviderName, setNewProviderName] =
    useState('');

  const [newProviderDoc, setNewProviderDoc] =
    useState('');

  const [newPayableDesc, setNewPayableDesc] =
    useState('');

  const [newPayableAmountUSD, setNewPayableAmountUSD] =
    useState('');

  const [newDueDate, setNewDueDate] =
    useState('');

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] =
    useState(false);

  const [cashGivenUSD, setCashGivenUSD] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>(
      'Efectivo USD'
    );

  const [clientName, setClientName] =
    useState('');

  const [clientPhone, setClientPhone] =
    useState('');

  const [clientDocument, setClientDocument] =
    useState('');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('Todos');

  const [newName, setNewName] =
    useState('');

  const [newCostPrice, setNewCostPrice] =
    useState('');

  const [newPrice, setNewPrice] =
    useState('');

  const [newCategory, setNewCategory] =
    useState('Comida');

  const [newTaxable, setNewTaxable] =
    useState(true);

  const [newStock, setNewStock] =
    useState('');

  const [lastPrintedSale, setLastPrintedSale] =
    useState<SaleRecord | null>(null);

  const [successModalData, setSuccessModalData] =
    useState<{
      isOpen: boolean;
      changeUSD: number;
      changeBs: number;
      isCredit: boolean;
      clientName?: string;
    } | null>(null);

  // ==========================================================
  // MONTAJE INICIAL
  // ==========================================================

  useEffect(() => {

    setIsMounted(true);

    if (
      typeof window !== 'undefined'
    ) {

      const savedCredits =
        localStorage.getItem(
          'pos_credits'
        );

      if (savedCredits) {

        try {

          setCredits(
            JSON.parse(
              savedCredits
            )
          );

        } catch (e) {

          console.error(e);

        }

      }

      const savedPayables =
        localStorage.getItem(
          'pos_payables'
        );

      if (savedPayables) {

        try {

          setPayables(
            JSON.parse(
              savedPayables
            )
          );

        } catch (e) {

          console.error(e);

        }

      }

      const savedBcv =
        localStorage.getItem(
          'pos_bcv'
        );

      if (savedBcv) {

        const parsedBcv =
          parseFloat(savedBcv);

        if (!isNaN(parsedBcv)) {

          setExchangeRate(
            parsedBcv
          );

        }

      }

    }

  }, []);

  // ==========================================================
  // CARGAR DATOS DE LA NUBE
  // ==========================================================

  useEffect(() => {

    async function loadCloudData() {

      try {

        const prodRes =
          await fetch(
            '/api/products'
          );

        const prodData =
          await prodRes.json();

        if (
          Array.isArray(prodData)
        ) {

          setProducts(
            prodData
          );

        }

        const salesRes =
          await fetch(
            '/api/sales'
          );

        const salesData =
          await salesRes.json();

        if (
          Array.isArray(salesData)
        ) {

          const formattedSales =
            salesData.map(
              (sale: any) => ({

                id: sale.id,

                items:
                  sale.items || [],

                subtotalUSD:
                  Number(
                    sale.subtotal_usd ??
                    sale.subtotalUSD ??
                    0
                  ),

                ivaUSD:
                  Number(
                    sale.iva_usd ??
                    sale.ivaUSD ??
                    0
                  ),

                totalUSD:
                  Number(
                    sale.total_usd ??
                    sale.totalUSD ??
                    0
                  ),

                totalBs:
                  Number(
                    sale.total_bs ??
                    sale.totalBs ??
                    (
                      Number(
                        sale.total_usd ??
                        sale.totalUSD ??
                        0
                      ) *
                      exchangeRate
                    )
                  ),

                exchangeRate:
                  Number(
                    sale.exchange_rate ??
                    sale.exchangeRate ??
                    exchangeRate
                  ),

                paymentMethod:
                  sale.payment_method ??
                  sale.paymentMethod ??
                  'Efectivo USD',

                changeUSD:
                  Number(
                    sale.change_usd ??
                    sale.changeUSD ??
                    0
                  ),

                clientName:
                  sale.client_name ??
                  sale.clientName ??
                  'Cliente Genérico',

                date:
                  sale.created_at ??
                  sale.date ??
                  new Date().toLocaleString()

              })
            );

          setSalesHistory(
            formattedSales as SaleRecord[]
          );

        }

      } catch (error) {

        console.error(
          'Error al sincronizar datos:',
          error
        );

      }

    }

    loadCloudData();

  }, [exchangeRate]);

  // ==========================================================
  // ACTUALIZAR ROLES Y USUARIOS
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        setRolesList(
          getRoles()
        );

        setUsersList(
          getUsers()
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, []);

  // ==========================================================
  // USUARIO ACTUAL
  // ==========================================================

  const currentUserObj =
    usersList.find(
      (u: any) =>
        String(
          u.username || ''
        ).toLowerCase() ===
        String(
          currentUsername || ''
        ).toLowerCase()
    ) ||
    usersList[0];

  const currentRoleObj =
    rolesList.find(
      (r: any) =>
        String(
          r.id || ''
        ).toLowerCase() ===
          String(
            currentUserObj?.roleId || ''
          ).toLowerCase() ||

        String(
          r.name || ''
        ).toLowerCase() ===
          String(
            currentUserObj?.roleId || ''
          ).toLowerCase()
    ) ||
    rolesList[0];

  const userPermissions =
    currentRoleObj
      ? currentRoleObj.permissions
      : [];

  // ==========================================================
  // CONTROL DE PERMISOS
  // ==========================================================

  useEffect(() => {

    const tabPermissionMap:
      Record<string, string[]> = {

      pos: [
        'view_pos'
      ],

      inventory: [
        'view_inventory'
      ],

      accounts: [
        'view_credits',
        'view_payables',
        'manage_roles'
      ],

      reports: [
        'view_reports'
      ],

      customers: [
        'view_pos'
      ],

      roles: [
        'manage_roles'
      ]

    };

    const requiredPermissions =
      tabPermissionMap[
        activeTab
      ] || [];

    const hasAccess =
      requiredPermissions.length === 0 ||
      requiredPermissions.some(
        permission =>
          (
            userPermissions as string[]
          ).includes(permission)
      );

    if (!hasAccess) {

      const availableTab =
        Object.keys(
          tabPermissionMap
        ).find(tab => {

          const perms =
            tabPermissionMap[
              tab
            ];

          return perms.some(
            permission =>
              (
                userPermissions as string[]
              ).includes(permission)
          );

        }) as
          | 'pos'
          | 'inventory'
          | 'reports'
          | 'accounts'
          | 'customers'
          | 'roles'
          | undefined;

      if (
        availableTab &&
        availableTab !== activeTab
      ) {

        setActiveTab(
          availableTab
        );

      }

    }

  }, [
    currentUsername,
    currentRoleObj,
    userPermissions,
    activeTab
  ]);

  // ==========================================================
  // GUARDAR CRÉDITOS
  // ==========================================================

  useEffect(() => {

    if (
      typeof window !== 'undefined'
    ) {

      localStorage.setItem(
        'pos_credits',
        JSON.stringify(
          credits
        )
      );

    }

  }, [credits]);

  // ==========================================================
  // GUARDAR CUENTAS POR PAGAR
  // ==========================================================

  useEffect(() => {

    if (
      typeof window !== 'undefined'
    ) {

      localStorage.setItem(
        'pos_payables',
        JSON.stringify(
          payables
        )
      );

    }

  }, [payables]);

  // ==========================================================
  // GUARDAR TASA
  // ==========================================================

  useEffect(() => {

    if (
      typeof window !== 'undefined'
    ) {

      localStorage.setItem(
        'pos_bcv',
        exchangeRate.toString()
      );

    }

  }, [exchangeRate]);

  if (!isMounted) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">

        Cargando POS...

      </div>
    );

  }

  // ==========================================================
  // CONTINUARÁ EN PARTE 2
  // ==========================================================
// ============================================================
// COMPONENTE: TICKET DE RECIBO
// ============================================================

interface ReceiptProps {
  sale: SaleRecord;
}

function ReceiptTicket({ sale }: ReceiptProps) {
  if (!sale) return null;

  return (
    <div
      id="receipt-ticket"
      className="w-[80mm] bg-white text-black p-3 font-mono text-[11px] leading-tight"
    >
      {/* ENCABEZADO */}
      <div className="text-center border-b border-black pb-2 mb-2">
        <div className="font-black text-lg">
          POS & GESTIÓN PRO
        </div>

        <div className="text-[10px]">
          COMPROBANTE DE VENTA
        </div>

        <div className="mt-1">
          Venta #{sale.id}
        </div>

        <div>
          {sale.date}
        </div>
      </div>

      {/* CLIENTE */}
      <div className="border-b border-black pb-2 mb-2">
        <div>
          <strong>Cliente:</strong>{' '}
          {sale.clientName || 'Cliente Genérico'}
        </div>

        {sale.clientDocument && sale.clientDocument !== 'N/A' && (
          <div>
            <strong>C.I/RIF:</strong>{' '}
            {sale.clientDocument}
          </div>
        )}

        {sale.clientPhone && sale.clientPhone !== 'N/A' && (
          <div>
            <strong>Teléfono:</strong>{' '}
            {sale.clientPhone}
          </div>
        )}
      </div>

      {/* PRODUCTOS */}
      <div className="border-b border-black pb-2 mb-2">
        <div className="font-black mb-1">
          PRODUCTOS
        </div>

        {Array.isArray(sale.items) &&
          sale.items.map((item: any, index: number) => (
            <div
              key={`${item.id}-${index}`}
              className="mb-2"
            >
              <div className="font-bold">
                {item.name}
              </div>

              <div className="flex justify-between">
                <span>
                  {item.quantity} x $
                  {Number(item.price || 0).toFixed(2)}
                </span>

                <span>
                  $
                  {(
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* TOTALES */}
      <div className="space-y-1 border-b border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>
            ${Number(sale.subtotalUSD || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>IVA:</span>
          <span>
            ${Number(sale.ivaUSD || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between font-black text-sm">
          <span>TOTAL USD:</span>
          <span>
            ${Number(sale.totalUSD || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between font-bold">
          <span>TOTAL Bs:</span>
          <span>
            Bs. {Number(sale.totalBs || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* PAGO */}
      <div className="border-b border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>Método:</span>
          <span className="font-bold">
            {sale.paymentMethod}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Tasa:</span>
          <span>
            {Number(sale.exchangeRate || 0).toFixed(2)}
          </span>
        </div>

        {Number(sale.changeUSD || 0) > 0 && (
          <>
            <div className="flex justify-between mt-1">
              <span>Cambio USD:</span>
              <span className="font-bold">
                ${Number(sale.changeUSD).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Cambio Bs:</span>
              <span className="font-bold">
                Bs.{' '}
                {(
                  Number(sale.changeUSD || 0) *
                  Number(sale.exchangeRate || 0)
                ).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* PIE */}
      <div className="text-center pt-2">
        <div className="font-black">
          ¡GRACIAS POR SU COMPRA!
        </div>

        <div className="text-[9px] mt-1">
          Conserve este comprobante
        </div>

        <div className="text-[9px] mt-2">
          POS & Gestión Pro
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMPONENTE: DIRECTORIO DE CLIENTES
// ============================================================

function CustomersDirectoryModule() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [rifCi, setRifCi] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch('/api/customers');

        if (!res.ok) {
          throw new Error(
            `Error HTTP: ${res.status}`
          );
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setCustomers(data);
        }
      } catch (error) {
        console.error(
          'Error cargando clientes:',
          error
        );
      }
    };

    loadCustomers();
  }, []);

  const handleSaveCustomer = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!name.trim()) {
      alert(
        'Debe indicar el nombre del cliente.'
      );
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          rif_ci: rifCi.trim(),
          phone: phone.trim(),
          address: address.trim()
        })
      });

      const data = await res.json();

      if (data.success || data.id) {
        alert(
          '¡Cliente frecuente guardado con éxito!'
        );

        setName('');
        setRifCi('');
        setPhone('');
        setAddress('');

        const updatedRes =
          await fetch('/api/customers');

        const updated =
          await updatedRes.json();

        if (Array.isArray(updated)) {
          setCustomers(updated);
        }
      } else {
        alert(
          'Error: ' +
          (data.error ||
            'No se pudo guardar el cliente.')
        );
      }
    } catch (error) {
      console.error(
        'Error guardando cliente:',
        error
      );

      alert(
        'Error de conexión al guardar el cliente.'
      );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">

      {/* ENCABEZADO */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">

        <div>
          <h3 className="text-xl font-bold text-slate-800">
            👥 Gestión de Clientes Frecuentes
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Guarda los datos de compradores
            recurrentes para seleccionarlos
            rápidamente al facturar o vender
            a crédito.
          </p>
        </div>

        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-200">
          Total: {customers.length} clientes
        </span>
      </div>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSaveCustomer}
        className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
      >

        <input
          type="text"
          placeholder="Nombre y Apellido *"
          required
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <input
          type="text"
          placeholder="Cédula / RIF"
          value={rifCi}
          onChange={(e) =>
            setRifCi(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <input
          type="text"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <input
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm"
        >
          Registrar Cliente 💾
        </button>

      </form>

      {/* TABLA */}
      <div className="overflow-x-auto">

        <table className="w-full text-left border-collapse text-xs">

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">

              <th className="p-3">
                Cliente
              </th>

              <th className="p-3">
                Cédula / RIF
              </th>

              <th className="p-3">
                Teléfono
              </th>

              <th className="p-3">
                Dirección
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">

            {customers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-slate-400"
                >
                  No hay clientes registrados
                  en la base de datos.
                </td>
              </tr>
            )}

            {customers.map(
              (customer, index) => (
                <tr
                  key={
                    customer.id ||
                    index
                  }
                  className="hover:bg-slate-50"
                >

                  <td className="p-3 font-bold text-slate-800">
                    {customer.name}
                  </td>

                  <td className="p-3 text-slate-600">
                    {customer.rif_ci ||
                      customer.rifCi ||
                      'N/A'}
                  </td>

                  <td className="p-3 text-slate-600">
                    {customer.phone ||
                      'N/A'}
                  </td>

                  <td className="p-3 text-slate-600">
                    {customer.address ||
                      'N/A'}
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}


// ============================================================
// DASHBOARD POS
// ============================================================

export default function DashboardPOS() {

  const [isMounted, setIsMounted] =
    useState(false);

  const [
    activeTab,
    setActiveTab
  ] = useState<
    | 'pos'
    | 'inventory'
    | 'reports'
    | 'accounts'
    | 'customers'
    | 'roles'
  >('pos');

  const [
    products,
    setProducts
  ] = useState<Product[]>([]);

  const [
    salesHistory,
    setSalesHistory
  ] = useState<SaleRecord[]>([]);

  const [
    credits,
    setCredits
  ] = useState<CreditAccount[]>([]);

  const [
    payables,
    setPayables
  ] = useState<PayableAccount[]>([]);

  const [
    exchangeRate,
    setExchangeRate
  ] = useState<number>(778.33);

  const [
    currentUsername,
    setCurrentUsername
  ] = useState<string>('admin');

  const [
    rolesList,
    setRolesList
  ] = useState(getRoles());

  const [
    usersList,
    setUsersList
  ] = useState(getUsers());

  const [
    isRestockModalOpen,
    setIsRestockModalOpen
  ] = useState(false);

  const [
    selectedProductForRestock,
    setSelectedProductForRestock
  ] = useState<Product | null>(null);

  const [
    restockAmount,
    setRestockAmount
  ] = useState('');

  const [
    inventoryFilterMode,
    setInventoryFilterMode
  ] = useState<
    'all' | 'low'
  >('all');

  const [
    reportFilterPeriod,
    setReportFilterPeriod
  ] = useState<
    'all' |
    'today' |
    'week' |
    'month'
  >('all');

  const [
    newProviderName,
    setNewProviderName
  ] = useState('');

  const [
    newProviderDoc,
    setNewProviderDoc
  ] = useState('');

  const [
    newPayableDesc,
    setNewPayableDesc
  ] = useState('');

  const [
    newPayableAmountUSD,
    setNewPayableAmountUSD
  ] = useState('');

  const [
    newDueDate,
    setNewDueDate
  ] = useState('');

  const [
    cart,
    setCart
  ] = useState<CartItem[]>([]);

  const [
    isCheckoutModalOpen,
    setIsCheckoutModalOpen
  ] = useState(false);

  const [
    cashGivenUSD,
    setCashGivenUSD
  ] = useState('');

  const [
    paymentMethod,
    setPaymentMethod
  ] = useState<PaymentMethodType>(
    'Efectivo USD'
  );

  const [
    clientName,
    setClientName
  ] = useState('');

  const [
    clientPhone,
    setClientPhone
  ] = useState('');

  const [
    clientDocument,
    setClientDocument
  ] = useState('');

  const [
    searchTerm,
    setSearchTerm
  ] = useState('');

  const [
    selectedCategory,
    setSelectedCategory
  ] = useState('Todos');

  const [
    newName,
    setNewName
  ] = useState('');

  const [
    newCostPrice,
    setNewCostPrice
  ] = useState('');

  const [
    newPrice,
    setNewPrice
  ] = useState('');

  const [
    newCategory,
    setNewCategory
  ] = useState('Comida');

  const [
    newTaxable,
    setNewTaxable
  ] = useState(true);

  const [
    newStock,
    setNewStock
  ] = useState('');

  const [
    lastPrintedSale,
    setLastPrintedSale
  ] = useState<SaleRecord | null>(
    null
  );

  const [
    successModalData,
    setSuccessModalData
  ] = useState<{
    isOpen: boolean;
    changeUSD: number;
    changeBs: number;
    isCredit: boolean;
    clientName?: string;
  } | null>(null);


  // ==========================================================
  // MONTAJE INICIAL
  // ==========================================================

  useEffect(() => {

    setIsMounted(true);

    if (
      typeof window !== 'undefined'
    ) {

      const savedCredits =
        localStorage.getItem(
          'pos_credits'
        );

      if (savedCredits) {
        try {
          setCredits(
            JSON.parse(
              savedCredits
            )
          );
        } catch (error) {
          console.error(error);
        }
      }

      const savedPayables =
        localStorage.getItem(
          'pos_payables'
        );

      if (savedPayables) {
        try {
          setPayables(
            JSON.parse(
              savedPayables
            )
          );
        } catch (error) {
          console.error(error);
        }
      }

      const savedBcv =
        localStorage.getItem(
          'pos_bcv'
        );

      if (savedBcv) {

        const parsedBcv =
          parseFloat(
            savedBcv
          );

        if (
          !isNaN(parsedBcv)
        ) {
          setExchangeRate(
            parsedBcv
          );
        }
      }
    }

  }, []);


  // ==========================================================
  // CARGAR DATOS CLOUD
  // ==========================================================

  useEffect(() => {

    async function loadCloudData() {

      try {

        const prodRes =
          await fetch(
            '/api/products'
          );

        const prodData =
          await prodRes.json();

        if (
          Array.isArray(
            prodData
          )
        ) {
          setProducts(
            prodData
          );
        }


        const salesRes =
          await fetch(
            '/api/sales'
          );

        const salesData =
          await salesRes.json();

        if (
          Array.isArray(
            salesData
          )
        ) {

          const formattedSales =
            salesData.map(
              (sale: any) => {

                const totalUSD =
                  Number(
                    sale.total_usd ??
                    sale.totalUSD ??
                    0
                  );

                return {
                  id: sale.id,

                  items:
                    sale.items ||
                    [],

                  subtotalUSD:
                    Number(
                      sale.subtotal_usd ??
                      sale.subtotalUSD ??
                      0
                    ),

                  ivaUSD:
                    Number(
                      sale.iva_usd ??
                      sale.ivaUSD ??
                      0
                    ),

                  totalUSD,

                  totalBs:
                    Number(
                      sale.total_bs ??
                      sale.totalBs ??
                      totalUSD *
                        exchangeRate
                    ),

                  exchangeRate:
                    Number(
                      sale.exchange_rate ??
                      sale.exchangeRate ??
                      exchangeRate
                    ),

                  paymentMethod:
                    sale.payment_method ??
                    sale.paymentMethod ??
                    'Efectivo USD',

                  changeUSD:
                    Number(
                      sale.change_usd ??
                      sale.changeUSD ??
                      0
                    ),

                  clientName:
                    sale.client_name ??
                    sale.clientName ??
                    'Cliente Genérico',

                  clientDocument:
                    sale.client_document ??
                    sale.clientDocument ??
                    'N/A',

                  clientPhone:
                    sale.client_phone ??
                    sale.clientPhone ??
                    'N/A',

                  date:
                    sale.created_at ??
                    sale.date ??
                    new Date().toLocaleString()
                };
              }
            );

          setSalesHistory(
            formattedSales as SaleRecord[]
          );
        }

      } catch (error) {

        console.error(
          'Error al sincronizar datos:',
          error
        );

      }
    }

    loadCloudData();

  }, [exchangeRate]);


  // ==========================================================
  // ACTUALIZAR ROLES
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        setRolesList(
          getRoles()
        );

        setUsersList(
          getUsers()
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, []);


  // ==========================================================
  // USUARIO Y PERMISOS
  // ==========================================================

  const currentUserObj =
    usersList.find(
      (u: any) =>
        String(
          u.username || ''
        ).toLowerCase() ===
        String(
          currentUsername || ''
        ).toLowerCase()
    ) ||
    usersList[0];


  const currentRoleObj =
    rolesList.find(
      (r: any) =>
        String(
          r.id || ''
        ).toLowerCase() ===
          String(
            currentUserObj?.roleId ||
            ''
          ).toLowerCase() ||
        String(
          r.name || ''
        ).toLowerCase() ===
          String(
            currentUserObj?.roleId ||
            ''
          ).toLowerCase()
    ) ||
    rolesList[0];


  const userPermissions =
    currentRoleObj
      ? currentRoleObj.permissions
      : [];


  // ==========================================================
  // CONTROL DE PESTAÑAS
  // ==========================================================

  useEffect(() => {

    const tabPermissionMap:
      Record<
        string,
        string[]
      > = {

      pos: [
        'view_pos'
      ],

      inventory: [
        'view_inventory'
      ],

      accounts: [
        'view_credits',
        'view_payables',
        'manage_roles'
      ],

      reports: [
        'view_reports'
      ],

      customers: [
        'view_pos'
      ],

      roles: [
        'manage_roles'
      ]
    };


    const requiredPermissions =
      tabPermissionMap[
        activeTab
      ] || [];


    const hasAccess =
      requiredPermissions.length === 0 ||
      requiredPermissions.some(
        permission =>
          (
            userPermissions as string[]
          ).includes(
            permission
          )
      );


    if (!hasAccess) {

      const availableTab =
        Object.keys(
          tabPermissionMap
        ).find(
          tab => {

            const permissions =
              tabPermissionMap[
                tab
              ];

            return permissions.some(
              permission =>
                (
                  userPermissions as string[]
                ).includes(
                  permission
                )
            );
          }
        ) as
          | 'pos'
          | 'inventory'
          | 'reports'
          | 'accounts'
          | 'customers'
          | 'roles'
          | undefined;


      if (
        availableTab &&
        availableTab !==
          activeTab
      ) {

        setActiveTab(
          availableTab
        );

      }

    }

  }, [
    currentUsername,
    currentRoleObj,
    userPermissions,
    activeTab
  ]);


  // ==========================================================
  // PERSISTENCIA LOCAL
  // ==========================================================

  useEffect(() => {

    if (
      typeof window !== 'undefined'
    ) {

      localStorage.setItem(
        'pos_credits',
        JSON.stringify(
          credits
        )
      );

    }

  }, [credits]);


  useEffect(() => {

    if (
      typeof window !== 'undefined'
    ) {

      localStorage.setItem(
        'pos_payables',
        JSON.stringify(
          payables
        )
      );

    }

  }, [payables]);


  useEffect(() => {

    if (
      typeof window !== 'undefined'
    ) {

      localStorage.setItem(
        'pos_bcv',
        exchangeRate.toString()
      );

    }

  }, [exchangeRate]);


  if (!isMounted) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        Cargando POS...
      </div>
    );

  }


  // ==========================================================
  // CARRITO
  // ==========================================================

  const addToCart = (
    product: Product
  ) => {

    if (
      product.stock <= 0
    ) {

      alert(
        '¡Producto agotado!'
      );

      return;
    }


    setCart(
      previous => {

        const existing =
          previous.find(
            item =>
              item.id ===
              product.id
          );


        if (existing) {

          if (
            existing.quantity >=
            product.stock
          ) {

            alert(
              'No hay más stock disponible para este producto.'
            );

            return previous;
          }


          return previous.map(
            item =>
              item.id ===
              product.id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1
                  }
                : item
          );

        }


        return [
          ...previous,
          {
            ...product,
            quantity: 1
          }
        ];

      }
    );

  };


  const updateQuantity = (
    id: number,
    delta: number
  ) => {

    setCart(
      previous =>
        previous
          .map(item => {

            if (
              item.id === id
            ) {

              const newQty =
                item.quantity +
                delta;


              if (
                newQty >
                item.stock
              ) {

                alert(
                  'Stock máximo alcanzado.'
                );

                return item;
              }


              return newQty > 0
                ? {
                    ...item,
                    quantity:
                      newQty
                  }
                : null;
            }

            return item;

          })
          .filter(Boolean) as CartItem[]
    );

  };


  const removeFromCart = (
    id: number
  ) => {

    setCart(
      previous =>
        previous.filter(
          item =>
            item.id !== id
        )
    );

  };


  // ==========================================================
  // TOTALES
  // ==========================================================

  const subtotalUSD =
    cart.reduce(
      (acc, item) =>
        acc +
        (
          item.price *
          item.quantity
        ),
      0
    );


  const ivaUSD =
    cart.reduce(
      (acc, item) =>
        acc +
        (
          item.taxable
            ? item.price *
              item.quantity *
              IVA_RATE
            : 0
        ),
      0
    );


  const totalUSD =
    subtotalUSD +
    ivaUSD;


  const totalBs =
    totalUSD *
    exchangeRate;


  // ==========================================================
  // PROCESAR VENTA
  // ==========================================================

  const handleCheckout =
    async () => {

      if (
        cart.length === 0
      ) {
        return;
      }


      if (
        paymentMethod ===
          'Crédito / Fiado' &&
        !clientName.trim()
      ) {

        alert(
          'Para ventas a crédito debe indicar el Nombre del Cliente.'
        );

        return;
      }


      const cashNum =
        Number(
          cashGivenUSD || 0
        );


      if (
        paymentMethod ===
          'Efectivo USD' &&
        cashNum < totalUSD
      ) {

        alert(
          'El monto en efectivo recibido es menor al total de la venta.'
        );

        return;
      }


      const changeUSD =
        paymentMethod ===
          'Efectivo USD'
          ? Math.max(
              0,
              cashNum -
                totalUSD
            )
          : 0;


      const changeBs =
        changeUSD *
        exchangeRate;


      const salePayload = {

        items: cart,

        subtotalUSD,

        ivaUSD,

        totalUSD,

        totalBs,

        exchangeRate,

        paymentMethod,

        changeUSD,

        clientName:
          clientName ||
          'Cliente Genérico',

        clientDocument:
          clientDocument ||
          'N/A',

        clientPhone:
          clientPhone ||
          'N/A',

        date:
          new Date().toISOString()

      };


      try {

        const res =
          await fetch(
            '/api/sales',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json'
              },
              body:
                JSON.stringify(
                  salePayload
                )
            }
          );


        const data =
          await res.json();


        if (
          data.success ||
          data.id
        ) {

          const newSaleRecord:
            SaleRecord = {

            id:
              data.id ||
              Date.now(),

            date:
              new Date()
                .toLocaleString(),

            items:
              [...cart],

            subtotalUSD,

            ivaUSD,

            totalUSD,

            totalBs,

            exchangeRate,

            paymentMethod,

            changeUSD,

            clientName:
              clientName ||
              'Cliente Genérico',

            clientDocument:
              clientDocument ||
              'N/A',

            clientPhone:
              clientPhone ||
              'N/A'

          };


          setSalesHistory(
            previous => [
              newSaleRecord,
              ...previous
            ]
          );


          // IMPORTANTE:
          // Ahora ReceiptTicket recibe correctamente "sale"

          setLastPrintedSale(
            newSaleRecord
          );


          if (
            paymentMethod ===
            'Crédito / Fiado'
          ) {

            const newCredit:
              CreditAccount = {

              id:
                Date.now(),

              clientName:
                clientName ||
                'Cliente Genérico',

              clientPhone:
                clientPhone ||
                'N/A',

              clientDocument:
                clientDocument ||
                'N/A',

              totalDebtUSD:
                totalUSD,

              totalDebtBs:
                totalBs,

              date:
                new Date()
                  .toLocaleDateString(),

              status:
                'Pendiente',

              saleId:
                newSaleRecord.id

            };


            setCredits(
              previous => [
                newCredit,
                ...previous
              ]
            );

          }


          // ACTUALIZAR STOCK

          setProducts(
            previous =>
              previous.map(
                product => {

                  const cartItem =
                    cart.find(
                      item =>
                        item.id ===
                        product.id
                    );


                  if (
                    cartItem
                  ) {

                    return {
                      ...product,

                      stock:
                        Math.max(
                          0,
                          product.stock -
                            cartItem.quantity
                        )
                    };

                  }


                  return product;

                }
              )
          );


          // MODAL ÉXITO

          setSuccessModalData({

            isOpen: true,

            changeUSD,

            changeBs,

            isCredit:
              paymentMethod ===
              'Crédito / Fiado',

            clientName:
              clientName ||
              'Cliente Genérico'

          });


          // LIMPIAR

          setCart([]);

          setIsCheckoutModalOpen(
            false
          );

          setCashGivenUSD('');

          setClientName('');

          setClientPhone('');

          setClientDocument('');

        } else {

          alert(
            'Error al procesar la venta: ' +
            (
              data.error ||
              'Desconocido'
            )
          );

        }

      } catch (error) {

        console.error(
          error
        );

        alert(
          'Error de red al procesar la venta.'
        );

      }

    };


  // ==========================================================
  // FILTROS
  // ==========================================================

  const filteredProducts =
    products.filter(
      product => {

        const matchesSearch =
          product.name
            .toLowerCase()
            .includes(
              searchTerm
                .toLowerCase()
            ) ||
          product.category
            .toLowerCase()
            .includes(
              searchTerm
                .toLowerCase()
            );


        const matchesCategory =
          selectedCategory ===
            'Todos' ||
          product.category ===
            selectedCategory;


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );


  const categories = [
    'Todos',
    ...Array.from(
      new Set(
        products.map(
          product =>
            product.category
        )
      )
    )
  ];

  // ==========================================================
  // IMPORTANTE
  // ==========================================================
  // A partir de aquí continúa el JSX principal de tu
  // DashboardPOS que ya tienes en la PARTE 3.
  //
  // El cambio fundamental para el error de Vercel es:
  //
  // <ReceiptTicket sale={lastPrintedSale} />
  //
  // y la definición:
  //
  // interface ReceiptProps {
  //   sale: SaleRecord;
  // }
  //
  // function ReceiptTicket({ sale }: ReceiptProps) { ... }
  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">

      {/* ========================================================
          BARRA SUPERIOR
      ======================================================== */}

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
            Usuario:{' '}
            <strong className="text-white">
              {currentUsername}
            </strong>
          </div>

          <select
            value={currentUsername}
            onChange={(e) =>
              setCurrentUsername(e.target.value)
            }
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >

            {usersList.map((u: any) => (
              <option
                key={u.id || u.username}
                value={u.username}
              >
                {u.username} ({u.roleId})
              </option>
            ))}

          </select>

        </div>

      </header>


      {/* ========================================================
          NAVEGACIÓN
      ======================================================== */}

      <nav className="bg-white border-b border-slate-200 px-6 flex gap-2 overflow-x-auto shadow-xs">

        {userPermissions.includes('view_pos') && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${
              activeTab === 'pos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🛒 Punto de Venta
          </button>
        )}

        {userPermissions.includes('view_inventory') && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📦 Inventario
          </button>
        )}

        {userPermissions.includes('view_reports') && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 Reportes y Ventas
          </button>
        )}

        {userPermissions.some((p: string) =>
          ['view_credits', 'view_payables'].includes(p)
        ) && (
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            💳 Cuentas
          </button>
        )}

        {userPermissions.includes('view_pos') && (
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${
              activeTab === 'customers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 Clientes
          </button>
        )}

        {userPermissions.includes('manage_roles') && (
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔐 Roles y Permisos
          </button>
        )}

      </nav>


      {/* ========================================================
          CONTENIDO PRINCIPAL
      ======================================================== */}

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">


        {/* ======================================================
            PESTAÑA POS
        ====================================================== */}

        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* PRODUCTOS */}

            <div className="lg:col-span-2 space-y-4">

              <div className="flex flex-col sm:flex-row gap-3">

                <input
                  type="text"
                  placeholder="🔍 Buscar producto por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 shadow-xs"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 shadow-xs font-bold"
                >

                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  ))}

                </select>

              </div>


              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[650px] overflow-y-auto pr-2">

                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                    No hay productos disponibles.
                  </div>
                )}

                {filteredProducts.map((product) => (

                  <div
                    key={product.id}
                    onClick={() =>
                      addToCart(product)
                    }
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

                        <div className="text-xs font-black text-slate-900">
                          ${product.price.toFixed(2)}
                        </div>

                        <div className="text-[10px] text-slate-400">
                          Bs.{' '}
                          {(
                            product.price *
                            exchangeRate
                          ).toFixed(2)}
                        </div>

                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          product.stock > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        Stock: {product.stock}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            {/* CARRITO */}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">

              <div className="space-y-4">

                <div className="flex justify-between items-center border-b border-slate-100 pb-3">

                  <h3 className="font-bold text-slate-800 text-base">
                    🛒 Carrito Actual
                  </h3>

                  <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                    {cart.reduce(
                      (acc, item) =>
                        acc + item.quantity,
                      0
                    )}{' '}
                    ítems
                  </span>

                </div>


                {/* SELECTOR CLIENTE */}

                <POSCustomerSelector
                  onSelectCustomer={(c: any) => {

                    setClientName(
                      c.name
                    );

                    setClientDocument(
                      c.document ??
                      c.rif_ci ??
                      c.rifCi ??
                      'N/A'
                    );

                    setClientPhone(
                      c.phone ??
                      'N/A'
                    );

                  }}
                />


                {/* ITEMS */}

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">

                  {cart.length === 0 ? (

                    <div className="text-center py-10 text-slate-400 text-xs">
                      El carrito está vacío.
                      <br />
                      Haga clic en un producto
                      para agregarlo.
                    </div>

                  ) : (

                    cart.map((item) => (

                      <div
                        key={item.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs"
                      >

                        <div className="space-y-1 flex-1 pr-2">

                          <div className="font-bold text-slate-800 line-clamp-1">
                            {item.name}
                          </div>

                          <div className="text-slate-500">
                            ${item.price.toFixed(2)}
                            {' '}c/u
                          </div>

                        </div>


                        <div className="flex items-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                -1
                              )
                            }
                            className="w-6 h-6 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100"
                          >
                            -
                          </button>

                          <span className="font-bold w-4 text-center">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                1
                              )
                            }
                            className="w-6 h-6 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.id
                              )
                            }
                            className="text-red-500 hover:text-red-700 font-bold ml-1 px-1"
                          >
                            ×
                          </button>

                        </div>

                      </div>

                    ))

                  )}

                </div>

              </div>


              {/* TOTALES */}

              <div className="border-t border-slate-100 pt-4 space-y-3">

                <div className="space-y-1 text-xs">

                  <div className="flex justify-between text-slate-600">
                    <span>
                      Subtotal:
                    </span>
                    <span>
                      ${subtotalUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>
                      IVA (16%):
                    </span>
                    <span>
                      ${ivaUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-100 pt-1">
                    <span>
                      Total USD:
                    </span>
                    <span className="text-blue-600">
                      ${totalUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-500 text-xs">
                    <span>
                      Total Bs.:
                    </span>
                    <span>
                      Bs. {totalBs.toFixed(2)}
                    </span>
                  </div>

                </div>


                <button
                  disabled={
                    cart.length === 0
                  }
                  onClick={() =>
                    setIsCheckoutModalOpen(
                      true
                    )
                  }
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  Proceder al Pago ⚡
                </button>

              </div>

            </div>

          </div>
        )}


        {/* ======================================================
            INVENTARIO
        ====================================================== */}

        {activeTab === 'inventory' && (
          <div className="space-y-6">

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

              <h3 className="text-lg font-bold text-slate-800">
                📦 Registrar Nuevo Producto
              </h3>

              <form
                onSubmit={async (e) => {

                  e.preventDefault();

                  if (
                    !newName ||
                    !newPrice ||
                    !newStock
                  ) {
                    return;
                  }

                  try {

                    const res =
                      await fetch(
                        '/api/products',
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type':
                              'application/json'
                          },
                          body:
                            JSON.stringify({
                              name:
                                newName,
                              costPrice:
                                Number(
                                  newCostPrice ||
                                  0
                                ),
                              price:
                                Number(
                                  newPrice
                                ),
                              category:
                                newCategory,
                              taxable:
                                newTaxable,
                              stock:
                                Number(
                                  newStock
                                )
                            })
                        }
                      );

                    const data =
                      await res.json();

                    if (
                      data.success ||
                      data.id
                    ) {

                      alert(
                        '¡Producto registrado con éxito!'
                      );

                      setNewName('');
                      setNewCostPrice('');
                      setNewPrice('');
                      setNewStock('');

                      const updated =
                        await fetch(
                          '/api/products'
                        ).then(
                          r =>
                            r.json()
                        );

                      if (
                        Array.isArray(
                          updated
                        )
                      ) {
                        setProducts(
                          updated
                        );
                      }

                    } else {

                      alert(
                        'Error: ' +
                        (
                          data.error ||
                          'No se pudo guardar'
                        )
                      );

                    }

                  } catch (error) {

                    console.error(
                      error
                    );

                    alert(
                      'Error de conexión.'
                    );

                  }

                }}
                className="grid grid-cols-1 sm:grid-cols-6 gap-3"
              >

                <input
                  type="text"
                  placeholder="Nombre *"
                  required
                  value={newName}
                  onChange={(e) =>
                    setNewName(
                      e.target.value
                    )
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Costo ($)"
                  value={newCostPrice}
                  onChange={(e) =>
                    setNewCostPrice(
                      e.target.value
                    )
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio Venta ($) *"
                  required
                  value={newPrice}
                  onChange={(e) =>
                    setNewPrice(
                      e.target.value
                    )
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />

                <input
                  type="text"
                  placeholder="Categoría"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(
                      e.target.value
                    )
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />

                <input
                  type="number"
                  placeholder="Stock Inicial *"
                  required
                  value={newStock}
                  onChange={(e) =>
                    setNewStock(
                      e.target.value
                    )
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs shadow-sm"
                >
                  Guardar Producto
                </button>

              </form>

            </div>


            {/* LISTADO */}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">

                <h3 className="text-lg font-bold text-slate-800">
                  Listado de Inventario Actual
                </h3>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      setInventoryFilterMode(
                        'all'
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      inventoryFilterMode ===
                      'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Todos
                  </button>

                  <button
                    onClick={() =>
                      setInventoryFilterMode(
                        'low'
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      inventoryFilterMode ===
                      'low'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Stock Bajo (&lt;5)
                  </button>

                </div>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse text-xs">

                  <thead>

                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">

                      <th className="p-3">
                        Producto
                      </th>

                      <th className="p-3">
                        Categoría
                      </th>

                      <th className="p-3">
                        Precio Venta
                      </th>

                      <th className="p-3">
                        Stock
                      </th>

                      <th className="p-3 text-right">
                        Acciones
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-slate-100">

                    {products
                      .filter(
                        p =>
                          inventoryFilterMode ===
                            'all' ||
                          p.stock < 5
                      )
                      .map((p) => (

                        <tr
                          key={p.id}
                          className="hover:bg-slate-50"
                        >

                          <td className="p-3 font-bold text-slate-800">
                            {p.name}
                          </td>

                          <td className="p-3 text-slate-600">
                            {p.category}
                          </td>

                          <td className="p-3 text-slate-600">
                            ${p.price.toFixed(2)}
                          </td>

                          <td className="p-3">

                            <span
                              className={`font-bold px-2 py-0.5 rounded-md ${
                                p.stock < 5
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {p.stock} unids.
                            </span>

                          </td>

                          <td className="p-3 text-right">

                            <button
                              onClick={() => {

                                setSelectedProductForRestock(
                                  p
                                );

                                setRestockAmount(
                                  ''
                                );

                                setIsRestockModalOpen(
                                  true
                                );

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


        {/* ======================================================
            REPORTES
        ====================================================== */}

        {activeTab === 'reports' && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                <div className="text-xs font-bold text-slate-400 uppercase">
                  Ventas Totales
                </div>

                <div className="text-2xl font-black text-slate-800">
                  $
                  {salesHistory
                    .reduce(
                      (acc, sale) =>
                        acc +
                        sale.totalUSD,
                      0
                    )
                    .toFixed(2)}
                </div>

              </div>


              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                <div className="text-xs font-bold text-slate-400 uppercase">
                  Transacciones
                </div>

                <div className="text-2xl font-black text-blue-600">
                  {salesHistory.length}
                </div>

              </div>


              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                <div className="text-xs font-bold text-slate-400 uppercase">
                  Tasa de Cambio
                </div>

                <div className="text-2xl font-black text-emerald-600">
                  {exchangeRate.toFixed(2)}
                  {' '}Bs/$
                </div>

              </div>

            </div>


            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

              <h3 className="text-lg font-bold text-slate-800">
                Historial de Ventas
              </h3>

              <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse text-xs">

                  <thead>

                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">

                      <th className="p-3">
                        ID / Fecha
                      </th>

                      <th className="p-3">
                        Cliente
                      </th>

                      <th className="p-3">
                        Método de Pago
                      </th>

                      <th className="p-3">
                        Total USD
                      </th>

                      <th className="p-3">
                        Total Bs.
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-slate-100">

                    {salesHistory.length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="text-center py-6 text-slate-400"
                        >
                          No hay ventas registradas aún.
                        </td>

                      </tr>

                    ) : (

                      salesHistory.map(
                        (sale) => (

                          <tr
                            key={sale.id}
                            className="hover:bg-slate-50"
                          >

                            <td className="p-3">

                              <div className="font-bold text-slate-800">
                                #{sale.id}
                              </div>

                              <div className="text-[10px] text-slate-400">
                                {sale.date}
                              </div>

                            </td>

                            <td className="p-3 font-bold text-slate-700">
                              {sale.clientName ||
                                'Cliente Genérico'}
                            </td>

                            <td className="p-3 text-slate-600">
                              {sale.paymentMethod}
                            </td>

                            <td className="p-3 font-bold text-blue-600">
                              $
                              {sale.totalUSD.toFixed(2)}
                            </td>

                            <td className="p-3 text-slate-600">
                              Bs.{' '}
                              {sale.totalBs.toFixed(2)}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>
        )}


        {/* ======================================================
            CUENTAS
        ====================================================== */}

        {activeTab === 'accounts' && (
          <div className="space-y-6">

            {/* CREDITOS */}

            {userPermissions.includes(
              'view_credits'
            ) && (

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

                <h3 className="text-lg font-bold text-slate-800">
                  💳 Cuentas por Cobrar
                </h3>

                <div className="overflow-x-auto">

                  <table className="w-full text-left border-collapse text-xs">

                    <thead>

                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">

                        <th className="p-3">
                          Cliente
                        </th>

                        <th className="p-3">
                          Teléfono / Cédula
                        </th>

                        <th className="p-3">
                          Deuda USD
                        </th>

                        <th className="p-3">
                          Fecha
                        </th>

                        <th className="p-3">
                          Estado
                        </th>

                        <th className="p-3 text-right">
                          Acción
                        </th>

                      </tr>

                    </thead>


                    <tbody className="divide-y divide-slate-100">

                      {credits.length === 0 ? (

                        <tr>

                          <td
                            colSpan={6}
                            className="text-center py-6 text-slate-400"
                          >
                            No hay créditos registrados.
                          </td>

                        </tr>

                      ) : (

                        credits.map(
                          (credit) => (

                            <tr
                              key={credit.id}
                              className="hover:bg-slate-50"
                            >

                              <td className="p-3 font-bold text-slate-800">
                                {credit.clientName}
                              </td>

                              <td className="p-3 text-slate-600">
                                {credit.clientDocument}
                                {' / '}
                                {credit.clientPhone}
                              </td>

                              <td className="p-3 font-bold text-red-600">
                                $
                                {credit.totalDebtUSD.toFixed(2)}
                              </td>

                              <td className="p-3 text-slate-600">
                                {credit.date}
                              </td>

                              <td className="p-3">

                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    credit.status ===
                                    'Pendiente'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {credit.status}
                                </span>

                              </td>

                              <td className="p-3 text-right">

                                {credit.status ===
                                  'Pendiente' && (

                                  <button
                                    onClick={() => {

                                      setCredits(
                                        previous =>
                                          previous.map(
                                            item =>
                                              item.id ===
                                              credit.id
                                                ? {
                                                    ...item,
                                                    status:
                                                      'Pagado'
                                                  }
                                                : item
                                          )
                                      );

                                      alert(
                                        '¡Crédito marcado como pagado!'
                                      );

                                    }}
                                    className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                                  >
                                    Pagar ✓
                                  </button>

                                )}

                              </td>

                            </tr>

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            )}


            {/* CUENTAS POR PAGAR */}

            {userPermissions.includes(
              'view_payables'
            ) && (

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

                <h3 className="text-lg font-bold text-slate-800">
                  📋 Cuentas por Pagar a Proveedores
                </h3>


                <form
                  onSubmit={(e) => {

                    e.preventDefault();

                    if (
                      !newProviderName ||
                      !newPayableAmountUSD
                    ) {
                      return;
                    }


                    const amount =
                      Number(
                        newPayableAmountUSD
                      );


                    const newAccount:
                      PayableAccount = {

                      id:
                        Date.now(),

                      providerName:
                        newProviderName,

                      providerDocument:
                        newProviderDoc ||
                        'N/A',

                      description:
                        newPayableDesc ||
                        'Compra mercancía',

                      totalDebtUSD:
                        amount,

                      totalDebtBs:
                        amount *
                        exchangeRate,

                      dueDate:
                        newDueDate ||
                        new Date()
                          .toLocaleDateString(),

                      date:
                        new Date()
                          .toLocaleDateString(),

                      status:
                        'Pendiente'

                    };


                    setPayables(
                      previous => [
                        newAccount,
                        ...previous
                      ]
                    );


                    setNewProviderName('');
                    setNewProviderDoc('');
                    setNewPayableDesc('');
                    setNewPayableAmountUSD('');
                    setNewDueDate('');


                    alert(
                      '¡Cuenta por pagar registrada!'
                    );

                  }}
                  className="grid grid-cols-1 sm:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
                >

                  <input
                    type="text"
                    placeholder="Proveedor *"
                    required
                    value={newProviderName}
                    onChange={(e) =>
                      setNewProviderName(
                        e.target.value
                      )
                    }
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />

                  <input
                    type="text"
                    placeholder="RIF / Doc"
                    value={newProviderDoc}
                    onChange={(e) =>
                      setNewProviderDoc(
                        e.target.value
                      )
                    }
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />

                  <input
                    type="text"
                    placeholder="Descripción"
                    value={newPayableDesc}
                    onChange={(e) =>
                      setNewPayableDesc(
                        e.target.value
                      )
                    }
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto USD ($) *"
                    required
                    value={
                      newPayableAmountUSD
                    }
                    onChange={(e) =>
                      setNewPayableAmountUSD(
                        e.target.value
                      )
                    }
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />

                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) =>
                      setNewDueDate(
                        e.target.value
                      )
                    }
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm"
                  >
                    Registrar Deuda
                  </button>

                </form>


                <div className="overflow-x-auto">

                  <table className="w-full text-left border-collapse text-xs">

                    <thead>

                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase">

                        <th className="p-3">
                          Proveedor
                        </th>

                        <th className="p-3">
                          Concepto
                        </th>

                        <th className="p-3">
                          Monto USD
                        </th>

                        <th className="p-3">
                          Vencimiento
                        </th>

                        <th className="p-3">
                          Estado
                        </th>

                        <th className="p-3 text-right">
                          Acción
                        </th>

                      </tr>

                    </thead>


                    <tbody className="divide-y divide-slate-100">

                      {payables.length === 0 ? (

                        <tr>

                          <td
                            colSpan={6}
                            className="text-center py-6 text-slate-400"
                          >
                            No hay cuentas por pagar registradas.
                          </td>

                        </tr>

                      ) : (

                        payables.map(
                          (payable) => (

                            <tr
                              key={payable.id}
                              className="hover:bg-slate-50"
                            >

                              <td className="p-3 font-bold text-slate-800">
                                {payable.providerName}
                              </td>

                              <td className="p-3 text-slate-600">
                                {payable.description}
                              </td>

                              <td className="p-3 font-bold text-red-600">
                                $
                                {payable.totalDebtUSD.toFixed(2)}
                              </td>

                              <td className="p-3 text-slate-600">
                                {payable.dueDate}
                              </td>

                              <td className="p-3">

                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    payable.status ===
                                    'Pendiente'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {payable.status}
                                </span>

                              </td>

                              <td className="p-3 text-right">

                                {payable.status ===
                                  'Pendiente' && (

                                  <button
                                    onClick={() => {

                                      setPayables(
                                        previous =>
                                          previous.map(
                                            item =>
                                              item.id ===
                                              payable.id
                                                ? {
                                                    ...item,
                                                    status:
                                                      'Pagado'
                                                  }
                                                : item
                                          )
                                      );

                                      alert(
                                        '¡Deuda saldada con éxito!'
                                      );

                                    }}
                                    className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                                  >
                                    Saldar ✓
                                  </button>

                                )}

                              </td>

                            </tr>

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </div>
        )}


        {/* ======================================================
            CLIENTES
        ====================================================== */}

        {activeTab === 'customers' && (
          <CustomersDirectoryModule />
        )}


        {/* ======================================================
            ROLES
        ====================================================== */}

        {activeTab === 'roles' && (
          <div className="space-y-6">

            <CashRegisterModule
              exchangeRate={exchangeRate}
            />

            <RolesManagerModule />

          </div>
        )}

      </main>


      {/* ========================================================
          MODAL CHECKOUT
      ======================================================== */}

      {isCheckoutModalOpen && (

        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">

            <h3 className="text-lg font-bold text-slate-800">
              Finalizar Venta / Cobro
            </h3>


            <div className="space-y-3">

              <div>

                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Método de Pago
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as PaymentMethodType
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >

                  <option value="Efectivo USD">
                    Efectivo USD ($)
                  </option>

                  <option value="Efectivo Bs">
                    Efectivo Bs. (Bs.)
                  </option>

                  <option value="Pago Móvil">
                    Pago Móvil
                  </option>

                  <option value="Zelle">
                    Zelle
                  </option>

                  <option value="Binance Pay">
                    Binance Pay
                  </option>

                  <option value="Crédito / Fiado">
                    Crédito / Fiado
                  </option>

                </select>

              </div>


              {paymentMethod ===
                'Efectivo USD' && (

                <div>

                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Efectivo Recibido ($)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashGivenUSD}
                    onChange={(e) =>
                      setCashGivenUSD(
                        e.target.value
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />


                  {Number(
                    cashGivenUSD
                  ) >= totalUSD && (

                    <div className="text-xs text-emerald-600 font-bold mt-1">

                      Cambio a devolver:{' '}

                      $
                      {(
                        Number(
                          cashGivenUSD
                        ) -
                        totalUSD
                      ).toFixed(2)}

                      {' '}

                      (Bs.{' '}

                      {(
                        (
                          Number(
                            cashGivenUSD
                          ) -
                          totalUSD
                        ) *
                        exchangeRate
                      ).toFixed(2)}

                      )

                    </div>

                  )}

                </div>

              )}


              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">

                <div className="flex justify-between font-bold text-slate-700">

                  <span>
                    Total a Pagar:
                  </span>

                  <span className="text-blue-600">
                    ${totalUSD.toFixed(2)}
                    {' '}
                    (Bs.{' '}
                    {totalBs.toFixed(2)})
                  </span>

                </div>

              </div>

            </div>


            <div className="flex gap-2 pt-2">

              <button
                onClick={() =>
                  setIsCheckoutModalOpen(
                    false
                  )
                }
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={handleCheckout}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Completar Venta ✓
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ========================================================
          MODAL REPOSICIÓN STOCK
      ======================================================== */}

      {isRestockModalOpen &&
        selectedProductForRestock && (

        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">

            <h3 className="text-lg font-bold text-slate-800">
              Reponer Stock
            </h3>

            <p className="text-xs text-slate-500">

              Producto:{' '}

              <strong className="text-slate-800">
                {
                  selectedProductForRestock.name
                }
              </strong>

              {' '}

              (Stock actual:{' '}

              {
                selectedProductForRestock.stock
              }

              )

            </p>


            <input
              type="number"
              min="1"
              placeholder="Cantidad a agregar *"
              value={restockAmount}
              onChange={(e) =>
                setRestockAmount(
                  e.target.value
                )
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            />


            <div className="flex gap-2 pt-2">

              <button
                onClick={() => {

                  setIsRestockModalOpen(
                    false
                  );

                  setSelectedProductForRestock(
                    null
                  );

                  setRestockAmount('');

                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>


              <button
                onClick={async () => {

                  const addQty =
                    Number(
                      restockAmount
                    );


                  if (
                    !addQty ||
                    addQty <= 0
                  ) {

                    alert(
                      'Ingrese una cantidad válida.'
                    );

                    return;
                  }


                  const newStockValue =
                    selectedProductForRestock.stock +
                    addQty;


                  try {

                    const res =
                      await fetch(
                        '/api/products',
                        {
                          method: 'PUT',
                          headers: {
                            'Content-Type':
                              'application/json'
                          },
                          body:
                            JSON.stringify({
                              id:
                                selectedProductForRestock.id,
                              stock:
                                newStockValue
                            })
                        }
                      );


                    const data =
                      await res.json();


                    if (
                      data.success
                    ) {

                      setProducts(
                        previous =>
                          previous.map(
                            product =>
                              product.id ===
                              selectedProductForRestock.id
                                ? {
                                    ...product,
                                    stock:
                                      newStockValue
                                  }
                                : product
                          )
                      );


                      alert(
                        '¡Stock actualizado con éxito!'
                      );


                      setIsRestockModalOpen(
                        false
                      );

                      setSelectedProductForRestock(
                        null
                      );

                      setRestockAmount('');

                    } else {

                      alert(
                        'Error al actualizar stock: ' +
                        (
                          data.error ||
                          'Error desconocido'
                        )
                      );

                    }

                  } catch (error) {

                    console.error(
                      error
                    );

                    alert(
                      'Error de conexión al actualizar stock.'
                    );

                  }

                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Actualizar Stock
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ========================================================
          MODAL VENTA EXITOSA
      ======================================================== */}

      {successModalData?.isOpen && (

        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">

            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>


            <h3 className="text-lg font-bold text-slate-800">
              ¡Venta Exitosa!
            </h3>


            {successModalData.changeUSD >
              0 && (

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">

                Cambio a entregar:{' '}

                <strong className="font-black">
                  $
                  {successModalData.changeUSD.toFixed(
                    2
                  )}
                </strong>

                {' '}

                (Bs.{' '}

                {successModalData.changeBs.toFixed(
                  2
                )}

                )

              </div>

            )}


            {successModalData.isCredit && (

              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-xs font-bold">
                Venta registrada como crédito.
                <br />
                Cliente:{' '}
                {successModalData.clientName}
              </div>

            )}


            <div className="flex flex-col gap-2 pt-2">

              <button
                onClick={() => {

                  window.print();

                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Imprimir Recibo 🖨️
              </button>


              <button
                onClick={() =>
                  setSuccessModalData(
                    null
                  )
                }
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Continuar Vendiendo ⚡
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ========================================================
          RECIBO PARA IMPRESIÓN
      ======================================================== */}

      {lastPrintedSale && (

        <div className="hidden print:block">

          <ReceiptTicket
            sale={lastPrintedSale}
          />

        </div>

      )}

    </div>
  );
}
