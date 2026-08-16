import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Barra de navegación */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-400 tracking-wider">⚡ POS Cloud</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="text-sm font-medium text-slate-300 hover:text-white transition hidden sm:inline-block"
          >
            Ver demo
          </Link>
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-blue-600/30"
          >
            Entrar al Sistema
          </Link>
        </div>
      </header>

      {/* Hero Principal */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center flex flex-col items-center">
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6">
          🚀 La solución en la nube diseñada para comercios modernos
        </span>
        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl">
          El Punto de Venta más rápido y seguro <span className="text-blue-400">para tu negocio</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
          Gestiona tu inventario, procesa ventas en segundos, calcula vueltos al instante y lleva el control total de tu caja desde cualquier dispositivo con sincronización en tiempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-20">
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition shadow-xl shadow-blue-600/30"
          >
            Iniciar Punto de Venta Ahora
          </Link>
        </div>

        {/* Características Principales */}
        <div className="w-full text-left mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Todo lo que necesitas para vender más</h2>
            <p className="text-slate-400">Herramientas potentes diseñadas para agilizar la operación diaria de tu local.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition">
              <div className="text-3xl mb-4">⚡</div>
              <div className="text-blue-400 font-bold text-xl mb-2">Ventas Ultrarápidas</div>
              <p className="text-slate-400 text-sm leading-relaxed">Procesa cobros de forma fluida, busca productos al vuelo y evita filas largas en tu caja.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition">
              <div className="text-3xl mb-4">📦</div>
              <div className="text-blue-400 font-bold text-xl mb-2">Control de Inventario</div>
              <p className="text-slate-400 text-sm leading-relaxed">Stock actualizado automáticamente en tiempo real con cada ticket de venta generado.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition">
              <div className="text-3xl mb-4">☁️</div>
              <div className="text-blue-400 font-bold text-xl mb-2">Seguridad en la Nube</div>
              <p className="text-slate-400 text-sm leading-relaxed">Tus datos financieros respaldados y protegidos con la tecnología avanzada de SQLite Cloud.</p>
            </div>
          </div>
        </div>

        {/* Sección de Beneficios Adicionales / Por qué elegirnos */}
        <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 mb-20 text-left grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Sin complicaciones</span>
            <h3 className="text-2xl sm:text-3xl font-bold mt-2 mb-4">Opera desde cualquier dispositivo, sin descargas pesadas</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Al estar alojado 100% en la nube, puedes acceder desde tu computadora, tablet o teléfono celular. No requieres servidores costosos ni configuraciones técnicas difíciles.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">✅ Compatible con lectores de códigos de barra</li>
              <li className="flex items-center gap-2">✅ Reportes de caja claros y transparentes</li>
              <li className="flex items-center gap-2">✅ Interfaz intuitiva que no requiere capacitación previa</li>
            </ul>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center">
            <div className="text-blue-400 font-black text-5xl mb-2">100%</div>
            <div className="text-lg font-semibold mb-1">Optimizado para comercios</div>
            <p className="text-slate-500 text-xs">Diseñado para maximizar la velocidad de atención al cliente.</p>
          </div>
        </div>

        {/* Llamado a la acción final */}
        <div className="text-center bg-gradient-to-r from-blue-900/20 via-slate-900 to-blue-900/20 border border-blue-500/20 rounded-3xl p-10 w-full">
          <h3 className="text-2xl sm:text-4xl font-bold mb-4">¿Listo para transformar tu negocio?</h3>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Únete a los comercios que ya están optimizando su tiempo y aumentando sus ventas diarias.
          </p>
          <Link 
            href="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-base transition shadow-xl shadow-blue-600/30"
          >
            Entrar al Sistema Ahora
          </Link>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-900 py-8 text-center text-slate-500 text-sm">
        <p>Sistema de Cobros y Ventas • Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
