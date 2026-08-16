// src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import RoleSelector from '@/components/RoleSelector';
import RolesManagerModule from '@/components/RolesManagerModule';
import { hasPermission } from '@/utils/rolesManager';

export default function DashboardPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  const [activeTab, setActiveTab] = useState<string>('pos');

  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role) {
          setCurrentUserRole(parsed.role);
        }
      } catch (e) {
        console.error('Error al leer el usuario actual', e);
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col gap-6">
      
      {/* Cabecera Principal - Sincronizada con tu barra superior */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl md:text-2xl font-black tracking-wider text-white">
            ⚡ <span className="text-cyan-400">POS Enterprise Venezuela</span>
          </h1>
          
          {/* Menú de Navegación Superior */}
          <nav className="hidden md:flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            {hasPermission(currentUserRole, 'view_pos') && (
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'pos' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🛒 Caja POS
              </button>
            )}

            {hasPermission(currentUserRole, 'view_inventory') && (
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'inventory' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                📦 Inventario
              </button>
            )}

            {hasPermission(currentUserRole, 'view_receivable') && (
              <button
                onClick={() => setActiveTab('receivable')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'receivable' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                📋 Cuentas x Cobrar
              </button>
            )}

            {hasPermission(currentUserRole, 'view_reports') && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'reports' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                📊 Reportes Z
              </button>
            )}

            {hasPermission(currentUserRole, 'manage_roles') && (
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'roles' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🛡️ Roles y Personal
              </button>
            )}
          </nav>
        </div>

        {/* Zona Superior Derecha: Tasa BCV y el Selector de Roles Interactivo */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow">
            <span className="text-slate-400">Tasa BCV (Bs/$):</span> 
            <strong className="text-white font-mono">778,33</strong>
          </div>

          {/* Componente Selector de Roles (Reemplaza el texto estático de Cajero) */}
          <RoleSelector onUserChange={(user: any) => {
            if (user && user.role) {
              setCurrentUserRole(user.role);
            }
          }} />
        </div>
      </header>

      {/* Navegación para dispositivos móviles */}
      <div className="flex md:hidden flex-wrap gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
        {hasPermission(currentUserRole, 'view_pos') && (
          <button onClick={() => setActiveTab('pos')} className={`px-3 py-1 rounded text-xs ${activeTab === 'pos' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}>Caja POS</button>
        )}
        {hasPermission(currentUserRole, 'view_inventory') && (
          <button onClick={() => setActiveTab('inventory')} className={`px-3 py-1 rounded text-xs ${activeTab === 'inventory' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}>Inventario</button>
        )}
        {hasPermission(currentUserRole, 'view_receivable') && (
          <button onClick={() => setActiveTab('receivable')} className={`px-3 py-1 rounded text-xs ${activeTab === 'receivable' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}>Cuentas x Cobrar</button>
        )}
        {hasPermission(currentUserRole, 'view_reports') && (
          <button onClick={() => setActiveTab('reports')} className={`px-3 py-1 rounded text-xs ${activeTab === 'reports' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}>Reportes Z</button>
        )}
        {hasPermission(currentUserRole, 'manage_roles') && (
          <button onClick={() => setActiveTab('roles')} className={`px-3 py-1 rounded text-xs ${activeTab === 'roles' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}>Roles</button>
        )}
      </div>

      {/* Contenido Dinámico de las Pestañas */}
      <section className="flex-1">
        {activeTab === 'pos' && hasPermission(currentUserRole, 'view_pos') && (
          /* Aquí va tu estructura actual de la Caja POS que se ve en la imagen */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Izquierdo: Buscador y Productos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input 
                  type="text" 
                  placeholder="Buscar producto por nombre..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Grid de productos de ejemplo como los de tu captura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cyan-400 font-semibold uppercase">Bebidas</span>
                    <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">IVA 16%</span>
                  </div>
                  <h3 className="font-bold text-white">Café Americano</h3>
                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <p className="text-lg font-black text-white">$2.50</p>
                      <p className="text-xs text-slate-400">Bs. 1945.83</p>
                    </div>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Stk: 41</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cyan-400 font-semibold uppercase">Pasapalos</span>
                    <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">IVA 16%</span>
                  </div>
                  <h3 className="font-bold text-white">Tequeños (6 unid.)</h3>
                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <p className="text-lg font-black text-white">$5.00</p>
                      <p className="text-xs text-slate-400">Bs. 3891.65</p>
                    </div>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Stk: 10</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cyan-400 font-semibold uppercase">Comida</span>
                    <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">IVA 16%</span>
                  </div>
                  <h3 className="font-bold text-white">Hamburguesa Clásica</h3>
                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <p className="text-lg font-black text-white">$8.50</p>
                      <p className="text-xs text-slate-400">Bs. 6615.81</p>
                    </div>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Stk: 9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Derecho: Ticket de Venta */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[500px]">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <h3 className="font-bold text-white">Ticket de Venta</h3>
                  <span className="text-xs text-slate-400">0 items</span>
                </div>
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                  No hay productos en el ticket.
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IVA (16%):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                    <span>Total a Pagar:</span>
                    <div className="text-right">
                      <div className="text-cyan-400">$0.00</div>
                      <div className="text-xs text-slate-400 font-normal">Bs. 0.00</div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm">
                  Procesar Venta 💳
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && hasPermission(currentUserRole, 'view_inventory') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Módulo de Inventario</h2>
            <p className="text-sm text-slate-400">Control de stock y precios de productos.</p>
            {!hasPermission(currentUserRole, 'edit_inventory') && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm">
                ⚠️ Estás operando en modo lectura (Almacenista). No puedes modificar precios ni eliminar productos.
              </div>
            )}
          </div>
        )}

        {activeTab === 'receivable' && hasPermission(currentUserRole, 'view_receivable') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Cuentas por Cobrar (Fiados)</h2>
            <p className="text-sm text-slate-400">Gestión de créditos de clientes.</p>
          </div>
        )}

        {activeTab === 'reports' && hasPermission(currentUserRole, 'view_reports') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Reportes y Cierre de Caja (Z) Detallado</h2>
            <p className="text-sm text-slate-400">Auditoría global de ingresos y cierre fiscal.</p>
          </div>
        )}

        {activeTab === 'roles' && hasPermission(currentUserRole, 'manage_roles') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <RolesManagerModule />
          </div>
        )}
      </section>

    </main>
  );
}
