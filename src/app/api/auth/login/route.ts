import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    // ============================================
    // 1. VALIDAR DATOS RECIBIDOS
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
    // 2. BUSCAR USUARIO EN LA BASE DE DATOS
    // ============================================

    const result = await runQuery(async (db) => {
      return await db.sql(
        `
        SELECT
          id,
          name,
          email,
          password,
          role
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

    console.log('LOGIN - FILAS ENCONTRADAS:', rows.length);

    // ============================================
    // 4. USUARIO NO EXISTE
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
    // 5. VERIFICAR CONTRASEÑA
    // ============================================

    const storedPassword = String(user.password || '');

    if (storedPassword !== password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Correo o contraseña incorrectos',
        },
        { status: 401 }
      );
    }

    // ============================================
    // 6. CREAR OBJETO DE USUARIO
    // ============================================

    const loggedUser = {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log('LOGIN EXITOSO:', {
      id: loggedUser.id,
      email: loggedUser.email,
      role: loggedUser.role,
    });

    // ============================================
    // 7. RESPUESTA
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
