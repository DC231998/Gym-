import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Generar token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora a partir de ahora

      // Guardar token en DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Crear el enlace
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Enviar correo con Resend
      const { data, error } = await resend.emails.send({
        from: '3D Business Manager <onboarding@resend.dev>',
        to: email,
        subject: 'Recuperación de Contraseña - 3D Business Manager',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #10b981;">Restablecer tu contraseña</h2>
            <p>Hola ${user.name},</p>
            <p>Hemos recibido una solicitud para cambiar tu contraseña en 3D Business Manager. Si fuiste tú, haz clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Cambiar Contraseña
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="font-size: 12px; color: #666;">
              Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Error al enviar el correo con Resend:', error);
      }
    }

    // Retornamos éxito genérico independientemente de si el correo existe o no
    return NextResponse.json({ 
      message: 'Si el correo existe en nuestra base de datos, te enviaremos un enlace para restablecer tu contraseña.' 
    });
  } catch (error: any) {
    console.error('Forgot Password error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
