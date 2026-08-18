<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS Enterprise Venezuela</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#eff6ff',
                            500: '#3b82f6',
                            600: '#2563eb',
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-100/70 text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- HEADER / NAVEGACIÓN -->
    <header class="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center space-x-3">
            <span class="text-2xl">⚡</span>
            <h1 class="text-xl font-extrabold text-blue-600 tracking-tight">POS Enterprise <span class="text-slate-700 font-medium">Venezuela</span></h1>
        </div>
        
        <!-- Menú de Navegación superior -->
        <nav class="hidden md:flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm transition">
                <span>🛒</span><span>Caja POS</span>
            </button>
            <button class="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg font-medium transition">
                <span>📦</span><span>Inventario</span>
            </button>
            <button class="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg font-medium transition">
                <span>💳</span><span>Cuentas (Cobrar/Pagar)</span>
            </button>
            <button class="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg font-medium transition">
                <span>📊</span><span>Reportes Z</span>
            </button>
        </nav>

        <!-- Perfil y Modo Oscuro -->
        <div class="flex items-center space-x-4">
            <button class="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition">
                <span>🌙</span>
                <span>Modo Oscuro</span>
            </button>
            <div class="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">A</div>
                <div class="text-xs">
                    <p class="font-bold text-slate-800">Ana Administradora</p>
                    <p class="text-blue-600 font-semibold tracking-wider">ROL: ADMINISTRADOR</p>
                </div>
            </div>
        </div>
    </header>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="flex-1 p-6 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- SECCIÓN IZQUIERDA: Catálogo y Búsqueda (7 columnas) -->
        <section class="lg:col-span-7 flex flex-col space-y-5">
            
            <!-- Barra de Búsqueda y Filtros -->
            <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div class="relative w-full">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">🔍</span>
                    <input type="text" placeholder="Buscar producto por nombre..." class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm">
                </div>
                <div class="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-sm shadow-blue-500/20">Todos</button>
                    <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition">General</button>
                    <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition">Comida</button>
                </div>
            </div>

            <!-- Grilla de Productos con Sombras y Bordes Refinados -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                <!-- Tarjeta Producto 1 -->
                <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">General</span>
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-100">IVA 16%</span>
                        </div>
                        <h3 class="font-bold text-slate-800 text-sm mb-1 leading-snug">Harina P.A.N. 1kg</h3>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                        <div>
                            <span class="text-lg font-extrabold text-blue-600">$1.50</span>
                            <p class="text-[11px] text-slate-400 font-medium">Bs. 1164.00</p>
                        </div>
                        <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/60">Stk: 50</span>
                    </div>
                </div>

                <!-- Tarjeta Producto 2 -->
                <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">General</span>
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-100">IVA 16%</span>
                        </div>
                        <h3 class="font-bold text-slate-800 text-sm mb-1 leading-snug">Café Impresso 200g</h3>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                        <div>
                            <span class="text-lg font-extrabold text-blue-600">$4.20</span>
                            <p class="text-[11px] text-slate-400 font-medium">Bs. 3259.20</p>
                        </div>
                        <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/60">Stk: 25</span>
                    </div>
                </div>

                <!-- Tarjeta Producto 3 -->
                <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">General</span>
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-100">IVA 16%</span>
                        </div>
                        <h3 class="font-bold text-slate-800 text-sm mb-1 leading-snug">Aceite Vatel 1L</h3>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                        <div>
                            <span class="text-lg font-extrabold text-blue-600">$2.80</span>
                            <p class="text-[11px] text-slate-400 font-medium">Bs. 2172.80</p>
                        </div>
                        <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/60">Stk: 40</span>
                    </div>
                </div>

                <!-- Tarjeta Producto 4 -->
                <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="px-2.5 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-sky-100">Comida</span>
                            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100">Exento</span>
                        </div>
                        <h3 class="font-bold text-slate-800 text-sm mb-1 leading-snug">Huevos</h3>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                        <div>
                            <span class="text-lg font-extrabold text-blue-600">$5.00</span>
                            <p class="text-[11px] text-slate-400 font-medium">Bs. 3880.00</p>
                        </div>
                        <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/60">Stk: 30</span>
                    </div>
                </div>

            </div>
        </section>

        <!-- SECCIÓN DERECHA: Ticket de Venta (5 columnas) -->
        <section class="lg:col-span-5 flex flex-col">
            <div class="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] flex flex-col h-full justify-between">
                
                <!-- Encabezado del Ticket -->
                <div>
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                        <h2 class="text-lg font-extrabold text-slate-800">Ticket de Venta</h2>
                        <span class="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">0 items</span>
                    </div>

                    <!-- Estado Vacío -->
                    <div class="py-24 text-center">
                        <p class="text-sm font-medium text-slate-400">No hay productos en el ticket.</p>
                    </div>
                </div>

                <!-- Totales y Botón de Pago -->
                <div class="mt-auto space-y-4 pt-4 border-t border-slate-100">
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span class="font-semibold text-slate-700">$0.00</span>
                        </div>
                        <div class="flex justify-between text-slate-500">
                            <span>IVA (16%):</span>
                            <span class="font-semibold text-slate-700">$0.00</span>
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t border-slate-100 text-base">
                            <span class="font-bold text-slate-800">Total a Pagar:</span>
                            <div class="text-right">
                                <span class="text-xl font-extrabold text-blue-600">$0.00</span>
                                <p class="text-xs font-bold text-emerald-600">Bs. 0.00</p>
                            </div>
                        </div>
                    </div>

                    <button class="w-full py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-sm tracking-wide cursor-not-allowed border border-slate-200/60 shadow-inner transition">
                        Procesar Venta
                    </button>
                </div>

            </div>
        </section>

    </main>

</body>
</html>
