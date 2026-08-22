import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    console.log('LOGIN INTENTO:', {
      email,
      passwordLength: password.length,
    });

    // ============================================
    // VALIDACIONES
    // ============================================

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Debe ingresar correo y contraseña.',
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

    console.log('RESULTADO BUSQUEDA USUARIO:', rows);

    // ============================================
    // USUARIO NO ENCONTRADO
    // ============================================

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
    // USUARIO DESACTIVADO
    // ============================================

    if (
      user.is_active === 0 ||
      user.is_active === false ||
      user.is_active === '0'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Este usuario está desactivado.',
        },
        { status: 403 }
      );
    }

    // ============================================
    // VALIDAR PASSWORD
    // ============================================

    const storedHash = String(user.password_hash || '');

    if (!storedHash) {
      console.error(
        'El usuario no tiene password_hash:',
        user.email
      );

      return NextResponse.json(
        {
          success: false,
          message: 'El usuario no tiene una contraseña configurada.',
        },
        { status: 500 }
      );
    }

    let passwordCorrect = false;

    try {
      passwordCorrect = await bcrypt.compare(
        password,
        storedHash
      );
    } catch (bcryptError) {
      console.error(
        'Error verificando password_hash:',
        bcryptError
      );

      return NextResponse.json(
        {
          success: false,
          message: 'La contraseña almacenada no tiene un formato válido.',
        },
        { status: 500 }
      );
    }

    // ============================================
    // PASSWORD INCORRECTO
    // ============================================

    if (!passwordCorrect) {
      console.log(
        'CONTRASEÑA INCORRECTA PARA:',
        user.email
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Correo o contraseña incorrectos.',
        },
        { status: 401 }
      );
    }

    // ============================================
    // LOGIN CORRECTO
    // ============================================

    console.log(
      'LOGIN EXITOSO:',
      user.email
    );

    return NextResponse.json({
      success: true,
      message: 'Acceso autorizado',

      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role || 'cajero',
      },
    });

  } catch (error: any) {
    console.error(
      'ERROR EN /api/auth/login:',
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
