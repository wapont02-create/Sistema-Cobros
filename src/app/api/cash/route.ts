import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client'; // Ajusta según tu estructura

// 1. Consultar si hay una caja abierta actualmente
export async function GET() {
  try {
    const result = await runQuery(async (db) => {
      return await db.sql("SELECT * FROM cash_registers WHERE status = 'open' ORDER BY id DESC LIMIT 1;");
    });

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

// 2. Abrir caja o Cerrar caja (Conteo ciego)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, openingUSD, openingBs, countedUSD, countedBs, username, userRole, registerId } = body;

    // ACCIÓN: ABRIR CAJA
    if (action === 'open') {
      const result = await runQuery(async (db) => {
        return await db.sql(
          `INSERT INTO cash_registers (opening_usd, opening_bs, opened_by, user_role, status, created_at) 
           VALUES (?, ?, ?, ?, 'open', CURRENT_TIMESTAMP);`,
          [openingUSD || 0, openingBs || 0, username || 'Desconocido', userRole || 'Sin Rol']
        );
      });
      return NextResponse.json({ success: true, message: 'Caja abierta exitosamente', data: result });
    }

    // ACCIÓN: CERRAR CAJA (Conteo ciego)
    if (action === 'close') {
      const result = await runQuery(async (db) => {
        return await db.sql(
          `UPDATE cash_registers 
           SET closing_usd = ?, closing_bs = ?, closed_by = ?, status = 'closed', closed_at = CURRENT_TIMESTAMP 
           WHERE id = ?;`,
          [countedUSD || 0, countedBs || 0, username || 'Desconocido', registerId]
        );
      });
      return NextResponse.json({ success: true, message: 'Caja cerrada exitosamente', data: result });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error("Error en la gestión de caja:", error);
    return NextResponse.json({ error: 'Error al procesar la operación de caja' }, { status: 500 });
  }
}
