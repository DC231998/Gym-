import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateFilamentPricePerGram } from '@/lib/calculations';

export async function GET() {
  try {
    const filaments = await prisma.filament.findMany({
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(filaments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.brand || !data.materialType || !data.colorName) {
      return NextResponse.json({ error: 'Marca, tipo y color son requeridos' }, { status: 400 });
    }

    const purchasePrice = Number(data.purchasePrice || 0);
    const purchaseWeightGrams = Number(data.purchaseWeightGrams || 1000);
    const availableGrams = data.availableGrams !== undefined ? Number(data.availableGrams) : purchaseWeightGrams;
    const pricePerGram = calculateFilamentPricePerGram(purchasePrice, purchaseWeightGrams);

    const filament = await prisma.filament.create({
      data: {
        brand: data.brand,
        materialType: data.materialType,
        name: data.name || `${data.brand} ${data.materialType} ${data.colorName}`,
        colorName: data.colorName,
        colorHex: data.colorHex || '#1A1A1A',
        purchasePrice,
        purchaseWeightGrams,
        availableGrams,
        pricePerGram,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        supplier: data.supplier || 'Proveedor Local',
        minStockGrams: Number(data.minStockGrams || 200),
        density: Number(data.density || 1.24),
        printTemp: data.printTemp ? Number(data.printTemp) : 215,
        bedTemp: data.bedTemp ? Number(data.bedTemp) : 60,
        notes: data.notes || '',
      },
    });

    // Record initial inventory movement
    await prisma.inventoryMovement.create({
      data: {
        itemType: 'filament',
        itemId: filament.id,
        movementType: 'entrada',
        quantity: availableGrams,
        previousStock: 0,
        newStock: availableGrams,
        reason: 'Registro inicial de bobina',
      },
    });

    return NextResponse.json(filament, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const current = await prisma.filament.findUnique({ where: { id: data.id } });
    if (!current) return NextResponse.json({ error: 'Filamento no encontrado' }, { status: 404 });

    const purchasePrice = data.purchasePrice !== undefined ? Number(data.purchasePrice) : current.purchasePrice;
    const purchaseWeightGrams = data.purchaseWeightGrams !== undefined ? Number(data.purchaseWeightGrams) : current.purchaseWeightGrams;
    const pricePerGram = calculateFilamentPricePerGram(purchasePrice, purchaseWeightGrams);
    const newAvailableGrams = data.availableGrams !== undefined ? Number(data.availableGrams) : current.availableGrams;

    // If stock changed manually, log movement
    if (data.availableGrams !== undefined && data.availableGrams !== current.availableGrams) {
      const diff = newAvailableGrams - current.availableGrams;
      await prisma.inventoryMovement.create({
        data: {
          itemType: 'filament',
          itemId: current.id,
          movementType: diff >= 0 ? 'entrada' : 'ajuste',
          quantity: Math.abs(diff),
          previousStock: current.availableGrams,
          newStock: newAvailableGrams,
          reason: data.adjustmentReason || 'Ajuste manual de stock',
        },
      });
    }

    const updated = await prisma.filament.update({
      where: { id: data.id },
      data: {
        brand: data.brand,
        materialType: data.materialType,
        name: data.name,
        colorName: data.colorName,
        colorHex: data.colorHex,
        purchasePrice,
        purchaseWeightGrams,
        availableGrams: newAvailableGrams,
        pricePerGram,
        supplier: data.supplier,
        minStockGrams: data.minStockGrams !== undefined ? Number(data.minStockGrams) : undefined,
        density: data.density !== undefined ? Number(data.density) : undefined,
        printTemp: data.printTemp !== undefined ? Number(data.printTemp) : undefined,
        bedTemp: data.bedTemp !== undefined ? Number(data.bedTemp) : undefined,
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

    await prisma.filament.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
