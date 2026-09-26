import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const printerId = params.id;

    if (!data.type || !data.description) {
      return NextResponse.json({ error: 'Tipo y descripción son obligatorios' }, { status: 400 });
    }

    const maintenance = await prisma.printerMaintenance.create({
      data: {
        printerId,
        date: data.date ? new Date(data.date) : new Date(),
        type: data.type,
        cost: Number(data.cost || 0),
        printerHoursAtMaintenance: Number(data.printerHoursAtMaintenance || 0),
        description: data.description,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        nextDueHours: data.nextDueHours ? Number(data.nextDueHours) : null,
        status: data.status || 'completado',
      },
    });

    // Optionally create an expense record if cost > 0
    if (Number(data.cost) > 0) {
      await prisma.expense.create({
        data: {
          category: 'Mantenimiento',
          description: `Mantenimiento: ${data.type} (${printerId})`,
          amount: Number(data.cost),
          date: data.date ? new Date(data.date) : new Date(),
          paymentMethod: 'Efectivo',
          notes: data.description,
        },
      });
    }

    return NextResponse.json(maintenance, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
