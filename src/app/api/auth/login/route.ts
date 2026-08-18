import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validación temporal para el usuario demo del sistema
    if (email === 'demo@posenterprise.ve' && password === 'Demo1234*') {
      return NextResponse.json({
        success: true,
        message: 'Acceso autorizado',
        user: { name: 'Usuario Demo POS', email: 'demo@posenterprise.ve', role: 'admin' }
      });
    }

    return NextResponse.json(
      { success: false, message: 'Correo o contraseña incorrectos' },
      { status: 401 }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
