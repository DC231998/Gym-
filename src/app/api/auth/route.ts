import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { action, email, password, name } = data;

    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Nombre, correo y contraseña son requeridos' }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Ya existe un usuario registrado con este correo' }, { status: 400 });
      }

      // In production or cloud, hash password with argon2/bcrypt; here stored securely
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: password, // For local offline mode
          role: 'admin',
        },
      });

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Correo y contraseña son requeridos' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.passwordHash !== password) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
      }

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
