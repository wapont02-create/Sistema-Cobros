import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (
      email === 'demo@posenterprise.ve' &&
      password === 'Demo1234*'
    ) {
      return NextResponse.json({
        success: true,
        message: 'Acceso autorizado',
        user: {
          id: 1,
          name: 'Usuario Demo POS',
          email: 'demo@posenterprise.ve',
          role: 'admin',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Correo o contraseña incorrectos',
      },
      { status: 401 }
    );

  } catch (error) {
    console.error('Error en login:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error en el servidor',
      },
      { status: 500 }
    );
  }
}
