// ============================================================
// DASHBOARD POS - PARTE 1/3
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';

// IMPORTA AQUÍ TUS COMPONENTES EXISTENTES
// Ajusta las rutas si en tu proyecto son diferentes.
import POSCustomerSelector from '@/components/POSCustomerSelector';
import CashRegisterModule from '@/components/CashRegisterModule';
import RolesManagerModule from '@/components/RolesManagerModule';
import ReceiptTicket from '@/components/ReceiptTicket';

// IMPORTA TUS FUNCIONES DE ROLES/USUARIOS
// Ajusta la ruta según tu proyecto.
import { getRoles, getUsers } from '@/lib/permissions';

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
// MÓDULO DE CLIENTES FRECUENTES
// ============================================================

function CustomersDirectoryModule() {
  const [customers, setCustomers] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [rifCi, setRifCi] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------------
  // CARGAR CLIENTES
  // ----------------------------------------------------------

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // ----------------------------------------------------------
  // GUARDAR CLIENTE
  // ----------------------------------------------------------

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Debe indicar el nombre del cliente.');
      return;
    }

    try {
      setLoading(true);

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
        alert('¡Cliente frecuente guardado con éxito!');

        setName('');
        setRifCi('');
        setPhone('');
        setAddress('');

        await loadCustomers();
      } else {
        alert(
          'Error: ' +
            (data.error || 'No se pudo registrar el cliente.')
        );
      }
    } catch (err) {
      console.error('Error guardando cliente:', err);

      alert('Error de conexión al guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // INTERFAZ
  // ----------------------------------------------------------

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">

        <div>
          <h3 className="text-xl font-bold text-slate-800">
            👥 Gestión de Clientes Frecuentes
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Guarda clientes recurrentes para seleccionarlos
            rápidamente al momento de facturar o registrar créditos.
          </p>
        </div>

        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-200 whitespace-nowrap">
          Total: {customers.length} clientes
        </span>

      </div>

      {/* FORMULARIO */}

      <form
        onSubmit={handleSaveCustomer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
      >

        <input
          type="text"
          placeholder="Nombre y Apellido *"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Cédula / RIF"
          value={rifCi}
          onChange={(e) => setRifCi(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs shadow-sm"
        >
          {loading ? 'Guardando...' : 'Registrar Cliente 💾'}
        </button>

      </form>

      {/* TABLA */}

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

            {customers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-slate-400"
                >
                  No hay clientes registrados en la base de datos.
                </td>
              </tr>
            )}

            {customers.map((customer, index) => (
              <tr
                key={customer.id || index}
                className="hover:bg-slate-50"
              >

                <td className="p-3 font-bold text-slate-800">
                  {customer.name}
                </td>

                <td className="p-3 text-slate-600">
                  {customer.rif_ci || customer.rifCi || 'N/A'}
                </td>

                <td className="p-3 text-slate-600">
                  {customer.phone || 'N/A'}
                </td>

                <td className="p-3 text-slate-600">
                  {customer.address || 'N/A'}
                </td>

              </tr>
            ))}

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

  // ----------------------------------------------------------
  // ESTADO GENERAL
  // ----------------------------------------------------------

  const [isMounted, setIsMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'pos'
    | 'inventory'
    | 'reports'
    | 'accounts'
    | 'customers'
    | 'roles'
  >('pos');

  // ----------------------------------------------------------
  // DATOS PRINCIPALES
  // ----------------------------------------------------------

  const [products, setProducts] = useState<Product[]>([]);

  const [salesHistory, setSalesHistory] =
    useState<SaleRecord[]>([]);

  const [credits, setCredits] =
    useState<CreditAccount[]>([]);

  const [payables, setPayables] =
    useState<PayableAccount[]>([]);

  const [exchangeRate, setExchangeRate] =
    useState<number>(778.33);

  // ----------------------------------------------------------
  // USUARIO / ROLES
  // ----------------------------------------------------------

  const [currentUsername, setCurrentUsername] =
    useState<string>('admin');

  const [rolesList, setRolesList] =
    useState<any[]>(getRoles());

  const [usersList, setUsersList] =
    useState<any[]>(getUsers());

  // ----------------------------------------------------------
  // REPOSICIÓN
  // ----------------------------------------------------------

  const [isRestockModalOpen, setIsRestockModalOpen] =
    useState(false);

  const [selectedProductForRestock, setSelectedProductForRestock] =
    useState<Product | null>(null);

  const [restockAmount, setRestockAmount] =
    useState('');

  // ----------------------------------------------------------
  // FILTROS
  // ----------------------------------------------------------

  const [inventoryFilterMode, setInventoryFilterMode] =
    useState<'all' | 'low'>('all');

  const [reportFilterPeriod, setReportFilterPeriod] =
    useState<'all' | 'today' | 'week' | 'month'>('all');

  // ----------------------------------------------------------
  // CUENTAS POR PAGAR
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // CARRITO
  // ----------------------------------------------------------

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] =
    useState(false);

  const [cashGivenUSD, setCashGivenUSD] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('Efectivo USD');

  // ----------------------------------------------------------
  // CLIENTE ACTUAL
  // ----------------------------------------------------------

  const [clientName, setClientName] =
    useState('');

  const [clientPhone, setClientPhone] =
    useState('');

  const [clientDocument, setClientDocument] =
    useState('');

  // ----------------------------------------------------------
  // BÚSQUEDA
  // ----------------------------------------------------------

  const [searchTerm, setSearchTerm] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('Todos');

  // ----------------------------------------------------------
  // NUEVO PRODUCTO
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // IMPRESIÓN / MODALES
  // ----------------------------------------------------------

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
  // INICIALIZACIÓN
  // ==========================================================

  useEffect(() => {

    setIsMounted(true);

    if (typeof window !== 'undefined') {

      const savedCredits =
        localStorage.getItem('pos_credits');

      if (savedCredits) {
        try {
          setCredits(JSON.parse(savedCredits));
        } catch (error) {
          console.error(error);
        }
      }

      const savedPayables =
        localStorage.getItem('pos_payables');

      if (savedPayables) {
        try {
          setPayables(JSON.parse(savedPayables));
        } catch (error) {
          console.error(error);
        }
      }

      const savedBcv =
        localStorage.getItem('pos_bcv');

      if (savedBcv) {

        const parsedBcv =
          parseFloat(savedBcv);

        if (!isNaN(parsedBcv)) {
          setExchangeRate(parsedBcv);
        }
      }
    }

  }, []);

  // ==========================================================
  // CARGAR DATOS DESDE API
  // ==========================================================

  useEffect(() => {

    async function loadCloudData() {

      try {

        const prodRes =
          await fetch('/api/products');

        if (!prodRes.ok) {
          throw new Error(
            `Products HTTP ${prodRes.status}`
          );
        }

        const prodData =
          await prodRes.json();

        if (Array.isArray(prodData)) {
          setProducts(prodData);
        }

        const salesRes =
          await fetch('/api/sales');

        if (!salesRes.ok) {
          throw new Error(
            `Sales HTTP ${salesRes.status}`
          );
        }

        const salesData =
          await salesRes.json();

        if (Array.isArray(salesData)) {

          const formattedSales =
            salesData.map((sale: any) => ({

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
                    ) * exchangeRate
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

            }));

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

        setRolesList(getRoles());
        setUsersList(getUsers());

      }, 1000);

    return () => clearInterval(interval);

  }, []);

  // ==========================================================
  // USUARIO ACTUAL
  // ==========================================================

  const currentUserObj =
    usersList.find(
      (u: any) =>
        String(u.username || '').toLowerCase() ===
        String(currentUsername || '').toLowerCase()
    ) || usersList[0];

  const currentRoleObj =
    rolesList.find(
      (r: any) =>
        String(r.id || '').toLowerCase() ===
          String(currentUserObj?.roleId || '').toLowerCase()
        ||
        String(r.name || '').toLowerCase() ===
          String(currentUserObj?.roleId || '').toLowerCase()
    ) || rolesList[0];

  const userPermissions: string[] =
    currentRoleObj?.permissions || [];

  // ==========================================================
  // MAPA DE PERMISOS
  // ==========================================================

  const tabPermissionMap: Record<
    string,
    string[]
  > = {

    pos: ['view_pos'],

    inventory: ['view_inventory'],

    accounts: [
      'view_credits',
      'view_payables',
      'manage_roles'
    ],

    reports: ['view_reports'],

    customers: ['view_pos'],

    roles: ['manage_roles']

  };

  // ==========================================================
  // CONTROL DE ACCESO A PESTAÑAS
  // ==========================================================

  useEffect(() => {

    const requiredPermissions =
      tabPermissionMap[activeTab] || [];

    const hasAccess =
      requiredPermissions.length === 0 ||
      requiredPermissions.some(
        permission =>
          userPermissions.includes(permission)
      );

    if (!hasAccess) {

      const availableTab =
        Object.keys(tabPermissionMap).find(
          tab => {

            const permissions =
              tabPermissionMap[tab];

            return permissions.some(
              permission =>
                userPermissions.includes(permission)
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
        availableTab !== activeTab
      ) {
        setActiveTab(availableTab);
      }
    }

  }, [
    currentUsername,
    currentRoleObj,
    activeTab,
    userPermissions
  ]);

  // ==========================================================
  // GUARDAR LOCAL STORAGE
  // ==========================================================

  useEffect(() => {

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'pos_credits',
        JSON.stringify(credits)
      );
    }

  }, [credits]);

  useEffect(() => {

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'pos_payables',
        JSON.stringify(payables)
      );
    }

  }, [payables]);

  useEffect(() => {

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'pos_bcv',
        exchangeRate.toString()
      );
    }

  }, [exchangeRate]);

  // ==========================================================
  // CARRITO
  // ==========================================================

  const addToCart = (product: Product) => {

    if (product.stock <= 0) {
      alert('¡Producto agotado!');
      return;
    }

    setCart(prev => {

      const existing =
        prev.find(
          item => item.id === product.id
        );

      if (existing) {

        if (
          existing.quantity >=
          product.stock
        ) {

          alert(
            'No hay más stock disponible para este producto.'
          );

          return prev;
        }

        return prev.map(
          item =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1
                }
              : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (
    id: number,
    delta: number
  ) => {

    setCart(prev => {

      return prev
        .map(item => {

          if (item.id === id) {

            const newQty =
              item.quantity + delta;

            if (
              newQty > item.stock
            ) {

              alert(
                'Stock máximo alcanzado.'
              );

              return item;
            }

            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty
                }
              : null;
          }

          return item;
        })
        .filter(Boolean) as CartItem[];

    });
  };

  const removeFromCart = (
    id: number
  ) => {

    setCart(prev =>
      prev.filter(
        item => item.id !== id
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
        item.price *
          item.quantity,
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
    subtotalUSD + ivaUSD;

  const totalBs =
    totalUSD * exchangeRate;

  // ==========================================================
  // PROCESAR VENTA
  // ==========================================================

  const handleCheckout = async () => {

    if (cart.length === 0) {
      return;
    }

    if (
      paymentMethod === 'Crédito / Fiado' &&
      !clientName.trim()
    ) {

      alert(
        'Para ventas a crédito debe indicar el Nombre del Cliente.'
      );

      return;
    }

    const cashNum =
      Number(cashGivenUSD || 0);

    if (
      paymentMethod === 'Efectivo USD' &&
      cashNum < totalUSD
    ) {

      alert(
        'El monto en efectivo recibido es menor al total de la venta.'
      );

      return;
    }

    const changeUSD =
      paymentMethod === 'Efectivo USD'
        ? Math.max(
            0,
            cashNum - totalUSD
          )
        : 0;

    const changeBs =
      changeUSD * exchangeRate;

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
        await fetch('/api/sales', {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              salePayload
            )
        });

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

          items: [
            ...cart
          ],

          subtotalUSD,

          ivaUSD,

          totalUSD,

          totalBs,

          exchangeRate,

          paymentMethod,

          changeUSD,

          clientName:
            clientName ||
            'Cliente Genérico'
        };

        setSalesHistory(
          prev => [
            newSaleRecord,
            ...prev
          ]
        );

        setLastPrintedSale(
          newSaleRecord
        );

        // ----------------------------------------
        // CRÉDITO
        // ----------------------------------------

        if (
          paymentMethod ===
          'Crédito / Fiado'
        ) {

          const newCredit:
            CreditAccount = {

            id: Date.now(),

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
            prev => [
              newCredit,
              ...prev
            ]
          );
        }

        // ----------------------------------------
        // ACTUALIZAR STOCK LOCAL
        // ----------------------------------------

        setProducts(
          prev =>
            prev.map(product => {

              const cartItem =
                cart.find(
                  item =>
                    item.id ===
                    product.id
                );

              if (cartItem) {

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
            })
        );

        // ----------------------------------------
        // MODAL ÉXITO
        // ----------------------------------------

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

        // ----------------------------------------
        // LIMPIAR
        // ----------------------------------------

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

      console.error(error);

      alert(
        'Error de red al procesar la venta.'
      );
    }
  };

  // ==========================================================
  // PRODUCTOS FILTRADOS
  // ==========================================================

  const filteredProducts =
    products.filter(product => {

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(
            searchTerm
              .toLowerCase()
          )
        ||
        product.category
          .toLowerCase()
          .includes(
            searchTerm
              .toLowerCase()
          );

      const matchesCategory =
        selectedCategory === 'Todos' ||
        product.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

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
  // CARGANDO
  // ==========================================================

  if (!isMounted) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        Cargando POS...
      </div>
    );
  }

  // ==========================================================
  // PARTE 2 CONTINÚA AQUÍ
  // ==========================================================
  // ==========================================================
  // RENDER PRINCIPAL
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">

      {/* ======================================================
          BARRA SUPERIOR
      ====================================================== */}

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

            {usersList.map((user: any) => (

              <option
                key={user.id || user.username}
                value={user.username}
              >
                {user.username} ({user.roleId})
              </option>

            ))}

          </select>

        </div>

      </header>

      {/* ======================================================
          NAVEGACIÓN
      ====================================================== */}

      <nav className="bg-white border-b border-slate-200 px-6 flex gap-2 overflow-x-auto shadow-sm">

        {/* POS */}

        {userPermissions.includes('view_pos') && (

          <button
            onClick={() =>
              setActiveTab('pos')
            }
            className={`
              py-3 px-4
              font-bold
              text-xs
              border-b-2
              transition
              whitespace-nowrap
              ${
                activeTab === 'pos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }
            `}
          >
            🛒 Punto de Venta (POS)
          </button>

        )}

        {/* INVENTARIO */}

        {userPermissions.includes('view_inventory') && (

          <button
            onClick={() =>
              setActiveTab('inventory')
            }
            className={`
              py-3 px-4
              font-bold
              text-xs
              border-b-2
              transition
              whitespace-nowrap
              ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }
            `}
          >
            📦 Inventario
          </button>

        )}

        {/* REPORTES */}

        {userPermissions.includes('view_reports') && (

          <button
            onClick={() =>
              setActiveTab('reports')
            }
            className={`
              py-3 px-4
              font-bold
              text-xs
              border-b-2
              transition
              whitespace-nowrap
              ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }
            `}
          >
            📊 Reportes y Ventas
          </button>

        )}

        {/* CUENTAS */}

        {userPermissions.some((permission) =>
          [
            'view_credits',
            'view_payables'
          ].includes(permission)
        ) && (

          <button
            onClick={() =>
              setActiveTab('accounts')
            }
            className={`
              py-3 px-4
              font-bold
              text-xs
              border-b-2
              transition
              whitespace-nowrap
              ${
                activeTab === 'accounts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }
            `}
          >
            💳 Cuentas
          </button>

        )}

        {/* CLIENTES */}

        {userPermissions.includes('view_pos') && (

          <button
            onClick={() =>
              setActiveTab('customers')
            }
            className={`
              py-3 px-4
              font-bold
              text-xs
              border-b-2
              transition
              whitespace-nowrap
              ${
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }
            `}
          >
            👥 Clientes
          </button>

        )}

        {/* ROLES */}

        {userPermissions.includes('manage_roles') && (

          <button
            onClick={() =>
              setActiveTab('roles')
            }
            className={`
              py-3 px-4
              font-bold
              text-xs
              border-b-2
              transition
              whitespace-nowrap
              ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }
            `}
          >
            🔐 Roles y Permisos
          </button>

        )}

      </nav>

      {/* ======================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* ====================================================
            PESTAÑA POS
        ==================================================== */}

        {activeTab === 'pos' && (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* =================================================
                PRODUCTOS
            ================================================= */}

            <div className="lg:col-span-2 space-y-4">

              {/* BUSCADOR */}

              <div className="flex flex-col sm:flex-row gap-3">

                <input
                  type="text"
                  placeholder="🔍 Buscar producto por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="
                    flex-1
                    bg-white
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-2.5
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                    shadow-sm
                  "
                />

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="
                    bg-white
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-2.5
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                    shadow-sm
                    font-bold
                  "
                >

                  {categories.map((category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  ))}

                </select>

              </div>

              {/* GRID PRODUCTOS */}

              <div className="
                grid
                grid-cols-2
                sm:grid-cols-3
                gap-3
                max-h-[650px]
                overflow-y-auto
                pr-2
              ">

                {filteredProducts.length === 0 ? (

                  <div className="
                    col-span-full
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-10
                    text-center
                    text-xs
                    text-slate-400
                  ">
                    No se encontraron productos.
                  </div>

                ) : (

                  filteredProducts.map((product) => (

                    <div
                      key={product.id}
                      onClick={() =>
                        addToCart(product)
                      }
                      className="
                        bg-white
                        border
                        border-slate-200
                        rounded-2xl
                        p-4
                        shadow-sm
                        hover:shadow-md
                        transition
                        cursor-pointer
                        flex
                        flex-col
                        justify-between
                        space-y-3
                        group
                      "
                    >

                      <div>

                        <span className="
                          text-[10px]
                          font-bold
                          text-blue-600
                          uppercase
                          tracking-wider
                          bg-blue-50
                          px-2
                          py-0.5
                          rounded-md
                        ">
                          {product.category}
                        </span>

                        <h4 className="
                          font-bold
                          text-slate-800
                          text-sm
                          mt-2
                          group-hover:text-blue-600
                          transition
                          line-clamp-2
                        ">
                          {product.name}
                        </h4>

                      </div>

                      <div className="
                        flex
                        justify-between
                        items-end
                        border-t
                        border-slate-100
                        pt-2
                      ">

                        <div>

                          <div className="
                            text-xs
                            font-black
                            text-slate-900
                          ">
                            ${product.price.toFixed(2)}
                          </div>

                          <div className="
                            text-[10px]
                            text-slate-400
                          ">
                            Bs.{' '}
                            {(
                              product.price *
                              exchangeRate
                            ).toFixed(2)}
                          </div>

                        </div>

                        <span
                          className={`
                            text-[10px]
                            font-bold
                            px-2
                            py-1
                            rounded-lg
                            ${
                              product.stock > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }
                          `}
                        >
                          Stock: {product.stock}
                        </span>

                      </div>

                    </div>

                  ))

                )}

              </div>

            </div>

            {/* =================================================
                CARRITO
            ================================================= */}

            <div className="
              bg-white
              border
              border-slate-200
              rounded-2xl
              p-5
              shadow-sm
              flex
              flex-col
              justify-between
              space-y-4
            ">

              <div className="space-y-4">

                {/* CABECERA CARRITO */}

                <div className="
                  flex
                  justify-between
                  items-center
                  border-b
                  border-slate-100
                  pb-3
                ">

                  <h3 className="
                    font-bold
                    text-slate-800
                    text-base
                  ">
                    🛒 Carrito Actual
                  </h3>

                  <span className="
                    text-xs
                    font-bold
                    bg-blue-50
                    text-blue-600
                    px-2.5
                    py-1
                    rounded-full
                  ">
                    {cart.reduce(
                      (acc, item) =>
                        acc + item.quantity,
                      0
                    )}{' '}
                    ítems
                  </span>

                </div>

                {/* =================================================
                    SELECTOR CLIENTE
                ================================================= */}

                <POSCustomerSelector
                  onSelectCustomer={(customer: any) => {

                    setClientName(
                      customer.name ||
                      ''
                    );

                    setClientDocument(
                      customer.document ||
                      customer.rif_ci ||
                      customer.rifCi ||
                      ''
                    );

                    setClientPhone(
                      customer.phone ||
                      ''
                    );

                  }}
                />

                {/* =================================================
                    LISTA CARRITO
                ================================================= */}

                <div className="
                  space-y-2
                  max-h-[300px]
                  overflow-y-auto
                  pr-1
                ">

                  {cart.length === 0 ? (

                    <div className="
                      text-center
                      py-10
                      text-slate-400
                      text-xs
                    ">
                      El carrito está vacío.
                      <br />
                      Haga clic en un producto
                      para agregarlo.
                    </div>

                  ) : (

                    cart.map((item) => (

                      <div
                        key={item.id}
                        className="
                          bg-slate-50
                          border
                          border-slate-200
                          rounded-xl
                          p-3
                          flex
                          justify-between
                          items-center
                          text-xs
                        "
                      >

                        <div className="
                          space-y-1
                          flex-1
                          pr-2
                        ">

                          <div className="
                            font-bold
                            text-slate-800
                            line-clamp-1
                          ">
                            {item.name}
                          </div>

                          <div className="
                            text-slate-500
                          ">
                            ${item.price.toFixed(2)} c/u
                          </div>

                        </div>

                        <div className="
                          flex
                          items-center
                          gap-2
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                -1
                              )
                            }
                            className="
                              w-6
                              h-6
                              bg-white
                              border
                              border-slate-300
                              rounded-md
                              font-bold
                              text-slate-700
                              hover:bg-slate-100
                            "
                          >
                            -
                          </button>

                          <span className="
                            font-bold
                            w-4
                            text-center
                          ">
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
                            className="
                              w-6
                              h-6
                              bg-white
                              border
                              border-slate-300
                              rounded-md
                              font-bold
                              text-slate-700
                              hover:bg-slate-100
                            "
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
                            className="
                              text-red-500
                              hover:text-red-700
                              font-bold
                              ml-1
                              px-1
                            "
                          >
                            ×
                          </button>

                        </div>

                      </div>

                    ))

                  )}

                </div>

              </div>

              {/* =================================================
                  TOTALES
              ================================================= */}

              <div className="
                border-t
                border-slate-100
                pt-4
                space-y-3
              ">

                <div className="
                  space-y-1
                  text-xs
                ">

                  <div className="
                    flex
                    justify-between
                    text-slate-600
                  ">
                    <span>
                      Subtotal:
                    </span>

                    <span>
                      ${subtotalUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="
                    flex
                    justify-between
                    text-slate-600
                  ">
                    <span>
                      IVA (16%):
                    </span>

                    <span>
                      ${ivaUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="
                    flex
                    justify-between
                    font-black
                    text-slate-900
                    text-sm
                    border-t
                    border-slate-100
                    pt-1
                  ">

                    <span>
                      Total USD:
                    </span>

                    <span className="text-blue-600">
                      ${totalUSD.toFixed(2)}
                    </span>

                  </div>

                  <div className="
                    flex
                    justify-between
                    font-bold
                    text-slate-500
                    text-xs
                  ">

                    <span>
                      Total Bs.:
                    </span>

                    <span>
                      Bs. {totalBs.toFixed(2)}
                    </span>

                  </div>

                </div>

                {/* BOTÓN PAGO */}

                <button
                  type="button"
                  disabled={
                    cart.length === 0
                  }
                  onClick={() =>
                    setIsCheckoutModalOpen(
                      true
                    )
                  }
                  className="
                    w-full
                    bg-blue-600
                    hover:bg-blue-500
                    disabled:opacity-50
                    text-white
                    font-bold
                    py-3
                    rounded-xl
                    text-xs
                    transition
                    shadow-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  Proceder al Pago ⚡
                </button>

              </div>

            </div>

          </div>

        )}

        {/* ======================================================
            PESTAÑA INVENTARIO
        ====================================================== */}

        {activeTab === 'inventory' && (

          <div className="space-y-6">

            {/* =================================================
                REGISTRAR PRODUCTO
            ================================================= */}

            <div className="
              bg-white
              border
              border-slate-200
              rounded-2xl
              p-6
              shadow-sm
              space-y-4
            ">

              <div className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                pb-3
              ">

                <div>

                  <h3 className="
                    text-lg
                    font-bold
                    text-slate-800
                  ">
                    📦 Registrar Nuevo Producto
                  </h3>

                  <p className="
                    text-xs
                    text-slate-400
                    mt-1
                  ">
                    Agregue productos al inventario
                    del sistema.
                  </p>

                </div>

              </div>

              <form
                onSubmit={async (e) => {

                  e.preventDefault();

                  if (
                    !newName ||
                    !newPrice ||
                    !newStock
                  ) {

                    alert(
                      'Complete los campos obligatorios.'
                    );

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
                          response =>
                            response.json()
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
                      'Error registrando producto:',
                      error
                    );

                    alert(
                      'Error de conexión al registrar el producto.'
                    );
                  }

                }}
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-6
                  gap-3
                "
              >

                {/* NOMBRE */}

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
                  className="
                    bg-slate-50
                    border
                    border-slate-300
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                {/* COSTO */}

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Costo ($)"
                  value={newCostPrice}
                  onChange={(e) =>
                    setNewCostPrice(
                      e.target.value
                    )
                  }
                  className="
                    bg-slate-50
                    border
                    border-slate-300
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                {/* PRECIO */}

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio Venta ($) *"
                  required
                  value={newPrice}
                  onChange={(e) =>
                    setNewPrice(
                      e.target.value
                    )
                  }
                  className="
                    bg-slate-50
                    border
                    border-slate-300
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                {/* CATEGORÍA */}

                <input
                  type="text"
                  placeholder="Categoría"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(
                      e.target.value
                    )
                  }
                  className="
                    bg-slate-50
                    border
                    border-slate-300
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                {/* STOCK */}

                <input
                  type="number"
                  min="0"
                  placeholder="Stock Inicial *"
                  required
                  value={newStock}
                  onChange={(e) =>
                    setNewStock(
                      e.target.value
                    )
                  }
                  className="
                    bg-slate-50
                    border
                    border-slate-300
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                {/* BOTÓN */}

                <button
                  type="submit"
                  className="
                    bg-blue-600
                    hover:bg-blue-500
                    text-white
                    font-bold
                    py-2
                    rounded-xl
                    text-xs
                    shadow-sm
                    transition
                  "
                >
                  Guardar Producto
                </button>

              </form>

            </div>

            {/* =================================================
                LISTADO INVENTARIO
            ================================================= */}

            <div className="
              bg-white
              border
              border-slate-200
              rounded-2xl
              p-6
              shadow-sm
              space-y-4
            ">

              <div className="
                flex
                flex-col
                sm:flex-row
                justify-between
                sm:items-center
                gap-3
                border-b
                border-slate-100
                pb-3
              ">

                <div>

                  <h3 className="
                    text-lg
                    font-bold
                    text-slate-800
                  ">
                    Listado de Inventario Actual
                  </h3>

                  <p className="
                    text-xs
                    text-slate-400
                    mt-1
                  ">
                    Controle existencias y reponga
                    productos rápidamente.
                  </p>

                </div>

                {/* FILTROS */}

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setInventoryFilterMode(
                        'all'
                      )
                    }
                    className={`
                      px-3
                      py-1.5
                      rounded-xl
                      text-xs
                      font-bold
                      ${
                        inventoryFilterMode ===
                        'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInventoryFilterMode(
                        'low'
                      )
                    }
                    className={`
                      px-3
                      py-1.5
                      rounded-xl
                      text-xs
                      font-bold
                      ${
                        inventoryFilterMode ===
                        'low'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    Stock Bajo (&lt;5)
                  </button>

                </div>

              </div>

              {/* TABLA */}

              <div className="overflow-x-auto">

                <table className="
                  w-full
                  text-left
                  border-collapse
                  text-xs
                ">

                  <thead>

                    <tr className="
                      border-b
                      border-slate-200
                      bg-slate-50
                      text-slate-600
                      uppercase
                    ">

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

                      <th className="
                        p-3
                        text-right
                      ">
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <tbody className="
                    divide-y
                    divide-slate-100
                  ">

                    {products.filter(
                      product =>
                        inventoryFilterMode ===
                          'all' ||
                        product.stock < 5
                    ).length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="
                            text-center
                            py-8
                            text-slate-400
                          "
                        >
                          No hay productos para
                          mostrar.
                        </td>

                      </tr>

                    ) : (

                      products
                        .filter(
                          product =>
                            inventoryFilterMode ===
                              'all' ||
                            product.stock < 5
                        )
                        .map((product) => (

                          <tr
                            key={product.id}
                            className="
                              hover:bg-slate-50
                            "
                          >

                            <td className="
                              p-3
                              font-bold
                              text-slate-800
                            ">
                              {product.name}
                            </td>

                            <td className="
                              p-3
                              text-slate-600
                            ">
                              {product.category}
                            </td>

                            <td className="
                              p-3
                              text-slate-600
                            ">
                              $
                              {product.price.toFixed(
                                2
                              )}
                            </td>

                            <td className="p-3">

                              <span
                                className={`
                                  font-bold
                                  px-2
                                  py-0.5
                                  rounded-md
                                  ${
                                    product.stock < 5
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }
                                `}
                              >
                                {product.stock}{' '}
                                unids.
                              </span>

                            </td>

                            <td className="
                              p-3
                              text-right
                            ">

                              <button
                                type="button"
                                onClick={() => {

                                  setSelectedProductForRestock(
                                    product
                                  );

                                  setRestockAmount(
                                    ''
                                  );

                                  setIsRestockModalOpen(
                                    true
                                  );

                                }}
                                className="
                                  bg-slate-100
                                  hover:bg-slate-200
                                  text-slate-700
                                  font-bold
                                  px-3
                                  py-1.5
                                  rounded-lg
                                  text-xs
                                "
                              >
                                Reponer Stock ➕
                              </button>

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

        {/* ======================================================
            PARTE 3 CONTINÚA AQUÍ
        ====================================================== */}
                {/* PESTAÑA: CLIENTES */}
        {activeTab === 'customers' && (
          <CustomersDirectoryModule />
        )}

        {/* PESTAÑA: ROLES Y PERMISOS */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <CashRegisterModule exchangeRate={exchangeRate} />
            <RolesManagerModule />
          </div>
        )}

      </main>

      {/* ============================================================
          MODAL DE CHECKOUT / PAGO
          ============================================================ */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                Finalizar Venta / Cobro
              </h3>

              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">

              {/* MÉTODO DE PAGO */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Método de Pago
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethodType)
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
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

              {/* EFECTIVO USD */}
              {paymentMethod === 'Efectivo USD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Efectivo Recibido ($)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cashGivenUSD}
                    onChange={(e) =>
                      setCashGivenUSD(e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />

                  {Number(cashGivenUSD) >= totalUSD && (
                    <div className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                      Cambio a devolver:

                      <strong className="block text-sm">
                        $
                        {(
                          Number(cashGivenUSD) - totalUSD
                        ).toFixed(2)}
                      </strong>

                      <span>
                        Bs.{' '}
                        {(
                          (Number(cashGivenUSD) - totalUSD) *
                          exchangeRate
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* INFORMACIÓN DEL CLIENTE PARA CRÉDITO */}
              {paymentMethod === 'Crédito / Fiado' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">

                  <div className="text-xs font-black text-amber-800">
                    👤 Información del Cliente
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-700 mb-1">
                      Nombre *
                    </label>

                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      value={clientName}
                      onChange={(e) =>
                        setClientName(e.target.value)
                      }
                      className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 mb-1">
                        Cédula / RIF
                      </label>

                      <input
                        type="text"
                        placeholder="V-12345678"
                        value={clientDocument}
                        onChange={(e) =>
                          setClientDocument(e.target.value)
                        }
                        className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 mb-1">
                        Teléfono
                      </label>

                      <input
                        type="text"
                        placeholder="0412..."
                        value={clientPhone}
                        onChange={(e) =>
                          setClientPhone(e.target.value)
                        }
                        className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* RESUMEN DE VENTA */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">

                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>
                    ${subtotalUSD.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>IVA (16%):</span>
                  <span>
                    ${ivaUSD.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-800">
                  <span>Total a Pagar:</span>

                  <span className="text-blue-600 text-sm">
                    ${totalUSD.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-slate-500">
                  <span>Total Bs.:</span>

                  <span>
                    Bs. {totalBs.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Tasa:</span>

                  <span>
                    {exchangeRate.toFixed(2)} Bs/$
                  </span>
                </div>

              </div>
            </div>

            {/* BOTONES */}
            <div className="flex gap-2 pt-2">

              <button
                onClick={() =>
                  setIsCheckoutModalOpen(false)
                }
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Completar Venta ✓
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          MODAL DE REPOSICIÓN DE STOCK
          ============================================================ */}
      {isRestockModalOpen &&
        selectedProductForRestock && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  📦 Reponer Stock
                </h3>

                <button
                  onClick={() => {
                    setIsRestockModalOpen(false);
                    setSelectedProductForRestock(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  ×
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">

                Producto:

                <strong className="text-slate-800 block">
                  {selectedProductForRestock.name}
                </strong>

                <span className="block mt-1">
                  Stock actual:{' '}
                  <strong>
                    {selectedProductForRestock.stock}
                  </strong>
                </span>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Cantidad a agregar
                </label>

                <input
                  type="number"
                  min="1"
                  placeholder="Cantidad a agregar *"
                  value={restockAmount}
                  onChange={(e) =>
                    setRestockAmount(e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* PREVISUALIZACIÓN */}
              {Number(restockAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">

                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Stock actual:
                    </span>

                    <strong>
                      {selectedProductForRestock.stock}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Agregar:
                    </span>

                    <strong className="text-blue-600">
                      +{Number(restockAmount)}
                    </strong>
                  </div>

                  <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between font-black text-slate-800">
                    <span>Nuevo stock:</span>

                    <span>
                      {selectedProductForRestock.stock +
                        Number(restockAmount)}
                    </span>
                  </div>

                </div>
              )}

              <div className="flex gap-2 pt-2">

                <button
                  onClick={() => {
                    setIsRestockModalOpen(false);
                    setSelectedProductForRestock(null);
                    setRestockAmount('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  onClick={async () => {

                    const addQty =
                      Number(restockAmount);

                    if (!addQty || addQty <= 0) {
                      alert(
                        'Ingrese una cantidad válida.'
                      );
                      return;
                    }

                    const newStockValue =
                      selectedProductForRestock.stock +
                      addQty;

                    try {

                      const res = await fetch(
                        '/api/products',
                        {
                          method: 'PUT',
                          headers: {
                            'Content-Type':
                              'application/json'
                          },
                          body: JSON.stringify({
                            id: selectedProductForRestock.id,
                            stock: newStockValue
                          })
                        }
                      );

                      const data =
                        await res.json();

                      if (data.success) {

                        setProducts(prev =>
                          prev.map(p =>
                            p.id ===
                            selectedProductForRestock.id
                              ? {
                                  ...p,
                                  stock:
                                    newStockValue
                                }
                              : p
                          )
                        );

                        alert(
                          '¡Stock actualizado con éxito!'
                        );

                        setIsRestockModalOpen(false);
                        setSelectedProductForRestock(null);
                        setRestockAmount('');

                      } else {

                        alert(
                          'Error al actualizar stock: ' +
                            (data.error || 'Error desconocido')
                        );

                      }

                    } catch (err) {

                      console.error(
                        'Error actualizando stock:',
                        err
                      );

                      alert(
                        'Error de conexión al actualizar el stock.'
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

      {/* ============================================================
          MODAL DE VENTA EXITOSA
          ============================================================ */}
      {successModalData?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">

            {/* ICONO */}
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>

            <h3 className="text-xl font-black text-slate-800">
              ¡Venta Exitosa!
            </h3>

            <p className="text-xs text-slate-500">
              La venta fue registrada correctamente.
            </p>

            {/* CLIENTE */}
            {successModalData.clientName && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">

                <div className="text-slate-400">
                  Cliente
                </div>

                <div className="font-bold text-slate-800">
                  {successModalData.clientName}
                </div>

              </div>
            )}

            {/* CRÉDITO */}
            {successModalData.isCredit && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">

                <strong>
                  💳 Venta a Crédito
                </strong>

                <div className="mt-1">
                  La deuda fue registrada en
                  Cuentas por Cobrar.
                </div>

              </div>
            )}

            {/* CAMBIO */}
            {successModalData.changeUSD > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">

                <div>
                  Cambio a entregar:
                </div>

                <strong className="text-lg">
                  $
                  {successModalData.changeUSD.toFixed(
                    2
                  )}
                </strong>

                <div className="font-bold">
                  Bs.{' '}
                  {successModalData.changeBs.toFixed(
                    2
                  )}
                </div>

              </div>
            )}

            {/* ACCIONES */}
            <div className="flex flex-col gap-2 pt-2">

              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                🖨️ Imprimir Recibo
              </button>

              <button
                onClick={() =>
                  setSuccessModalData(null)
                }
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                ⚡ Continuar Vendiendo
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          RECIBO PARA IMPRESIÓN
          ============================================================ */}

      {lastPrintedSale && (
        <div className="hidden print:block">
          <ReceiptTicket sale={lastPrintedSale} />
        </div>
      )}

      {/* ============================================================
          ESTILOS DE IMPRESIÓN
          ============================================================ */}

      <style jsx global>{`
        @media print {

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }

          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          @page {
            margin: 0;
            size: 80mm auto;
          }

        }
      `}</style>

    </div>
  );
}
