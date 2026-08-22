import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client';

export async function GET() {
  try {
    const result = await runQuery(async (db) => {
      return await db.sql(`
        SELECT
          id,
          user_id,
          opening_date,
          closing_date,
          opening_usd,
          opening_ves,
          closing_usd,
          closing_ves,
          status
        FROM cash_registers
        WHERE status = 'open'
        ORDER BY id DESC
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
        register: null
      });
    }

    return NextResponse.json({
      isOpen: true,
      register: rows[0]
    });

  } catch (error: any) {
    console.error('ERROR CONSULTANDO CAJA:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al consultar la caja'
      },
      { status: 500 }
    );
  }
}


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
      registerId
    } = body;


    // ============================================
    // ABRIR CAJA
    // ============================================

    if (action === 'open') {

      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;
      const cleanUserId =
        userId ? Number(userId) : null;


      // Verificar si ya existe una caja abierta

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
            registerId: existingRows[0].id
          },
          { status: 400 }
        );
      }


      // Crear caja

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
            ves
          ]
        );

      });


      // Recuperar caja creada

      const result = await runQuery(async (db) => {

        return await db.sql(`
          SELECT
            id,
            user_id,
            opening_date,
            opening_usd,
            opening_ves,
            status
          FROM cash_registers
          WHERE status = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);

      });


      const rows = Array.isArray(result)
        ? result
        : result?.rows || [];


      console.log(
        'CAJA CREADA:',
        rows
      );


      if (rows.length === 0) {

        throw new Error(
          'La caja no fue encontrada después de crearla.'
        );

      }


      return NextResponse.json({
        success: true,
        message: 'Caja abierta exitosamente',
        register: rows[0]
      });

    }


    // ============================================
    // CERRAR CAJA
    // ============================================

    if (action === 'close') {

      if (!registerId) {

        return NextResponse.json(
          {
            success: false,
            error: 'No se recibió el ID de la caja.'
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
            Number(registerId)
          ]
        );

      });


      return NextResponse.json({
        success: true,
        message: 'Caja cerrada exitosamente'
      });

    }


    return NextResponse.json(
      {
        success: false,
        error: 'Acción no válida'
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
          'Error al procesar la operación de caja'
      },
      { status: 500 }
    );

  }
}
