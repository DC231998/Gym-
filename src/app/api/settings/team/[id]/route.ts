import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.companyRole !== 'owner') {
      return NextResponse.json({ error: 'Only owners can remove members' }, { status: 403 });
    }

    const memberIdToRemove = params.id;

    if (memberIdToRemove === session.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    // Attempt to remove the user by setting companyId to null
    // The where clause ensures the user being removed actually belongs to the caller's company
    const updatedUser = await prisma.user.updateMany({
      where: {
        id: memberIdToRemove,
        companyId: session.companyId,
      },
      data: {
        companyId: null,
        companyRole: 'member', // reset role just in case
      },
    });

    if (updatedUser.count === 0) {
      return NextResponse.json({ error: 'Member not found or not in your company' }, { status: 404 });
    }

    // Regenerate the inviteCode for the company to prevent the removed user from re-joining
    const newInviteCode = require('crypto').randomBytes(8).toString('hex');
    await prisma.company.update({
      where: { id: session.companyId },
      data: { inviteCode: newInviteCode },
    });

    return NextResponse.json({ success: true, newInviteCode });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
