import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Barra de navegación */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-400">⚡ POS Cloud</span>
        </div>
        <Link 
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-blue-600/30"
        >
          Entrar al Sistema
        </Link>
      </header>

      {/* Hero Principal */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex flex-col items-center">
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6">
          La solución en la nube diseñada para comercios
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          El Punto de Venta más rápido <span className="text-blue-400">para tu negocio</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10">
          Gestiona tu inventario, procesa ventas en segundos y lleva el control total de tu caja desde cualquier dispositivo con sincronización en tiempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition shadow-xl shadow-blue-600/30"
          >
            Iniciar Punto de Venta
          </Link>
        </div>

        {/* Características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl">
            <div className="text-blue-400 font-bold text-xl mb-2">⚡ Ventas Rápidas</div>
            <p className="text-slate-400 text-sm">Procesa pagos y calcula vueltos al instante con una interfaz optimizada para agilizar la caja.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl">
            <div className="text-blue-400 font-bold text-xl mb-2">📦 Inventario Real</div>
            <p className="text-slate-400 text-sm">Control total de tu stock actualizado automáticamente cada vez que realizas una transacción.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl">
            <div className="text-blue-400 font-bold text-xl mb-2">☁️ Cloud Sync</div>
            <p className="text-slate-400 text-sm">Tus datos seguros, sincronizados y respaldados en la nube gracias a SQLite Cloud.</p>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        Sistema de Cobros y Ventas • Todos los derechos reservados.
      </footer>
    </div>
  );
}
