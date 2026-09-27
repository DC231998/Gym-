import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: Fetch team members and company invite code
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            companyRole: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      inviteCode: company.inviteCode,
      members: company.users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Regenerate invite code (only owners allowed)
export async function PUT() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is owner
    if (session.companyRole !== 'owner') {
      return NextResponse.json({ error: 'Only the company owner can regenerate the invite code' }, { status: 403 });
    }

    // Prisma's cuid() isn't accessible directly without creating, 
    // but we can generate a random string or use crypto
    const crypto = require('crypto');
    const newCode = `inv_${crypto.randomBytes(8).toString('hex')}`;

    const updated = await prisma.company.update({
      where: { id: session.companyId },
      data: { inviteCode: newCode },
    });

    return NextResponse.json({ inviteCode: updated.inviteCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
