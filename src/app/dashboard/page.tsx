// src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import RoleSelector from '../../components/RoleSelector';
import RolesManagerModule from '../../components/RolesManagerModule';
import { hasPermission } from '../../utils/rolesManager';

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
      
      {/* Cabecera Principal */}
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

          {/* Componente Selector de Roles */}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <input 
                type="text" 
                placeholder="Buscar producto por nombre..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
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
              </div>
            </div>

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
