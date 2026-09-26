import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const purchases = await prisma.purchaseOrder.findMany({
      where,
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }],
    });

    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.itemTitle) return NextResponse.json({ error: 'Título del artículo es requerido' }, { status: 400 });

    const po = await prisma.purchaseOrder.create({
      data: {
        itemTitle: data.itemTitle,
        supplier: data.supplier || '',
        quantity: Number(data.quantity || 1),
        estimatedPrice: Number(data.estimatedPrice || 0),
        priority: data.priority || 'Media',
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status || 'Pendiente',
        category: data.category || 'Filamento',
        notes: data.notes || '',
      },
    });

    return NextResponse.json(po, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const current = await prisma.purchaseOrder.findUnique({ where: { id: data.id } });
    if (!current) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

    // If transitioned to "Comprado" and requested to register as expense
    if (data.status === 'Comprado' && current.status !== 'Comprado' && data.createExpense) {
      await prisma.expense.create({
        data: {
          category: current.category || 'Otros',
          description: `Compra: ${current.itemTitle} (x${current.quantity})`,
          amount: current.estimatedPrice,
          paymentMethod: data.expensePaymentMethod || 'Efectivo',
          supplier: current.supplier || '',
          date: new Date(),
        },
      });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: data.id },
      data: {
        itemTitle: data.itemTitle,
        supplier: data.supplier,
        quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
        estimatedPrice: data.estimatedPrice !== undefined ? Number(data.estimatedPrice) : undefined,
        priority: data.priority,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status,
        category: data.category,
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

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
