import './globals.css'
import type { Metadata } from 'node_modules/@types/react' // O importar de 'react' segun prefieras

export const metadata: Metadata = {
  title: 'Sistema de Cobros POS',
  description: 'Punto de venta y control de inventario',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
