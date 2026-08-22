import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

export async function POST(request: Request) {
  try {

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Correo y contraseña son obligatorios',
        },
        { status: 400 }
      );
    }


    const result = await runQuery(async (db) => {
      return await db.sql(
        `
          SELECT
            id,
            name,
            email,
            password_hash,
            role,
            is_active
          FROM users
          WHERE email = ?
          LIMIT 1;
        `,
        [email]
      );
    });


    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];


    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Correo o contraseña incorrectos',
        },
        { status: 401 }
      );
    }


    const user = rows[0];


    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'El usuario está desactivado',
        },
        { status: 403 }
      );
    }


    if (password !== user.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Correo o contraseña incorrectos',
        },
        { status: 401 }
      );
    }


    return NextResponse.json({
      success: true,
      message: 'Acceso autorizado',

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error: any) {

    console.error('Error en login:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Error en el servidor',
      },
      { status: 500 }
    );
  }
}
