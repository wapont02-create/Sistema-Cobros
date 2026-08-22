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
          opening_usd,
          opening_ves,
          status
        FROM cash_registers
        ORDER BY id DESC
        LIMIT 10;
      `);
    });

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    console.log('========== GET CASH ==========');
    console.log('ROWS:', rows);
    console.log('COUNT:', rows.length);
    console.log('==============================');

    return NextResponse.json({
      success: true,
      rows,
    });

  } catch (error: any) {

    console.error('ERROR GET CASH:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error consultando caja',
      },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {

  try {

    const body = await request.json();

    console.log('================================');
    console.log('POST /api/cash');
    console.log('BODY:', body);
    console.log('================================');

    const {
      action,
      openingUSD,
      openingBs,
      userId,
    } = body;

    if (action !== 'open') {

      return NextResponse.json(
        {
          success: false,
          error: 'Esta prueba solamente permite abrir caja.',
        },
        { status: 400 }
      );
    }

    const cleanUserId = Number(userId);
    const usd = Number(openingUSD) || 0;
    const ves = Number(openingBs) || 0;

    console.log('DATOS LIMPIOS:', {
      cleanUserId,
      usd,
      ves,
    });

    if (!cleanUserId) {

      return NextResponse.json(
        {
          success: false,
          error: 'userId inválido.',
        },
        { status: 400 }
      );
    }

    // ==========================================
    // INSERTAR
    // ==========================================

    const insertResult = await runQuery(async (db) => {

      console.log('EJECUTANDO INSERT...');

      const result = await db.sql(
        `
        INSERT INTO cash_registers (
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

      console.log(
        'RESULTADO INSERT:',
        result
      );

      return result;
    });

    console.log(
      'INSERT TERMINADO:',
      insertResult
    );

    // ==========================================
    // CONSULTAR DESPUÉS DEL INSERT
    // ==========================================

    const verifyResult = await runQuery(async (db) => {

      console.log(
        'CONSULTANDO CASH_REGISTER DESPUÉS DEL INSERT...'
      );

      return await db.sql(`
        SELECT
          id,
          user_id,
          opening_date,
          opening_usd,
          opening_ves,
          status
        FROM cash_registers
        ORDER BY id DESC
        LIMIT 10;
      `);

    });

    const rows = Array.isArray(verifyResult)
      ? verifyResult
      : verifyResult?.rows || [];

    console.log('================================');
    console.log('RESULTADO DESPUÉS DEL INSERT');
    console.log('ROWS:', rows);
    console.log('COUNT:', rows.length);
    console.log('================================');

    if (rows.length === 0) {

      return NextResponse.json(
        {
          success: false,
          error:
            'El INSERT fue ejecutado pero la consulta posterior devuelve 0 registros.',
          debug: {
            insertResult,
            rows,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CAJA GUARDADA CORRECTAMENTE',
      register: rows[0],
    });

  } catch (error: any) {

    console.error('================================');
    console.error('ERROR POST /api/cash');
    console.error(error);
    console.error('================================');

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al abrir la caja.',
      },
      { status: 500 }
    );
  }
}
