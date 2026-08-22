import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

/**
 * ============================================================
 * GET /api/cash
 * Consultar si existe una caja abierta
 * ============================================================
 */
export async function GET() {
  try {
    console.log('======================================');
    console.log('CONSULTANDO ESTADO DE CAJA');
    console.log('======================================');

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

    console.log('CAJAS ABIERTAS ENCONTRADAS:', rows.length);
    console.log('DATOS CAJA:', rows);

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

    console.error('======================================');
    console.error('ERROR CONSULTANDO CAJA');
    console.error(error);
    console.error('======================================');

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


/**
 * ============================================================
 * POST /api/cash
 *
 * action:
 *   open  = abrir caja
 *   close = cerrar caja
 * ============================================================
 */
export async function POST(request: Request) {

  try {

    const body = await request.json();

    console.log('======================================');
    console.log('OPERACIÓN DE CAJA');
    console.log('DATOS RECIBIDOS:');
    console.log(body);
    console.log('======================================');

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


    // ========================================================
    // ABRIR CAJA
    // ========================================================

    if (action === 'open') {

      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;

      let cleanUserId: number | null = null;

      if (
        userId !== undefined &&
        userId !== null &&
        userId !== ''
      ) {
        const parsedUserId = Number(userId);

        if (!Number.isNaN(parsedUserId)) {
          cleanUserId = parsedUserId;
        }
      }

      console.log('========== APERTURA ==========');
      console.log('USD:', usd);
      console.log('VES:', ves);
      console.log('USER ID:', cleanUserId);
      console.log('USERNAME:', username);
      console.log('ROLE:', userRole);


      // ------------------------------------------------------
      // Validar fondo inicial
      // ------------------------------------------------------

      if (usd < 0 || ves < 0) {

        return NextResponse.json(
          {
            success: false,
            error: 'El fondo inicial no puede ser negativo.',
          },
          { status: 400 }
        );

      }


      // ------------------------------------------------------
      // Verificar caja abierta
      // ------------------------------------------------------

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
          WHERE status = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);

      });

      const existingRows = Array.isArray(existingResult)
        ? existingResult
        : existingResult?.rows || [];

      console.log(
        'CAJAS ABIERTAS ANTES DEL INSERT:',
        existingRows
      );


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


      // ------------------------------------------------------
      // INSERTAR CAJA
      // ------------------------------------------------------

      console.log('INSERTANDO NUEVA CAJA...');

      const insertResult = await runQuery(async (db) => {

        return await db.sql(
          `
          INSERT INTO cash_registers
          (
            user_id,
            opening_usd,
            opening_ves,
            status
          )
          VALUES (?, ?, ?, ?);
          `,
          [
            cleanUserId,
            usd,
            ves,
            'open',
          ]
        );

      });

      console.log(
        'RESULTADO INSERT:',
        insertResult
      );


      // ------------------------------------------------------
      // VERIFICAR INMEDIATAMENTE
      // ------------------------------------------------------

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
          WHERE status = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);

      });

      const verifyRows = Array.isArray(verifyResult)
        ? verifyResult
        : verifyResult?.rows || [];


      console.log(
        '======================================'
      );

      console.log(
        'CAJA DESPUÉS DEL INSERT:',
        verifyRows
      );

      console.log(
        '======================================'
      );


      // ------------------------------------------------------
      // Si no aparece, algo está mal en la conexión
      // ------------------------------------------------------

      if (verifyRows.length === 0) {

        throw new Error(
          'La caja fue enviada para guardar, pero SQLite Cloud no devuelve ninguna caja abierta después del INSERT.'
        );

      }


      // ------------------------------------------------------
      // ÉXITO
      // ------------------------------------------------------

      return NextResponse.json({

        success: true,

        message:
          'Caja abierta exitosamente. El turno permanecerá abierto aunque cambie de pantalla.',

        isOpen: true,

        register: verifyRows[0],

      });

    }


    // ========================================================
    // CERRAR CAJA
    // ========================================================

    if (action === 'close') {

      const cleanRegisterId = Number(registerId);

      const usd = Number(countedUSD) || 0;
      const ves = Number(countedBs) || 0;


      if (!cleanRegisterId) {

        return NextResponse.json(
          {
            success: false,
            error: 'No se recibió un ID válido de la caja.',
          },
          { status: 400 }
        );

      }


      console.log('========== CIERRE DE CAJA ==========');
      console.log('REGISTER ID:', cleanRegisterId);
      console.log('USD CONTADO:', usd);
      console.log('VES CONTADO:', ves);


      // ------------------------------------------------------
      // Verificar que exista
      // ------------------------------------------------------

      const checkResult = await runQuery(async (db) => {

        return await db.sql(
          `
          SELECT
            id,
            user_id,
            opening_usd,
            opening_ves,
            status
          FROM cash_registers
          WHERE id = ?
          LIMIT 1;
          `,
          [cleanRegisterId]
        );

      });


      const checkRows = Array.isArray(checkResult)
        ? checkResult
        : checkResult?.rows || [];


      if (checkRows.length === 0) {

        return NextResponse.json(
          {
            success: false,
            error: 'La caja indicada no existe.',
          },
          { status: 404 }
        );

      }


      if (String(checkRows[0].status) !== 'open') {

        return NextResponse.json(
          {
            success: false,
            error: 'Esta caja ya está cerrada.',
          },
          { status: 400 }
        );

      }


      // ------------------------------------------------------
      // CERRAR
      // ------------------------------------------------------

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
            AND status = 'open';
          `,
          [
            usd,
            ves,
            cleanRegisterId,
          ]
        );

      });


      console.log(
        'RESULTADO UPDATE:',
        updateResult
      );


      // ------------------------------------------------------
      // Verificar cierre
      // ------------------------------------------------------

      const verifyCloseResult = await runQuery(async (db) => {

        return await db.sql(
          `
          SELECT
            id,
            opening_usd,
            opening_ves,
            closing_usd,
            closing_ves,
            opening_date,
            closing_date,
            status
          FROM cash_registers
          WHERE id = ?
          LIMIT 1;
          `,
          [cleanRegisterId]
        );

      });


      const verifyCloseRows = Array.isArray(
        verifyCloseResult
      )
        ? verifyCloseResult
        : verifyCloseResult?.rows || [];


      console.log(
        'CAJA DESPUÉS DEL CIERRE:',
        verifyCloseRows
      );


      return NextResponse.json({

        success: true,

        message: 'Caja cerrada exitosamente.',

        register:
          verifyCloseRows[0] || null,

      });

    }


    // ========================================================
    // ACCIÓN DESCONOCIDA
    // ========================================================

    return NextResponse.json(
      {
        success: false,
        error: 'Acción de caja no válida.',
      },
      { status: 400 }
    );


  } catch (error: any) {

    console.error(
      '======================================'
    );

    console.error(
      'ERROR GESTIONANDO CAJA:'
    );

    console.error(error);

    console.error(
      '======================================'
    );


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
