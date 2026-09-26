import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
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
    const data = await request.json();
    if (!data.description || !data.amount || !data.category) {
      return NextResponse.json({ error: 'Descripción, monto y categoría son obligatorios' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
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
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const updated = await prisma.expense.update({
      where: { id: data.id },
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

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
