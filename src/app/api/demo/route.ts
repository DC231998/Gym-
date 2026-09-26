import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE() {
  try {
    // Delete transactions and demo records
    await prisma.quoteItem.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.packageItem.deleteMany();
    await prisma.package.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.filamentPurchase.deleteMany();
    await prisma.filament.deleteMany();
    await prisma.printerMaintenance.deleteMany();
    await prisma.printer.deleteMany();
    await prisma.customer.deleteMany();

    return NextResponse.json({ success: true, message: 'Todos los datos demo y transacciones han sido eliminados.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
