import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signSession, createSessionCookie, getSession, SESSION_COOKIE_NAME } from '@/lib/session';

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { action, email, password, name } = data;

    // ── REGISTER ────────────────────────────────────────────────────────────
    if (action === 'register') {
      const { companyMode, companyName, inviteCode } = data;

      if (!email || !password || !name || !companyMode) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos para el registro' },
          { status: 400 }
        );
      }
      
      if (companyMode === 'create' && !companyName) {
        return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 400 });
      }
      
      if (companyMode === 'join' && !inviteCode) {
        return NextResponse.json({ error: 'El código de invitación es requerido' }, { status: 400 });
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un usuario registrado con este correo' },
          { status: 400 }
        );
      }

      // If joining, verify the invite code before hashing the password
      let targetCompanyId = null;
      if (companyMode === 'join') {
        const company = await prisma.company.findUnique({ where: { inviteCode } });
        if (!company) {
          return NextResponse.json({ error: 'El código de invitación no es válido' }, { status: 400 });
        }
        targetCompanyId = company.id;
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      let user;
      
      if (companyMode === 'create') {
        // Create user and company in a transaction, or create user then company then link.
        // It's easier to create the user, then create the company with ownerId, then update user.
        user = await prisma.user.create({
          data: { email, name, passwordHash, companyRole: 'owner' },
        });
        
        const company = await prisma.company.create({
          data: { name: companyName, ownerId: user.id },
        });
        
        user = await prisma.user.update({
          where: { id: user.id },
          data: { companyId: company.id },
        });
      } else {
        // Join existing company
        user = await prisma.user.create({
          data: { email, name, passwordHash, companyId: targetCompanyId, companyRole: 'member' },
        });
      }

      const token = await signSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
        companyRole: user.companyRole,
      });

      const res = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, companyId: user.companyId, companyRole: user.companyRole },
      });
      res.cookies.set(createSessionCookie(token));
      return res;
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Correo y contraseña son requeridos' },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
      }

      // Verify password — supports legacy plain-text passwords with auto-migration
      let passwordValid = await bcrypt.compare(password, user.passwordHash);

      if (!passwordValid) {
        // Legacy: plain-text stored before bcrypt was added → migrate transparently
        if (user.passwordHash === password) {
          passwordValid = true;
          const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
        }
      }

      if (!passwordValid) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
      }

      if (!user.companyId) {
        return NextResponse.json({ error: 'Tu cuenta ha sido desactivada o no pertenece a ninguna empresa.' }, { status: 401 });
      }

      const token = await signSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
        companyRole: user.companyRole,
      });

      const res = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, companyId: user.companyId, companyRole: user.companyRole },
      });
      res.cookies.set(createSessionCookie(token));
      return res;
    }

    // ── LOGOUT ───────────────────────────────────────────────────────────────
    if (action === 'logout') {
      const res = NextResponse.json({ ok: true });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: true,
        maxAge: 0,
        path: '/',
      });
      return res;
    }

    // ── ME (check current session) ───────────────────────────────────────────
    if (action === 'me') {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
      }
      return NextResponse.json({ user: session });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
