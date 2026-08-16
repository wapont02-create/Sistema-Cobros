export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
          El Punto de Venta más rápido para tu negocio
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Gestiona tu inventario, ventas y reportes en tiempo real. La solución en la nube diseñada para comercios en Venezuela.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition">
            Entrar al Punto de Venta
          </a>
          <a href="#contacto" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition">
            Solicitar Demostración
          </a>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-white px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-bold text-xl mb-2">Ventas Rápidas</h3>
            <p className="text-gray-600">Procesa pagos en segundos con nuestra interfaz optimizada.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-bold text-xl mb-2">Inventario Real</h3>
            <p className="text-gray-600">Control total de tu stock desde cualquier dispositivo.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-bold text-xl mb-2">Cloud Sync</h3>
            <p className="text-gray-600">Tus datos seguros y sincronizados con SQLite Cloud.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
