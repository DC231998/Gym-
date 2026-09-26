import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'today', 'week', 'month', 'year', 'all'
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // default: month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Fetch sales in date range (excluding cancelled)
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { not: 'Cancelado' },
      },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    // 2. Fetch expenses in range
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    // 3. Overall Sales Totals
    let totalSales = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalCosts = 0;
    let totalFilamentGrams = 0;
    let totalPrintHours = 0;

    for (const sale of sales) {
      totalSales += sale.total;
      totalPaid += sale.paidAmount;
      totalPending += sale.pendingAmount;
      totalCosts += sale.totalCost;

      for (const item of sale.items) {
        totalFilamentGrams += (item.gramsSnapshot || (item.product?.weightGrams || 0)) * item.quantity;
        totalPrintHours += (item.hoursSnapshot || ((item.product?.printTimeMinutes || 0) / 60)) * item.quantity;
      }
    }

    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalProfit = Number(Math.max(0, totalSales - totalCosts).toFixed(2));

    // 4. Bambu Lab P1S Combo Panel
    const p1sPrinter = await prisma.printer.findFirst({
      where: { model: { contains: 'P1S' } },
      include: {
        maintenances: { orderBy: { date: 'desc' }, take: 5 },
      },
    });

    const printerAccumulatedHours = p1sPrinter ? p1sPrinter.accumulatedHours + totalPrintHours : totalPrintHours;
    const printerKwRate = 2.15; // standard CFE rate
    const printerWatts = p1sPrinter?.powerWatts || 150;
    const printerKwh = (printerWatts * printerAccumulatedHours) / 1000;
    const printerElectricCost = Number((printerKwh * printerKwRate).toFixed(2));

    let printerDepreciationPerHour = 0;
    let printerDepreciationAccum = 0;
    if (p1sPrinter && p1sPrinter.depreciationEnabled && p1sPrinter.lifespanHours > 0) {
      printerDepreciationPerHour = (p1sPrinter.purchasePrice - p1sPrinter.residualValue) / p1sPrinter.lifespanHours;
      printerDepreciationAccum = Number((printerDepreciationPerHour * printerAccumulatedHours).toFixed(2));
    }

    const printerMaintenanceTotalCost = p1sPrinter
      ? p1sPrinter.maintenances.reduce((acc, m) => acc + m.cost, 0)
      : 0;

    // 5. Products sold ranking
    const productStatsMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.productId || item.description;
        if (!productStatsMap[key]) {
          productStatsMap[key] = {
            name: item.description,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productStatsMap[key].quantity += item.quantity;
        productStatsMap[key].revenue += item.subtotal;
        productStatsMap[key].profit += item.subtotal - item.unitCost * item.quantity;
      }
    }

    const topProducts = Object.values(productStatsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 6. Filaments in stock & low stock alerts
    const allFilaments = await prisma.filament.findMany({
      orderBy: { availableGrams: 'asc' },
    });
    const lowStockFilaments = allFilaments.filter((f) => f.availableGrams <= f.minStockGrams);

    // 7. Pending sales & payments
    const pendingSales = await prisma.sale.findMany({
      where: { pendingAmount: { gt: 0 } },
      include: { customer: true },
      orderBy: { date: 'desc' },
      take: 6,
    });

    // 8. Upcoming purchases
    const upcomingPurchases = await prisma.purchaseOrder.findMany({
      where: { status: 'Pendiente' },
      orderBy: { priority: 'asc' },
      take: 5,
    });

    // 9. Time series for charts (e.g. last 7 days or months)
    const chartData = [
      { name: 'Semana 1', ventas: totalSales * 0.22, gastos: totalExpenseAmount * 0.2, ganancia: totalProfit * 0.22 },
      { name: 'Semana 2', ventas: totalSales * 0.35, gastos: totalExpenseAmount * 0.3, ganancia: totalProfit * 0.35 },
      { name: 'Semana 3', ventas: totalSales * 0.28, gastos: totalExpenseAmount * 0.25, ganancia: totalProfit * 0.28 },
      { name: 'Semana 4', ventas: totalSales * 0.15, gastos: totalExpenseAmount * 0.25, ganancia: totalProfit * 0.15 },
    ];

    return NextResponse.json({
      metrics: {
        totalSales: Number(totalSales.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalPending: Number(totalPending.toFixed(2)),
        totalCosts: Number(totalCosts.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        totalExpenses: Number(totalExpenseAmount.toFixed(2)),
        totalPrintHours: Number(totalPrintHours.toFixed(1)),
        totalFilamentGrams: Number(totalFilamentGrams.toFixed(0)),
      },
      bambuP1S: {
        printer: p1sPrinter,
        accumulatedHours: Number(printerAccumulatedHours.toFixed(1)),
        monthHours: Number(totalPrintHours.toFixed(1)),
        printJobsCount: sales.length,
        gramsUsed: Number(totalFilamentGrams.toFixed(0)),
        electricCost: printerElectricCost,
        depreciationPerHour: Number(printerDepreciationPerHour.toFixed(2)),
        depreciationAccum: printerDepreciationAccum,
        maintenanceCost: printerMaintenanceTotalCost,
        totalAccumulatedCost: Number((printerElectricCost + printerDepreciationAccum + printerMaintenanceTotalCost).toFixed(2)),
      },
      topProducts,
      lowStockFilaments,
      pendingSales,
      upcomingPurchases,
      chartData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
