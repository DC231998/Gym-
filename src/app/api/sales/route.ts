import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateProfitDistribution, calculateSaleBalance } from '@/lib/calculations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (customerId && customerId !== 'all') where.customerId = customerId;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: { images: true },
            },
            package: true,
          },
        },
        payments: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'La venta debe contener al menos un producto o paquete' }, { status: 400 });
    }

    // Get business settings for current tariff & distribution percentages
    const settings = (await prisma.businessSettings.findUnique({ where: { id: 'default' } })) || {
      defaultElectricityRate: 2.15,
      profitReinvestmentPercent: 40,
      profitMaintenancePercent: 20,
      profitOwnerPercent: 40,
    };

    // Generate unique sale number
    const count = await prisma.sale.count();
    const currentYear = new Date().getFullYear();
    const saleNumber = `VEN-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let totalCost = 0;

    for (const item of data.items) {
      const q = Math.max(1, Number(item.quantity || 1));
      subtotal += Number(item.unitPrice || 0) * q;
      totalCost += Number(item.unitCost || 0) * q;
    }

    const discount = Math.max(0, Number(data.discount || 0));
    const total = Math.max(0, subtotal - discount);
    const totalProfit = Number((total - totalCost).toFixed(2));

    // Distribution calculation
    const dist = calculateProfitDistribution(
      totalProfit,
      settings.profitReinvestmentPercent,
      settings.profitMaintenancePercent,
      settings.profitOwnerPercent
    );

    // Initial payment if any
    const initialPaymentAmount = Math.max(0, Number(data.initialPaymentAmount || 0));
    const { pending } = calculateSaleBalance(total, initialPaymentAmount);

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        date: data.date ? new Date(data.date) : new Date(),
        customerId: data.customerId || null,
        customerName: data.customerName || 'Público General',
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        total: Number(total.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalProfit,
        paidAmount: initialPaymentAmount,
        pendingAmount: pending,
        status: data.status || 'Pendiente',
        notes: data.notes || '',
        reinvestmentAmount: dist.reinvestment,
        maintenanceAmount: dist.maintenance,
        ownerProfitAmount: dist.owner,
      },
    });

    // Create items with immutable historical cost snapshots
    for (const item of data.items) {
      const q = Math.max(1, Number(item.quantity || 1));
      const uPrice = Number(item.unitPrice || 0);
      const uCost = Number(item.unitCost || 0);

      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId || null,
          packageId: item.packageId || null,
          description: item.description || 'Artículo impreso',
          quantity: q,
          unitPrice: uPrice,
          unitCost: uCost,
          subtotal: Number((uPrice * q).toFixed(2)),
          // Cost calculation snapshot
          filamentCostSnapshot: Number(item.filamentCost || 0),
          electricityCostSnapshot: Number(item.electricityCost || 0),
          depreciationSnapshot: Number(item.depreciationCost || 0),
          laborSnapshot: Number(item.laborCost || 0),
          gramsSnapshot: Number(item.grams || 0),
          hoursSnapshot: Number(item.hours || 0),
          electricityRateSnapshot: Number(settings.defaultElectricityRate),
        },
      });

      // Deduct product stock if product sold directly
      if (item.productId) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (prod && prod.stock > 0) {
          const newStock = Math.max(0, prod.stock - q);
          await prisma.product.update({
            where: { id: prod.id },
            data: { stock: newStock },
          });
          await prisma.inventoryMovement.create({
            data: {
              itemType: 'product',
              itemId: prod.id,
              movementType: 'venta',
              quantity: q,
              previousStock: prod.stock,
              newStock,
              reason: `Venta ${saleNumber}`,
              referenceId: sale.id,
            },
          });
        }
      }
    }

    // Record initial payment if provided
    if (initialPaymentAmount > 0) {
      await prisma.payment.create({
        data: {
          saleId: sale.id,
          date: new Date(),
          amount: initialPaymentAmount,
          method: data.initialPaymentMethod || 'Efectivo',
          reference: data.initialPaymentReference || '',
          notes: 'Pago inicial / anticipo al crear la venta',
        },
      });
    }

    const created = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        items: { include: { product: true, package: true } },
        payments: true,
      },
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

    const updated = await prisma.sale.update({
      where: { id: data.id },
      data: {
        status: data.status,
        notes: data.notes,
        customerId: data.customerId,
        customerName: data.customerName,
      },
      include: {
        customer: true,
        items: { include: { product: true, package: true } },
        payments: true,
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

    await prisma.sale.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
