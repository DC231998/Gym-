import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateFilamentPricePerGram } from '@/lib/calculations';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filaments = await prisma.filament.findMany({
      where: { companyId: session.companyId },
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
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.brand || !data.materialType || !data.colorName) {
      return NextResponse.json({ error: 'Marca, tipo y color son requeridos' }, { status: 400 });
    }

    const purchasePrice = Number(data.purchasePrice || 0);
    const purchaseWeightGrams = Number(data.purchaseWeightGrams || 1000);
    const availableGrams = data.availableGrams !== undefined ? Number(data.availableGrams) : purchaseWeightGrams;
    const pricePerGram = calculateFilamentPricePerGram(purchasePrice, purchaseWeightGrams);
    const isGift = Boolean(data.isGift);

    const name = data.name || `${data.brand} ${data.materialType} ${data.colorName}`;
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
    const supplier = data.supplier || 'Proveedor Local';

    const result = await prisma.$transaction(async (tx) => {
      let expenseId: string | null = null;

      // Si NO es obsequio, crear el gasto primero
      if (!isGift) {
        const expense = await tx.expense.create({
          data: {
            companyId: session.companyId,
            category: "Filamento",
            amount: purchasePrice,
            date: purchaseDate,
            supplier: supplier,
            description: `Compra de filamento: ${name}`,
          }
        });
        expenseId = expense.id;
      }

      const filament = await tx.filament.create({
        data: {
          companyId: session.companyId,
          brand: data.brand,
          materialType: data.materialType,
          name,
          colorName: data.colorName,
          colorHex: data.colorHex || '#1A1A1A',
          purchasePrice,
          purchaseWeightGrams,
          availableGrams,
          pricePerGram,
          purchaseDate,
          supplier,
          isGift,
          expenseId,
          minStockGrams: Number(data.minStockGrams || 200),
          density: Number(data.density || 1.24),
          printTemp: data.printTemp ? Number(data.printTemp) : 215,
          bedTemp: data.bedTemp ? Number(data.bedTemp) : 60,
          notes: data.notes || '',
        },
      });

      // Record initial inventory movement
      await tx.inventoryMovement.create({
        data: {
          companyId: session.companyId,
          itemType: 'filament',
          itemId: filament.id,
          movementType: 'entrada',
          quantity: availableGrams,
          previousStock: 0,
          newStock: availableGrams,
          reason: 'Registro inicial de bobina',
        },
      });

      return filament;
    });

    return NextResponse.json(result, { status: 201 });
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

    const current = await prisma.filament.findFirst({ where: { id: data.id, companyId: session.companyId } });
    if (!current) return NextResponse.json({ error: 'Filamento no encontrado' }, { status: 404 });

    const purchasePrice = data.purchasePrice !== undefined ? Number(data.purchasePrice) : current.purchasePrice;
    const purchaseWeightGrams = data.purchaseWeightGrams !== undefined ? Number(data.purchaseWeightGrams) : current.purchaseWeightGrams;
    const pricePerGram = calculateFilamentPricePerGram(purchasePrice, purchaseWeightGrams);
    const newAvailableGrams = data.availableGrams !== undefined ? Number(data.availableGrams) : current.availableGrams;
    const isGift = data.isGift !== undefined ? Boolean(data.isGift) : current.isGift;
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : current.purchaseDate;
    const supplier = data.supplier !== undefined ? data.supplier : current.supplier;
    const name = data.name !== undefined ? data.name : current.name;

    const result = await prisma.$transaction(async (tx) => {
      let finalExpenseId = current.expenseId;

      // Handle Expense transitions
      if (!current.isGift && isGift) {
        // Transition: false -> true (borrar gasto si existe)
        if (current.expenseId) {
          await tx.expense.deleteMany({
            where: { id: current.expenseId, companyId: session.companyId }
          });
        }
        finalExpenseId = null;
      } 
      else if (current.isGift && !isGift) {
        // Transition: true -> false (crear gasto)
        const expense = await tx.expense.create({
          data: {
            companyId: session.companyId,
            category: "Filamento",
            amount: purchasePrice,
            date: purchaseDate,
            supplier: supplier,
            description: `Compra de filamento: ${name}`,
          }
        });
        finalExpenseId = expense.id;
      }
      else if (!current.isGift && !isGift) {
        // Transition: false -> false (actualizar gasto si cambió precio, fecha, proveedor, etc y si expenseId existe)
        if (
          current.expenseId &&
          (purchasePrice !== current.purchasePrice || 
           purchaseDate.getTime() !== current.purchaseDate.getTime() ||
           supplier !== current.supplier || 
           name !== current.name)
        ) {
          await tx.expense.updateMany({
            where: { id: current.expenseId, companyId: session.companyId },
            data: {
              amount: purchasePrice,
              date: purchaseDate,
              supplier: supplier,
              description: `Compra de filamento: ${name}`,
            }
          });
        }
      }

      // If stock changed manually, log movement
      if (data.availableGrams !== undefined && data.availableGrams !== current.availableGrams) {
        const diff = newAvailableGrams - current.availableGrams;
        await tx.inventoryMovement.create({
          data: {
            companyId: session.companyId,
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

      await tx.filament.updateMany({
        where: { id: data.id, companyId: session.companyId },
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
          purchaseDate,
          supplier: data.supplier,
          isGift,
          expenseId: finalExpenseId,
          minStockGrams: data.minStockGrams !== undefined ? Number(data.minStockGrams) : undefined,
          density: data.density !== undefined ? Number(data.density) : undefined,
          printTemp: data.printTemp !== undefined ? Number(data.printTemp) : undefined,
          bedTemp: data.bedTemp !== undefined ? Number(data.bedTemp) : undefined,
          notes: data.notes,
        },
      });

      return await tx.filament.findFirst({ where: { id: data.id, companyId: session.companyId } });
    });

    return NextResponse.json(result);
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

    const current = await prisma.filament.findFirst({ where: { id, companyId: session.companyId } });
    if (!current) return NextResponse.json({ error: 'Filamento no encontrado' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (current.expenseId) {
        await tx.expense.deleteMany({
          where: { id: current.expenseId, companyId: session.companyId }
        });
      }
      await tx.filament.deleteMany({ where: { id, companyId: session.companyId } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
