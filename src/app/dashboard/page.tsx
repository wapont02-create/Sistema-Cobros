// src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import RoleSelector from '@/components/RoleSelector';
import { hasPermission } from '@/utils/permissions';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<{ role: string }>({ role: 'admin' });
  const [activeTab, setActiveTab] = useState('pos');

  // Sincronizar el usuario actual guardado en localStorage al cargar la página
  useEffect(() => {
    const saved = localStorage.getItem('pos_current_user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      
      // Si el rol actual no tiene permiso para la pestaña activa, lo redirigimos al POS por seguridad
      if (!hasPermission(user.role, 'view_' + (activeTab === 'pos' ? 'pos' : activeTab))) {
        setActiveTab('pos');
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col gap-6">
      
      {/* Cabecera del Dashboard con el Selector de Roles */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            SYSTEM <span className="text-cyan-400">POS</span>
          </h1>
          <p className="text-xs text-slate-400">Panel de Control Enterprise - Venezuela</p>
        </div>
        <RoleSelector onUserChange={(user: any) => setCurrentUser(user)} />
      </header>

      {/* Menú de Navegación Dinámico según el Rol */}
      <nav className="flex flex-wrap gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        
        {/* Caja POS - Disponible para Admin y Cajero */}
        {hasPermission(currentUser.role, 'view_pos') && (
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

        {/* Inventario - Disponible para Admin y Almacenista */}
        {hasPermission(currentUser.role, 'view_inventory') && (
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

        {/* Cuentas por Cobrar - Solo Admin */}
        {hasPermission(currentUser.role, 'view_receivable') && (
          <button
            onClick={() => setActiveTab('receivable')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'receivable' 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📋 Cuentas por Cobrar
          </button>
        )}

        {/* Reportes y Cierre Z - Solo Admin */}
        {hasPermission(currentUser.role, 'view_reports') && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'reports' 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 Reportes y Cierre Z
          </button>
        )}
      </nav>

      {/* Contenido Dinámico de la Pestaña Activa */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1">
        
        {activeTab === 'pos' && hasPermission(currentUser.role, 'view_pos') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Terminal de Caja</h2>
            <p className="text-sm text-slate-400">Aquí opera el cajero para procesar las ventas y cobros múltiples.</p>
          </div>
        )}

        {activeTab === 'inventory' && hasPermission(currentUser.role, 'view_inventory') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Gestión de Inventario</h2>
            <p className="text-sm text-slate-400">Control de productos, precios y stock.</p>
            {!hasPermission(currentUser.role, 'edit_inventory') && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm">
                ⚠️ Estás en modo visualización. Tu rol actual no permite modificar precios ni eliminar productos.
              </div>
            )}
          </div>
        )}

        {activeTab === 'receivable' && hasPermission(currentUser.role, 'view_receivable') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Cuentas por Cobrar (Fiados)</h2>
            <p className="text-sm text-slate-400">Administración de créditos y abonos de clientes.</p>
          </div>
        )}

        {activeTab === 'reports' && hasPermission(currentUser.role, 'view_reports') && (
          <div>
            <h2 className="text-xl font-bold mb-2">Reportes Financieros y Cierre de Caja</h2>
            <p className="text-sm text-slate-400">Auditoría global de ingresos y cierre Z.</p>
          </div>
        )}

      </section>

    </main>
  );
}
