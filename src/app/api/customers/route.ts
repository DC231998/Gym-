import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
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
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const updated = await prisma.customer.update({
      where: { id: data.id },
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

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
