// src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import RoleSelector from '@/components/RoleSelector';
import { hasPermission } from '@/utils/permissions';

export default function DashboardPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  const [activeTab, setActiveTab] = useState<string>('pos');

  // Cargar el rol actual desde localStorage al montar el componente
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role) {
          setCurrentUserRole(parsed.role);
          
          // Verificar si el rol actual tiene permiso para la pestaña activa, si no, redirigir a 'pos' o la primera disponible
          const tabPermissionMap: Record<string, string> = {
            pos: 'view_pos',
            inventory: 'view_inventory',
            receivable: 'view_receivable',
            reports: 'view_reports'
          };

          const requiredPerm = tabPermissionMap[activeTab] || 'view_pos';
          if (!hasPermission(parsed.role, requiredPerm)) {
            setActiveTab('pos');
          }
        }
      } catch (e) {
        console.error('Error al leer el usuario actual', e);
      }
    }
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col gap-6">
      
      {/* Cabecera Principal */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            POS <span className="text-cyan-400">Enterprise Venezuela</span>
          </h1>
          <p className="text-xs text-slate-400">Sistema comercial adaptado para comercios locales</p>
        </div>

        {/* Zona Superior Derecha: Indicador de Tasa BCV y Selector de Roles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg">
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

      {/* Menú de Navegación Dinámico según el Rol */}
      <nav className="flex flex-wrap gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 items-center">
        {hasPermission(currentUserRole, 'view_pos') && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pos' 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🛒 Caja POS
          </button>
        )}

        {hasPermission(currentUserRole, 'view_inventory') && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'inventory' 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📦 Inventario
          </button>
        )}

        {hasPermission(currentUserRole, 'view_receivable') && (
          <button
            onClick={() => setActiveTab('receivable')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'receivable' 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📋 Cuentas x Cobrar
          </button>
        )}

        {hasPermission(currentUserRole, 'view_reports') && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'reports' 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 Reportes Z
          </button>
        )}
      </nav>

      {/* Contenido Dinámico de las Pestañas */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1">
        
        {activeTab === 'pos' && hasPermission(currentUserRole, 'view_pos') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Terminal de Caja POS</h2>
            <p className="text-sm text-slate-400 mb-4">Interfaz de cobros, multimoneda y procesamiento rápido de ventas.</p>
          </div>
        )}

        {activeTab === 'inventory' && hasPermission(currentUserRole, 'view_inventory') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Gestión de Inventario</h2>
            <p className="text-sm text-slate-400 mb-4">Control de productos, costos, márgenes y existencias en tiempo real.</p>
            {!hasPermission(currentUserRole, 'edit_inventory') && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm">
                ⚠️ Estás operando en modo lectura. Tu rol actual no permite modificar precios ni eliminar registros del inventario.
              </div>
            )}
          </div>
        )}

        {activeTab === 'receivable' && hasPermission(currentUserRole, 'view_receivable') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Cuentas por Cobrar (Fiados / Apartados)</h2>
            <p className="text-sm text-slate-400 mb-4">Seguimiento detallado de créditos pendientes y abonos de clientes.</p>
          </div>
        )}

        {activeTab === 'reports' && hasPermission(currentUserRole, 'view_reports') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Reportes y Cierre de Caja (Z) Detallado</h2>
            <p className="text-sm text-slate-400 mb-4">Auditoría global de ingresos por método de pago y control de IVA.</p>
          </div>
        )}

      </section>

    </main>
  );
}
