import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const filaments = await prisma.filament.findMany({
      select: {
        id: true,
        brand: true,
        materialType: true,
        name: true,
        colorName: true,
        colorHex: true,
        availableGrams: true,
        minStockGrams: true,
        pricePerGram: true,
      },
      orderBy: { availableGrams: 'asc' },
    });

    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        minStock: true,
        salePrice: true,
        realCost: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });

    const movements = await prisma.inventoryMovement.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // Compute low stock alerts
    const lowStockFilaments = filaments.filter((f) => f.availableGrams <= f.minStockGrams);
    const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

    return NextResponse.json({
      filaments,
      products,
      movements,
      lowStockFilaments,
      lowStockProducts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { itemType, itemId, movementType, quantity, reason } = data;

    if (!itemType || !itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Tipo, ID y cantidad válida son requeridos' }, { status: 400 });
    }

    let previousStock = 0;
    let newStock = 0;

    if (itemType === 'filament') {
      const fil = await prisma.filament.findUnique({ where: { id: itemId } });
      if (!fil) return NextResponse.json({ error: 'Filamento no encontrado' }, { status: 404 });
      previousStock = fil.availableGrams;

      if (movementType === 'entrada') {
        newStock = previousStock + Number(quantity);
      } else {
        newStock = Math.max(0, previousStock - Number(quantity));
      }

      await prisma.filament.update({
        where: { id: itemId },
        data: { availableGrams: newStock },
      });
    } else {
      const prod = await prisma.product.findUnique({ where: { id: itemId } });
      if (!prod) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
      previousStock = prod.stock;

      if (movementType === 'entrada') {
        newStock = previousStock + Number(quantity);
      } else {
        newStock = Math.max(0, previousStock - Number(quantity));
      }

      await prisma.product.update({
        where: { id: itemId },
        data: { stock: Math.floor(newStock) },
      });
    }

    const movement = await prisma.inventoryMovement.create({
      data: {
        itemType,
        itemId,
        movementType,
        quantity: Number(quantity),
        previousStock,
        newStock,
        reason: reason || 'Ajuste manual de inventario',
      },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
