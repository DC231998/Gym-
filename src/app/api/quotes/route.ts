import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: { include: { images: true } },
            package: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(quotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'La cotización debe contener al menos un producto' }, { status: 400 });
    }

    const count = await prisma.quote.count();
    const currentYear = new Date().getFullYear();
    const quoteNumber = `COT-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    for (const item of data.items) {
      const q = Math.max(1, Number(item.quantity || 1));
      subtotal += Number(item.unitPrice || 0) * q;
    }

    const discount = Math.max(0, Number(data.discount || 0));
    const total = Math.max(0, subtotal - discount);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: data.customerId || null,
        customerName: data.customerName || 'Público General',
        customerPhone: data.customerPhone || '',
        date: data.date ? new Date(data.date) : new Date(),
        validityDays: Number(data.validityDays || 15),
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        total: Number(total.toFixed(2)),
        status: 'vigente',
        notes: data.notes || '',
      },
    });

    for (const item of data.items) {
      const q = Math.max(1, Number(item.quantity || 1));
      const uPrice = Number(item.unitPrice || 0);
      await prisma.quoteItem.create({
        data: {
          quoteId: quote.id,
          productId: item.productId || null,
          packageId: item.packageId || null,
          description: item.description || 'Artículo impreso',
          quantity: q,
          unitPrice: uPrice,
          subtotal: Number((uPrice * q).toFixed(2)),
        },
      });
    }

    const created = await prisma.quote.findUnique({
      where: { id: quote.id },
      include: { customer: true, items: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const updated = await prisma.quote.update({
      where: { id: data.id },
      data: {
        status: data.status,
        notes: data.notes,
        validityDays: data.validityDays !== undefined ? Number(data.validityDays) : undefined,
      },
      include: { customer: true, items: true },
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

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
