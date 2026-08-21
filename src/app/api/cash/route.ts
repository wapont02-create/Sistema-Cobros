import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client'; // Ajusta la ruta relativa según tu estructura

// Consultar si hay una caja abierta actualmente
export async function GET() {
  try {
    const result = await runQuery(async (db) => {
      return await db.sql("SELECT * FROM cash_registers WHERE status = 'open' ORDER BY id DESC LIMIT 1");
    });
    
    // Verificamos si arrojó resultados según el formato que devuelve tu cliente
    const rows = result.rows || result;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ isOpen: false });
    }
    
    return NextResponse.json({ isOpen: true, register: rows[0] });
  } catch (error) {
    console.error("Error al verificar la caja:", error);
    return NextResponse.json({ error: 'Error al verificar el estado de la caja' }, { status: 500 });
  }
}

// Abrir caja o Cerrar caja (Conteo ciego)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, opening_usd, opening_ves, closing_usd, closing_ves, register_id } = body;

    if (action === 'open') {
      // Verificar si ya hay una caja abierta
      const activeCheck = await runQuery(async (db) => {
        return await db.sql("SELECT id FROM cash_registers WHERE status = 'open'");
      });
      const activeRows = activeCheck.rows || activeCheck;

      if (activeRows && activeRows.length > 0) {
        return NextResponse.json({ error: 'Ya existe una caja abierta.' }, { status: 400 });
      }

      const oUsd = opening_usd || 0;
      const oVes = opening_ves || 0;

      await runQuery(async (db) => {
        return await db.sql(`INSERT INTO cash_registers (opening_usd, opening_ves, status) VALUES (${oUsd}, ${oVes}, 'open')`);
      });

      return NextResponse.json({ success: true, message: 'Caja abierta con éxito' });
    } 
    
    if (action === 'close') {
      if (!register_id) {
        return NextResponse.json({ error: 'No se especificó la caja a cerrar.' }, { status: 400 });
      }

      const cUsd = closing_usd || 0;
      const cVes = closing_ves || 0;

      await runQuery(async (db) => {
        return await db.sql(`UPDATE cash_registers SET closing_usd = ${cUsd}, closing_ves = ${cVes}, status = 'closed', closing_date = CURRENT_TIMESTAMP WHERE id = ${register_id}`);
      });

      return NextResponse.json({ success: true, message: 'Caja cerrada correctamente (conteo ciego registrado)' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error("Error en caja:", error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de caja' }, { status: 500 });
  }
}
