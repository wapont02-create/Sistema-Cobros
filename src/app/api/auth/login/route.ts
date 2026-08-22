import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    const password = String(body?.password || '');

    // ============================================
    // 1. VALIDAR DATOS
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
    // 2. BUSCAR USUARIO
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
          is_active
        FROM users
        WHERE LOWER(TRIM(email)) = ?
        LIMIT 1;
        `,
        [email]
      );
    });

    // ============================================
    // 3. NORMALIZAR RESULTADO
    // ============================================

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    console.log('LOGIN - USUARIO ENCONTRADO:', rows.length);

    // ============================================
    // 4. USUARIO NO ENCONTRADO
    // ============================================

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

    // ============================================
    // 5. VERIFICAR USUARIO ACTIVO
    // ============================================

    if (
      user.is_active !== undefined &&
      user.is_active !== null &&
      Number(user.is_active) === 0
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
    // 6. VERIFICAR CONTRASEÑA
    // ============================================

    const storedPassword = String(
      user.password_hash || ''
    );

    /*
      IMPORTANTE:

      En este momento estamos comparando directamente
      la contraseña enviada con password_hash.

      Esto funciona SOLAMENTE si en tu base de datos
      guardaste:

      Demo1234*

      directamente en password_hash.

      Si password_hash contiene un hash bcrypt,
      debemos usar bcrypt.compare().
    */

    if (storedPassword !== password) {
      console.log('LOGIN - CONTRASEÑA INCORRECTA');

      return NextResponse.json(
        {
          success: false,
          message: 'Correo o contraseña incorrectos',
        },
        { status: 401 }
      );
    }

    // ============================================
    // 7. CREAR USUARIO PARA EL FRONTEND
    // ============================================

    const loggedUser = {
      id: Number(user.id),
      name: String(user.name),
      email: String(user.email),
      role: String(user.role || 'cajero'),
    };

    console.log('LOGIN EXITOSO:', {
      id: loggedUser.id,
      name: loggedUser.name,
      email: loggedUser.email,
      role: loggedUser.role,
    });

    // ============================================
    // 8. RESPUESTA
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Acceso autorizado',
      user: loggedUser,
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
          'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
