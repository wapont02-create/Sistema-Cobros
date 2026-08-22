import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client';

// ======================================================
// GET - CONSULTAR CAJA ABIERTA
// ======================================================

export async function GET() {
  try {
    const result = await runQuery(async (db) => {
      return await db.sql(`
        SELECT
          cr.id,
          cr.user_id,
          cr.opening_date,
          cr.closing_date,
          cr.opening_usd,
          cr.opening_ves,
          cr.closing_usd,
          cr.closing_ves,
          cr.status,
          u.name AS opened_by,
          u.role AS user_role
        FROM cash_registers cr
        LEFT JOIN users u ON u.id = cr.user_id
        WHERE cr.status = 'open'
        ORDER BY cr.id DESC
        LIMIT 1;
      `);
    });

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    if (rows.length === 0) {
      return NextResponse.json({
        isOpen: false,
        register: null,
      });
    }

    return NextResponse.json({
      isOpen: true,
      register: rows[0],
    });

  } catch (error: any) {
    console.error('Error al consultar caja:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al consultar la caja',
      },
      { status: 500 }
    );
  }
}


// ======================================================
// POST - ABRIR / CERRAR CAJA
// ======================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      action,
      openingUSD,
      openingBs,
      countedUSD,
      countedBs,
      userId,
    } = body;


    // ==================================================
    // ABRIR CAJA
    // ==================================================

    if (action === 'open') {

      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;
      const cleanUserId = Number(userId);

      if (!cleanUserId) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se recibió un usuario válido para abrir la caja.',
          },
          { status: 400 }
        );
      }

      if (usd < 0 || ves < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Los montos de apertura no pueden ser negativos.',
          },
          { status: 400 }
        );
      }


      // Verificar que el usuario exista
      const userResult = await runQuery(async (db) => {
        return await db.sql(
          `
            SELECT id, name, role
            FROM users
            WHERE id = ?
              AND is_active = 1
            LIMIT 1;
          `,
          [cleanUserId]
        );
      });

      const userRows = Array.isArray(userResult)
        ? userResult
        : userResult?.rows || [];

      if (userRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'El usuario no existe o está inactivo.',
          },
          { status: 400 }
        );
      }


      // Verificar que no exista otra caja abierta
      const openResult = await runQuery(async (db) => {
        return await db.sql(`
          SELECT id
          FROM cash_registers
          WHERE status = 'open'
          LIMIT 1;
        `);
      });

      const openRows = Array.isArray(openResult)
        ? openResult
        : openResult?.rows || [];

      if (openRows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ya existe una caja abierta.',
          },
          { status: 400 }
        );
      }


      // Crear caja
      const insertResult = await runQuery(async (db) => {
        return await db.sql(
          `
            INSERT INTO cash_registers (
              user_id,
              opening_date,
              opening_usd,
              opening_ves,
              status
            )
            VALUES (
              ?,
              CURRENT_TIMESTAMP,
              ?,
              ?,
              'open'
            );
          `,
          [
            cleanUserId,
            usd,
            ves,
          ]
        );
      });


      return NextResponse.json({
        success: true,
        message: 'Caja abierta exitosamente',
      });
    }


    // ==================================================
    // CERRAR CAJA
    // ==================================================

    if (action === 'close') {

      const usd = Number(countedUSD) || 0;
      const ves = Number(countedBs) || 0;


      const registerResult = await runQuery(async (db) => {
        return await db.sql(`
          SELECT id
          FROM cash_registers
          WHERE status = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);
      });

      const registerRows = Array.isArray(registerResult)
        ? registerResult
        : registerResult?.rows || [];

      if (registerRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No hay una caja abierta para cerrar.',
          },
          { status: 400 }
        );
      }

      const registerId = Number(registerRows[0].id);


      await runQuery(async (db) => {
        return await db.sql(
          `
            UPDATE cash_registers
            SET
              closing_usd = ?,
              closing_ves = ?,
              closing_date = CURRENT_TIMESTAMP,
              status = 'closed'
            WHERE id = ?
              AND status = 'open';
          `,
          [
            usd,
            ves,
            registerId,
          ]
        );
      });


      return NextResponse.json({
        success: true,
        message: 'Caja cerrada exitosamente',
        registerId,
      });
    }


    return NextResponse.json(
      {
        success: false,
        error: 'Acción no válida.',
      },
      { status: 400 }
    );

  } catch (error: any) {

    console.error('Error en /api/cash:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al procesar la operación de caja.',
      },
      { status: 500 }
    );
  }
}
