import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = { companyId: session.companyId };
    if (category && category !== 'all') where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    return NextResponse.json({ expenses, totalAmount });
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
    if (!data.description || !data.amount || !data.category) {
      return NextResponse.json({ error: 'Descripción, monto y categoría son obligatorios' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        companyId: session.companyId,
        date: data.date ? new Date(data.date) : new Date(),
        category: data.category,
        description: data.description,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod || 'Efectivo',
        supplier: data.supplier || '',
        receiptUrl: data.receiptUrl || '',
        notes: data.notes || '',
      },
    });

    return NextResponse.json(expense, { status: 201 });
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

    const existing = await prisma.expense.findFirst({
      where: { id: data.id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await prisma.expense.updateMany({
      where: { id: data.id, companyId: session.companyId },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        category: data.category,
        description: data.description,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        paymentMethod: data.paymentMethod,
        supplier: data.supplier,
        notes: data.notes,
      },
    });

    const updated = await prisma.expense.findFirst({
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

    await prisma.expense.deleteMany({ where: { id, companyId: session.companyId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
