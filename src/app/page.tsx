'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(true);

  // Efecto para aplicar o remover la clase 'dark' en el documento raíz
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-blue-500 selection:text-white transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Barra de navegación */}
      <header className={`max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b transition-colors duration-300 ${darkMode ? 'border-slate-900' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-500 tracking-wider">⚡ POS Enterprise Cloud</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Botón de Modo Claro / Oscuro */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl text-sm font-semibold transition border ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'}`}
            title="Cambiar Modo Claro / Oscuro"
          >
            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>

          <Link 
            href="/dashboard"
            className="text-sm font-medium transition hidden sm:inline-block opacity-80 hover:opacity-100"
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
          🇻🇪 La solución integral en la nube para comercios modernos en Venezuela
        </span>
        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl">
          Punto de Venta Multi-Moneda, Control Total y <span className="text-blue-500">Presencia Web Corporativa</span>
        </h1>
        <p className={`text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Gestiona ventas en dólares y bolívares con tasa BCV automática, adapta todos los métodos de pago del país, controla accesos por roles y potencia tu negocio con una página web profesional.
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
            <h2 className="text-3xl font-bold tracking-tight mb-3">Todo lo que tu negocio necesita en una sola plataforma</h2>
            <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Herramientas potentes diseñadas específicamente para el mercado venezolano actual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">💱</div>
              <div className="text-blue-500 font-bold text-xl mb-2">Multi-Moneda & Tasa BCV</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Conversión automática y exacta entre Dólares ($) y Bolívares (Bs.) utilizando la tasa oficial del BCV en tiempo real.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">📱</div>
              <div className="text-blue-500 font-bold text-xl mb-2">Medios de Pago de Venezuela</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Procesa cobros fácilmente en Efectivo USD, Pago Móvil, Zelle, Binance Pay y lleva el control de créditos (Fiados).</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">🛡️</div>
              <div className="text-blue-500 font-bold text-xl mb-2">Roles y Permisos de Personal</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Asigna perfiles seguros (Cajero, Administrador, Almacenista) limitando el acceso a reportes y ajustes críticos.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">🌐</div>
              <div className="text-blue-500 font-bold text-xl mb-2">Página Web Corporativa</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Brindamos a tu negocio mayor presencia digital con una página web optimizada para atraer clientes y destacar tu marca.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">📦</div>
              <div className="text-blue-500 font-bold text-xl mb-2">Inventario Inteligente</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Stock actualizado al instante por cada ticket, alertas de stock bajo y gestión de cuentas por pagar a proveedores.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">📊</div>
              <div className="text-blue-500 font-bold text-xl mb-2">Cierres de Caja y Reportes Z</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Auditoría detallada de ingresos por método de pago, control de IVA (16%) y reportes listos para exportar.</p>
            </div>
          </div>
        </div>

        {/* Sección de Beneficios Adicionales / Por qué elegirnos */}
        <div className={`w-full border rounded-3xl p-8 sm:p-12 mb-20 text-left grid grid-cols-1 lg:grid-cols-2 gap-10 items-center transition-colors duration-300 ${darkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div>
            <span className="text-blue-500 text-xs font-semibold uppercase tracking-wider">Crecimiento digital completo</span>
            <h3 className="text-2xl sm:text-3xl font-bold mt-2 mb-4">Lleva tu punto de venta y tu presencia en internet al siguiente nivel</h3>
            <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No solo digitalizamos tu caja registradora en la nube, sino que integramos la identidad corporativa que tu negocio merece para destacar frente a la competencia.
            </p>
            <ul className={`space-y-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-center gap-2">✅ Soporte multi-moneda adaptado a la normativa local</li>
              <li className="flex items-center gap-2">✅ Seguridad de datos respaldada en la nube (SQLite Cloud)</li>
              <li className="flex items-center gap-2">✅ Acceso desde computadoras, tablets o teléfonos móviles</li>
            </ul>
          </div>
          <div className={`border p-8 rounded-2xl text-center space-y-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-blue-500 font-black text-5xl">100%</div>
            <div className="text-lg font-semibold">Adaptado al comercio venezolano</div>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Diseñado para simplificar la facturación mixta (Dólares y Bolívares) sin errores ni retrasos.</p>
          </div>
        </div>

        {/* Llamado a la acción final */}
        <div className={`text-center border rounded-3xl p-10 w-full transition-colors duration-300 ${darkMode ? 'bg-gradient-to-r from-blue-900/20 via-slate-900 to-blue-900/20 border-blue-500/20' : 'bg-blue-50 border-blue-200 shadow-md'}`}>
          <h3 className="text-2xl sm:text-4xl font-bold mb-4">¿Listo para transformar tu negocio?</h3>
          <p className={`text-sm sm:text-base max-w-xl mx-auto mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Optimiza tus cobros, controla a tu personal y dale a tu marca la presencia corporativa que se merece.
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
      <footer className={`border-t py-8 text-center text-sm transition-colors duration-300 ${darkMode ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
        <p>Sistema POS Enterprise & Soluciones Corporativas • Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
