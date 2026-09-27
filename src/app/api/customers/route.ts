import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: { companyId: session.companyId },
      include: {
        sales: {
          select: {
            id: true,
            saleNumber: true,
            total: true,
            paidAmount: true,
            pendingAmount: true,
            status: true,
            date: true,
          },
        },
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            status: true,
            date: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = customers.map((c) => {
      const totalSpent = c.sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const totalPending = c.sales.reduce((acc, s) => acc + (s.pendingAmount || 0), 0);
      const orderCount = c.sales.length;
      return {
        ...c,
        totalSpent,
        totalPending,
        orderCount,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || '',
        whatsapp: data.whatsapp || data.phone || '',
        email: data.email || '',
        address: data.address || '',
        neighborhood: data.neighborhood || '',
        city: data.city || 'Tarímbaro',
        state: data.state || 'Michoacán',
        notes: data.notes || '',
        companyId: session.companyId,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const existing = await prisma.customer.findFirst({
      where: { id: data.id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found or Unauthorized' }, { status: 404 });
    }

    await prisma.customer.updateMany({
      where: { id: data.id, companyId: session.companyId },
      data: {
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        notes: data.notes,
      },
    });

    const updated = await prisma.customer.findFirst({
      where: { id: data.id, companyId: session.companyId },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await prisma.customer.deleteMany({
      where: { id, companyId: session.companyId }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
