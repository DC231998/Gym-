import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete transactions and demo records
    await prisma.quoteItem.deleteMany({ where: { companyId: session.companyId } });
    await prisma.quote.deleteMany({ where: { companyId: session.companyId } });
    await prisma.payment.deleteMany({ where: { companyId: session.companyId } });
    await prisma.saleItem.deleteMany({ where: { companyId: session.companyId } });
    await prisma.sale.deleteMany({ where: { companyId: session.companyId } });
    await prisma.inventoryMovement.deleteMany({ where: { companyId: session.companyId } });
    await prisma.expense.deleteMany({ where: { companyId: session.companyId } });
    await prisma.purchaseOrder.deleteMany({ where: { companyId: session.companyId } });
    await prisma.packageItem.deleteMany({ where: { companyId: session.companyId } });
    await prisma.package.deleteMany({ where: { companyId: session.companyId } });
    await prisma.productImage.deleteMany({ where: { companyId: session.companyId } });
    await prisma.product.deleteMany({ where: { companyId: session.companyId } });
    await prisma.filamentPurchase.deleteMany({ where: { companyId: session.companyId } });
    await prisma.filament.deleteMany({ where: { companyId: session.companyId } });
    await prisma.printerMaintenance.deleteMany({ where: { companyId: session.companyId } });
    await prisma.printer.deleteMany({ where: { companyId: session.companyId } });
    await prisma.customer.deleteMany({ where: { companyId: session.companyId } });

    return NextResponse.json({ success: true, message: 'Todos los datos demo y transacciones han sido eliminados.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
