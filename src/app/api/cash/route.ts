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

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        isOpen: false,
      });
    }

    return NextResponse.json({
      isOpen: true,
      register: rows[0],
    });

  } catch (error: any) {
    console.error('Error al verificar la caja:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al verificar el estado de la caja',
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
      username,
      userId,
    } = body;


    // ==================================================
    // ABRIR CAJA
    // ==================================================

    if (action === 'open') {

      const cleanOpeningUSD = Number(openingUSD) || 0;
      const cleanOpeningVes = Number(openingBs) || 0;

      if (cleanOpeningUSD < 0 || cleanOpeningVes < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Los montos de apertura no pueden ser negativos',
          },
          { status: 400 }
        );
      }

      // Verificar que NO exista otra caja abierta
      const existing = await runQuery(async (db) => {
        return await db.sql(`
          SELECT id
          FROM cash_registers
          WHERE status = 'open'
          LIMIT 1;
        `);
      });

      const existingRows = Array.isArray(existing)
        ? existing
        : existing?.rows || [];

      if (existingRows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ya existe una caja abierta.',
          },
          { status: 400 }
        );
      }


      // Determinar usuario
      let cleanUserId = userId ? Number(userId) : null;

      // Si no llega userId, intentar buscarlo por email
      if (!cleanUserId && username) {
        const userResult = await runQuery(async (db) => {
          return await db.sql(
            `
              SELECT id
              FROM users
              WHERE email = ?
              LIMIT 1;
            `,
            [username]
          );
        });

        const userRows = Array.isArray(userResult)
          ? userResult
          : userResult?.rows || [];

        if (userRows.length > 0) {
          cleanUserId = Number(userRows[0].id);
        }
      }


      // Insertar caja
      await runQuery(async (db) => {

        if (cleanUserId) {

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
              cleanOpeningUSD,
              cleanOpeningVes,
            ]
          );

        } else {

          return await db.sql(
            `
              INSERT INTO cash_registers (
                opening_date,
                opening_usd,
                opening_ves,
                status
              )
              VALUES (
                CURRENT_TIMESTAMP,
                ?,
                ?,
                'open'
              );
            `,
            [
              cleanOpeningUSD,
              cleanOpeningVes,
            ]
          );

        }

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

      const cleanCountedUSD = Number(countedUSD) || 0;
      const cleanCountedVes = Number(countedBs) || 0;

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
            error: 'No existe una caja abierta para cerrar.',
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
            cleanCountedUSD,
            cleanCountedVes,
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
        error: 'Acción no válida',
      },
      { status: 400 }
    );

  } catch (error: any) {

    console.error(
      'Error en la gestión de caja:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al procesar la operación de caja',
      },
      { status: 500 }
    );
  }
}
