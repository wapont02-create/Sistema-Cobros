import { NextResponse } from 'next/server';
import { db } from '@/db/client';

// Consultar si hay una caja abierta actualmente
export async function GET() {
  try {
    const result = await db.execute("SELECT * FROM cash_registers WHERE status = 'open' ORDER BY id DESC LIMIT 1");
    if (result.rows.length === 0) {
      return NextResponse.json({ isOpen: false });
    }
    return NextResponse.json({ isOpen: true, register: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Error al verificar el estado de la caja' }, { status: 500 });
  }
}

// Abrir caja o Cerrar caja
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, opening_usd, opening_ves, closing_usd, closing_ves, register_id } = body;

    if (action === 'open') {
      // Verificar si ya hay una abierta
      const active = await db.execute("SELECT id FROM cash_registers WHERE status = 'open'");
      if (active.rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe una caja abierta.' }, { status: 400 });
      }

      await db.execute({
        sql: `INSERT INTO cash_registers (opening_usd, opening_ves, status) VALUES (?, ?, 'open')`,
        args: [opening_usd || 0, opening_ves || 0]
      });

      return NextResponse.json({ success: true, message: 'Caja abierta con éxito' });
    } 
    
    if (action === 'close') {
      if (!register_id) {
        return NextResponse.json({ error: 'No se especificó la caja a cerrar.' }, { status: 400 });
      }

      await db.execute({
        sql: `UPDATE cash_registers SET closing_usd = ?, closing_ves = ?, status = 'closed', closing_date = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [closing_usd || 0, closing_ves || 0, register_id]
      });

      return NextResponse.json({ success: true, message: 'Caja cerrada correctamente (conteo ciego registrado)' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error("Error en caja:", error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de caja' }, { status: 500 });
  }
}
