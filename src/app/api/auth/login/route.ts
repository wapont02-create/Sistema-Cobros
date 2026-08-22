import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    const password = String(body.password || '');

    console.log('==============================');
    console.log('INTENTO DE LOGIN');
    console.log('EMAIL:', email);
    console.log(
      'PASSWORD RECIBIDA:',
      password ? 'SI' : 'NO'
    );
    console.log('==============================');

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Debe ingresar correo y contraseña.',
        },
        { status: 400 }
      );
    }

    // ============================================
    // BUSCAR USUARIO
    // ============================================

    const result = await runQuery(async (db) => {
      return await db.sql(
        `
        SELECT
          id,
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at
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

    console.log(
      'USUARIOS ENCONTRADOS:',
      rows.length
    );

    // ============================================
    // USUARIO NO ENCONTRADO
    // ============================================

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Usuario no encontrado en la base de datos.',
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    console.log('USUARIO ENCONTRADO:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      hasPasswordHash:
        !!user.password_hash,
    });

    // ============================================
    // VERIFICAR USUARIO ACTIVO
    // ============================================

    if (
      user.is_active === 0 ||
      user.is_active === false ||
      user.is_active === '0'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Este usuario está desactivado.',
        },
        { status: 403 }
      );
    }

    // ============================================
    // OBTENER PASSWORD HASH
    // ============================================

    const passwordHash = String(
      user.password_hash || ''
    ).trim();

    if (!passwordHash) {
      console.error(
        'El usuario no tiene password_hash.'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'El usuario no tiene una contraseña configurada.',
        },
        { status: 500 }
      );
    }

    // ============================================
    // COMPARAR PASSWORD
    // ============================================

    let passwordValid = false;

    try {
      passwordValid = await bcrypt.compare(
        password,
        passwordHash
      );
    } catch (error) {
      console.error(
        'ERROR BCRYPT:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'La contraseña almacenada no tiene un formato válido.',
        },
        { status: 500 }
      );
    }

    // ============================================
    // PASSWORD INCORRECTO
    // ============================================

    if (!passwordValid) {
      console.log(
        'PASSWORD INCORRECTA'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Correo o contraseña incorrectos.',
        },
        { status: 401 }
      );
    }

    // ============================================
    // LOGIN CORRECTO
    // ============================================

    const loggedUser = {
      id: Number(user.id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      role: String(user.role || 'cajero'),
    };

    console.log(
      'LOGIN EXITOSO:',
      loggedUser
    );

    return NextResponse.json({
      success: true,
      message: 'Acceso autorizado',
      user: loggedUser,
    });

  } catch (error: any) {
    console.error(
      'ERROR EN LOGIN:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Error interno del servidor.',
      },
      { status: 500 }
    );
  }
}
