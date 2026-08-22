import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    const password = String(body?.password || '');

    console.log('==============================');
    console.log('INTENTO DE LOGIN');
    console.log('EMAIL:', email);
    console.log('PASSWORD RECIBIDA:', password);
    console.log('==============================');

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Debe ingresar correo y contraseña.',
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
        WHERE LOWER(TRIM(email)) = ?
        LIMIT 1;
        `,
        [email]
      );
    });

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    console.log('FILAS ENCONTRADAS:', rows.length);
    console.log('USUARIO ENCONTRADO:', rows[0]);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado en la base de datos.',
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    // ============================================
    // USUARIO ACTIVO
    // ============================================

    if (Number(user.is_active) === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'El usuario está desactivado.',
        },
        { status: 403 }
      );
    }

    // ============================================
    // COMPARAR CONTRASEÑA
    // ============================================

    const storedPassword = String(user.password_hash || '');

    console.log('PASSWORD BD:', storedPassword);
    console.log('PASSWORD RECIBIDA:', password);
    console.log(
      'PASSWORD COINCIDE:',
      storedPassword === password
    );

    if (storedPassword !== password) {
      return NextResponse.json(
        {
          success: false,
          message: 'La contraseña no coincide.',
        },
        { status: 401 }
      );
    }

    // ============================================
    // LOGIN CORRECTO
    // ============================================

    const loggedUser = {
      id: Number(user.id),
      name: String(user.name),
      email: String(user.email),
      role: String(user.role || 'cajero'),
    };

    console.log('LOGIN EXITOSO');
    console.log(loggedUser);

    return NextResponse.json({
      success: true,
      message: 'Acceso autorizado',
      user: loggedUser,
    });

  } catch (error: any) {
    console.error('ERROR EN LOGIN:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
