import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateProfitDistribution } from '@/lib/calculations';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: {
          include: {
            product: true,
            package: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (quote.status === 'convertida') {
      return NextResponse.json({ error: 'Esta cotización ya fue convertida previamente' }, { status: 400 });
    }

    const settings = (await prisma.businessSettings.findUnique({ where: { id: 'default' } })) || {
      defaultElectricityRate: 2.15,
      profitReinvestmentPercent: 40,
      profitMaintenancePercent: 20,
      profitOwnerPercent: 40,
    };

    const count = await prisma.sale.count();
    const currentYear = new Date().getFullYear();
    const saleNumber = `VEN-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    let totalCost = 0;
    for (const item of quote.items) {
      const uCost = item.product?.realCost || (item.package?.totalCost || 0);
      totalCost += uCost * item.quantity;
    }

    const totalProfit = Number((quote.total - totalCost).toFixed(2));
    const dist = calculateProfitDistribution(
      totalProfit,
      settings.profitReinvestmentPercent,
      settings.profitMaintenancePercent,
      settings.profitOwnerPercent
    );

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        date: new Date(),
        customerId: quote.customerId,
        customerName: quote.customerName,
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        totalCost: Number(totalCost.toFixed(2)),
        totalProfit,
        paidAmount: 0,
        pendingAmount: quote.total,
        status: 'Pendiente',
        notes: `Convertida desde ${quote.quoteNumber}. ${quote.notes || ''}`,
        reinvestmentAmount: dist.reinvestment,
        maintenanceAmount: dist.maintenance,
        ownerProfitAmount: dist.owner,
      },
    });

    for (const item of quote.items) {
      const uCost = item.product?.realCost || (item.package?.totalCost || 0);
      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          packageId: item.packageId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: uCost,
          subtotal: item.subtotal,
          filamentCostSnapshot: item.product?.filamentCost || 0,
          electricityCostSnapshot: item.product?.electricityCost || 0,
          depreciationSnapshot: item.product?.depreciationCost || 0,
          laborSnapshot: item.product?.laborCost || 0,
          gramsSnapshot: item.product?.weightGrams || 0,
          hoursSnapshot: (item.product?.printTimeMinutes || 0) / 60,
          electricityRateSnapshot: Number(settings.defaultElectricityRate),
        },
      });
    }

    // Mark quote as converted
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'convertida',
        convertedToSaleId: sale.id,
      },
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
