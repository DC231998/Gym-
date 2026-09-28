import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    // Buscar al usuario con ese token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    // Validar token y caducidad
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'El enlace es inválido o ha expirado.' }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Actualizar usuario y limpiar los campos del token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: 'Contraseña actualizada con éxito' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
