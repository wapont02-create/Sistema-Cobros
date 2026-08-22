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
        WHERE LOWER(TRIM(status)) = 'open'
        ORDER BY id DESC
        LIMIT 1;
      `);
    });

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    console.log('================================');
    console.log('CONSULTA CAJA ABIERTA');
    console.log('FILAS ENCONTRADAS:', rows.length);
    console.log('CAJA:', rows);
    console.log('================================');

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        isOpen: false,
        register: null,
      });
    }

    return NextResponse.json({
      success: true,
      isOpen: true,
      register: rows[0],
    });

  } catch (error: any) {
    console.error('ERROR CONSULTANDO CAJA:', error);

    return NextResponse.json(
      {
        success: false,
        isOpen: false,
        register: null,
        error:
          error?.message ||
          'Error al consultar el estado de la caja',
      },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('================================');
    console.log('OPERACIÓN DE CAJA');
    console.log('DATOS RECIBIDOS:', body);
    console.log('================================');

    const {
      action,
      openingUSD,
      openingBs,
      countedUSD,
      countedBs,
      userId,
      registerId,
    } = body;

    // ==================================================
    // ABRIR CAJA
    // ==================================================

    if (action === 'open') {

      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;

      const cleanUserId =
        userId !== null &&
        userId !== undefined &&
        userId !== ''
          ? Number(userId)
          : null;

      if (cleanUserId === null || !Number.isFinite(cleanUserId)) {
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
            error: 'El fondo inicial no puede ser negativo.',
          },
          { status: 400 }
        );
      }

      if (usd === 0 && ves === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Debe indicar un fondo inicial en USD o Bs.',
          },
          { status: 400 }
        );
      }

      // -----------------------------------------------
      // Verificar si ya existe una caja abierta
      // -----------------------------------------------

      const existingResult = await runQuery(async (db) => {
        return await db.sql(`
          SELECT
            id,
            user_id,
            opening_date,
            opening_usd,
            opening_ves,
            status
          FROM cash_registers
          WHERE LOWER(TRIM(status)) = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);
      });

      const existingRows = Array.isArray(existingResult)
        ? existingResult
        : existingResult?.rows || [];

      if (existingRows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ya existe una caja abierta.',
            register: existingRows[0],
          },
          { status: 400 }
        );
      }

      // -----------------------------------------------
      // INSERTAR NUEVA CAJA
      // -----------------------------------------------

      console.log('CREANDO CAJA:', {
        userId: cleanUserId,
        openingUSD: usd,
        openingBs: ves,
      });

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

      // -----------------------------------------------
      // COMPROBAR QUE REALMENTE SE GUARDÓ
      // -----------------------------------------------

      const verifyResult = await runQuery(async (db) => {
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
          WHERE LOWER(TRIM(status)) = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);
      });

      const verifyRows = Array.isArray(verifyResult)
        ? verifyResult
        : verifyResult?.rows || [];

      console.log('================================');
      console.log('CAJA DESPUÉS DEL INSERT');
      console.log('FILAS:', verifyRows.length);
      console.log('DATOS:', verifyRows);
      console.log('================================');

      if (verifyRows.length === 0) {
        throw new Error(
          'La caja fue enviada para apertura pero no aparece guardada en la base de datos.'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Caja abierta exitosamente.',
        isOpen: true,
        register: verifyRows[0],
      });
    }

    // ==================================================
    // CERRAR CAJA
    // ==================================================

    if (action === 'close') {

      const cleanRegisterId = Number(registerId);

      if (
        !cleanRegisterId ||
        !Number.isFinite(cleanRegisterId)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se recibió un ID de caja válido.',
          },
          { status: 400 }
        );
      }

      const usd = Number(countedUSD) || 0;
      const ves = Number(countedBs) || 0;

      if (usd < 0 || ves < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'El conteo de cierre no puede ser negativo.',
          },
          { status: 400 }
        );
      }

      const updateResult = await runQuery(async (db) => {
        return await db.sql(
          `
          UPDATE cash_registers
          SET
            closing_usd = ?,
            closing_ves = ?,
            closing_date = CURRENT_TIMESTAMP,
            status = 'closed'
          WHERE id = ?
            AND LOWER(TRIM(status)) = 'open';
          `,
          [
            usd,
            ves,
            cleanRegisterId,
          ]
        );
      });

      console.log(
        'RESULTADO CIERRE:',
        updateResult
      );

      // -----------------------------------------------
      // VERIFICAR CIERRE
      // -----------------------------------------------

      const verifyResult = await runQuery(async (db) => {
        return await db.sql(
          `
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
          WHERE id = ?
          LIMIT 1;
          `,
          [cleanRegisterId]
        );
      });

      const verifyRows = Array.isArray(verifyResult)
        ? verifyResult
        : verifyResult?.rows || [];

      if (verifyRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se encontró la caja después del cierre.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Caja cerrada exitosamente.',
        register: verifyRows[0],
      });
    }

    // ==================================================
    // ACCIÓN NO VÁLIDA
    // ==================================================

    return NextResponse.json(
      {
        success: false,
        error: 'Acción no válida.',
      },
      { status: 400 }
    );

  } catch (error: any) {

    console.error('================================');
    console.error('ERROR EN /api/cash');
    console.error(error);
    console.error('================================');

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
