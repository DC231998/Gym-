import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateSaleBalance } from '@/lib/calculations';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const data = await request.json();

    const paymentAmount = Number(data.amount || 0);
    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'El monto del pago debe ser mayor a 0' }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { payments: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    const currentPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
    const remainingPending = Number((sale.total - currentPaid).toFixed(2));

    if (paymentAmount > remainingPending + 0.01) {
      return NextResponse.json(
        {
          error: `El pago (${paymentAmount}) excede el saldo pendiente ($${remainingPending.toFixed(2)}). Ajusta el monto.`,
        },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        saleId,
        date: data.date ? new Date(data.date) : new Date(),
        amount: paymentAmount,
        method: data.method || 'Efectivo',
        reference: data.reference || '',
        notes: data.notes || '',
      },
    });

    const newPaidAmount = Number((currentPaid + paymentAmount).toFixed(2));
    const { pending } = calculateSaleBalance(sale.total, newPaidAmount);

    // If fully paid and status was pending, optionally advance
    let newStatus = sale.status;
    if (pending <= 0 && (sale.status === 'Pendiente' || sale.status === 'Listo')) {
      newStatus = sale.status === 'Listo' ? 'Entregado' : 'En producción';
    }

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: pending,
        status: newStatus,
      },
      include: {
        payments: { orderBy: { date: 'asc' } },
        items: true,
        customer: true,
      },
    });

    return NextResponse.json({ payment, sale: updatedSale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) return NextResponse.json({ error: 'paymentId es requerido' }, { status: 400 });

    await prisma.payment.delete({ where: { id: paymentId } });

    // Recalculate sale balance
    const payments = await prisma.payment.findMany({ where: { saleId } });
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });

    const { pending } = calculateSaleBalance(sale.total, totalPaid);

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: Number(totalPaid.toFixed(2)),
        pendingAmount: pending,
      },
      include: {
        payments: true,
        items: true,
        customer: true,
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
