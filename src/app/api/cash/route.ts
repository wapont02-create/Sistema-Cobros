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
          u.name AS opened_by,
          u.role AS user_role,
          cr.opening_date,
          cr.closing_date,
          cr.opening_usd,
          cr.opening_ves,
          cr.closing_usd,
          cr.closing_ves,
          cr.status
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

    console.log('CAJA ABIERTA:', rows);

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
    console.error('ERROR CONSULTANDO CAJA:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al consultar la caja',
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

    console.log('DATOS RECIBIDOS CAJA:', body);

    const {
      action,
      openingUSD,
      openingBs,
      countedUSD,
      countedBs,
      userId,
      username,
      userRole,
      registerId,
    } = body;


    // ==================================================
    // ABRIR CAJA
    // ==================================================

    if (action === 'open') {

      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;

      // ------------------------------------------------
      // Buscar usuario
      // ------------------------------------------------

      let cleanUserId =
        userId !== undefined &&
        userId !== null &&
        userId !== ''
          ? Number(userId)
          : null;

      // Si no viene userId, intentar buscarlo por username/email
      if (!cleanUserId && username) {

        const userResult = await runQuery(async (db) => {
          return await db.sql(
            `
            SELECT id
            FROM users
            WHERE email = ?
               OR name = ?
            LIMIT 1;
            `,
            [String(username), String(username)]
          );
        });

        const userRows = Array.isArray(userResult)
          ? userResult
          : userResult?.rows || [];

        if (userRows.length > 0) {
          cleanUserId = Number(userRows[0].id);
        }
      }

      // ------------------------------------------------
      // Verificar usuario
      // ------------------------------------------------

      if (!cleanUserId) {
        return NextResponse.json(
          {
            success: false,
            error:
              'No se pudo identificar al usuario que está abriendo la caja.',
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------
      // Verificar que el usuario existe
      // ------------------------------------------------

      const userExists = await runQuery(async (db) => {
        return await db.sql(
          `
          SELECT id, name, email, role
          FROM users
          WHERE id = ?
          LIMIT 1;
          `,
          [cleanUserId]
        );
      });

      const userRows = Array.isArray(userExists)
        ? userExists
        : userExists?.rows || [];

      if (userRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'El usuario no existe en la base de datos.',
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------
      // Verificar si ya existe una caja abierta
      // ------------------------------------------------

      const existing = await runQuery(async (db) => {
        return await db.sql(`
          SELECT id
          FROM cash_registers
          WHERE status = 'open'
          ORDER BY id DESC
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
            registerId: existingRows[0].id,
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------
      // Crear caja
      // ------------------------------------------------

      await runQuery(async (db) => {
        return await db.sql(
          `
          INSERT INTO cash_registers (
            user_id,
            opening_usd,
            opening_ves,
            status
          )
          VALUES (?, ?, ?, 'open');
          `,
          [
            cleanUserId,
            usd,
            ves,
          ]
        );
      });

      // ------------------------------------------------
      // Recuperar caja creada
      // ------------------------------------------------

      const result = await runQuery(async (db) => {
        return await db.sql(`
          SELECT
            cr.id,
            cr.user_id,
            u.name AS opened_by,
            u.role AS user_role,
            cr.opening_date,
            cr.opening_usd,
            cr.opening_ves,
            cr.status
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

      console.log('CAJA CREADA:', rows);

      if (rows.length === 0) {
        throw new Error(
          'La caja no fue encontrada después de crearla.'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Caja abierta exitosamente',
        register: rows[0],
      });
    }


    // ==================================================
    // CERRAR CAJA
    // ==================================================

    if (action === 'close') {

      if (!registerId) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se recibió el ID de la caja.',
          },
          { status: 400 }
        );
      }

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
            Number(countedUSD) || 0,
            Number(countedBs) || 0,
            Number(registerId),
          ]
        );
      });

      return NextResponse.json({
        success: true,
        message: 'Caja cerrada exitosamente',
      });
    }


    // ==================================================
    // ACCIÓN NO VÁLIDA
    // ==================================================

    return NextResponse.json(
      {
        success: false,
        error: 'Acción no válida',
      },
      { status: 400 }
    );

  } catch (error: any) {

    console.error(
      'ERROR GESTIONANDO CAJA:',
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
