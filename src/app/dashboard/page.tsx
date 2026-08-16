'use client';
import { useState } from 'react';

export default function DashboardPOS() {
  // Estado básico para simular una venta
  const [total, setTotal] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      {/* Header del Dashboard */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">Terminal POS</h1>
        <div className="bg-slate-900 px-4 py-2 rounded-lg text-sm text-slate-400 border border-slate-800">
          Caja abierta: <span className="text-emerald-400 font-bold">Activa</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sección de Productos */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Productos Disponibles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['Café', 'Pan', 'Leche', 'Azúcar', 'Arroz', 'Harina'].map((item) => (
              <button 
                key={item}
                onClick={() => setTotal(prev => prev + 10)} // Simulación de precio
                className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition text-center"
              >
                <div className="text-xl mb-1">🛒</div>
                <div className="font-medium">{item}</div>
                <div className="text-blue-400 text-sm">$10.00</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sección de Ticket de Venta */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Ticket de Venta</h2>
          <div className="h-64 bg-slate-950 rounded-xl mb-4 p-4 border border-slate-800 overflow-y-auto">
            {total === 0 && <p className="text-slate-600 text-sm text-center mt-10">El carrito está vacío</p>}
            {total > 0 && <p className="text-blue-400 font-bold">Total acumulado: ${total.toFixed(2)}</p>}
          </div>
          
          <button 
            onClick={() => setTotal(0)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            Procesar Pago
          </button>
        </div>
      </main>
    </div>
  );
}
