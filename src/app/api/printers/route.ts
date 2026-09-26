import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const printers = await prisma.printer.findMany({
      include: {
        maintenances: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(printers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.brand || !data.model || !data.name) {
      return NextResponse.json({ error: 'Marca, modelo y nombre son obligatorios' }, { status: 400 });
    }

    const printer = await prisma.printer.create({
      data: {
        brand: data.brand,
        model: data.model,
        name: data.name,
        purchasePrice: Number(data.purchasePrice || 0),
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        powerWatts: Number(data.powerWatts || 150),
        accumulatedHours: Number(data.accumulatedHours || 0),
        lifespanHours: Number(data.lifespanHours || 6000),
        residualValue: Number(data.residualValue || 0),
        depreciationEnabled: data.depreciationEnabled !== undefined ? Boolean(data.depreciationEnabled) : true,
        status: data.status || 'activo',
        notes: data.notes || '',
      },
    });

    return NextResponse.json(printer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const updated = await prisma.printer.update({
      where: { id: data.id },
      data: {
        brand: data.brand,
        model: data.model,
        name: data.name,
        purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : undefined,
        powerWatts: data.powerWatts !== undefined ? Number(data.powerWatts) : undefined,
        accumulatedHours: data.accumulatedHours !== undefined ? Number(data.accumulatedHours) : undefined,
        lifespanHours: data.lifespanHours !== undefined ? Number(data.lifespanHours) : undefined,
        residualValue: data.residualValue !== undefined ? Number(data.residualValue) : undefined,
        depreciationEnabled: data.depreciationEnabled !== undefined ? Boolean(data.depreciationEnabled) : undefined,
        status: data.status,
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

    await prisma.printer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
