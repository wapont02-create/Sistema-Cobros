'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando sesión con:", email);
    router.push('/dashboard');
  };

  // Función para rellenar automáticamente las credenciales de prueba con un clic
  const fillDemoCredentials = () => {
    setEmail('demo@posenterprise.ve');
    setPassword('Demo1234*');
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Barra superior con selector de modo y botón para volver al inicio */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-black text-blue-600 tracking-wider">
          ⚡ POS Enterprise Venezuela
        </Link>
        
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2.5 rounded-xl text-sm font-semibold transition border ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'}`}
          title="Cambiar Modo Claro / Oscuro"
        >
          {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </header>

      {/* Contenedor del Login */}
      <main className="flex items-center justify-center p-6 flex-grow">
        <div className={`w-full max-w-md p-8 rounded-3xl border transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-blue-950/20' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Acceso a la Nube
            </span>
            <h1 className="text-3xl font-extrabold mt-3 mb-2">Bienvenido</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Ingresa a tu Terminal POS Enterprise
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Correo electrónico
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                placeholder="nombre@empresa.com"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Contraseña
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition mt-4 shadow-lg shadow-blue-600/20"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Credenciales de Demostración para Clientes */}
          <div className={`mt-8 p-4 rounded-2xl border text-center transition-colors ${darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-blue-50/50 border-blue-100'}`}>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              🚀 Acceso Rápido de Demostración
            </p>
            <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Usa estos datos para probar el sistema:
            </p>
            <div className={`text-xs font-mono p-2.5 rounded-xl mb-3 text-left border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <div><strong className="text-blue-500">Usuario:</strong> demo@posenterprise.ve</div>
              <div><strong className="text-blue-500">Clave:</strong> Demo1234*</div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 border border-blue-500/30 w-full py-2 rounded-lg transition"
            >
              Rellenar datos de prueba automáticamente
            </button>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-blue-600 hover:underline font-medium">
              ← Volver a la página principal
            </Link>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className={`py-6 text-center text-xs transition-colors duration-300 ${darkMode ? 'text-slate-500 border-t border-slate-900' : 'text-slate-500 border-t border-slate-200'}`}>
        <p>POS Enterprise Venezuela • Sistema en la Nube</p>
      </footer>
    </div>
  );
}
