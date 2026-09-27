import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

const CURRENT_BACKUP_VERSION = '1.0.0';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.businessSettings.findFirst({ where: { id: 'default', companyId: session.companyId } });
    const printers = await prisma.printer.findMany({ where: { companyId: session.companyId }, include: { maintenances: true } });
    const filaments = await prisma.filament.findMany({ where: { companyId: session.companyId }, include: { purchases: true } });
    const categories = await prisma.category.findMany({ where: { companyId: session.companyId } });
    const seasons = await prisma.season.findMany({ where: { companyId: session.companyId } });
    const products = await prisma.product.findMany({ where: { companyId: session.companyId }, include: { images: true } });
    const packages = await prisma.package.findMany({ where: { companyId: session.companyId }, include: { items: true } });
    const customers = await prisma.customer.findMany({ where: { companyId: session.companyId } });
    const sales = await prisma.sale.findMany({ where: { companyId: session.companyId }, include: { items: true, payments: true } });
    const expenses = await prisma.expense.findMany({ where: { companyId: session.companyId } });
    const purchases = await prisma.purchaseOrder.findMany({ where: { companyId: session.companyId } });
    const inventoryMovements = await prisma.inventoryMovement.findMany({ where: { companyId: session.companyId } });
    const quotes = await prisma.quote.findMany({ where: { companyId: session.companyId }, include: { items: true } });

    const backupData = {
      backupVersion: CURRENT_BACKUP_VERSION,
      appName: '3D Business Manager',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        printers,
        filaments,
        categories,
        seasons,
        products,
        packages,
        customers,
        sales,
        expenses,
        purchases,
        inventoryMovements,
        quotes,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="3D_Business_Manager_Backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
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

    const body = await request.json();
    const { mode, backup } = body; // mode: 'replace' | 'merge'

    if (!backup || !backup.backupVersion || !backup.data) {
      return NextResponse.json(
        { error: 'Archivo de respaldo inválido o corrupto. Debe contener backupVersion y objeto data.' },
        { status: 400 }
      );
    }

    const { data } = backup;

    if (mode === 'replace') {
      // Clean all tables safely in foreign key order
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
      await prisma.category.deleteMany({ where: { companyId: session.companyId } });
      await prisma.season.deleteMany({ where: { companyId: session.companyId } });
    }

    const handleUpsert = async (model: any, id: string, rest: any) => {
      const existing = await model.findFirst({ where: { id, companyId: session.companyId } });
      if (existing) {
        await model.updateMany({
          where: { id, companyId: session.companyId },
          data: rest,
        });
      } else {
        await model.create({
          data: { ...rest, id, companyId: session.companyId },
        });
      }
    };

    // 1. Settings
    if (data.settings) {
      const { id, createdAt, updatedAt, ...restSettings } = data.settings;
      const existingSettings = await prisma.businessSettings.findFirst({ where: { id: 'default', companyId: session.companyId } });
      if (existingSettings) {
        await prisma.businessSettings.updateMany({
          where: { id: 'default', companyId: session.companyId },
          data: restSettings,
        });
      } else {
        await prisma.businessSettings.create({
          data: { ...restSettings, id: 'default', companyId: session.companyId },
        });
      }
    }

    // 2. Categories
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        const { products, _count, createdAt, updatedAt, ...rest } = cat;
        await handleUpsert(prisma.category, cat.id, rest);
      }
    }

    // 3. Seasons
    if (Array.isArray(data.seasons)) {
      for (const sea of data.seasons) {
        const { products, _count, createdAt, updatedAt, ...rest } = sea;
        await handleUpsert(prisma.season, sea.id, rest);
      }
    }

    // 4. Filaments
    if (Array.isArray(data.filaments)) {
      for (const fil of data.filaments) {
        const { purchases, products, printJobs, createdAt, updatedAt, ...rest } = fil;
        await handleUpsert(prisma.filament, fil.id, rest);
      }
    }

    // 5. Printers
    if (Array.isArray(data.printers)) {
      for (const pr of data.printers) {
        const { maintenances, printJobs, createdAt, updatedAt, ...rest } = pr;
        await handleUpsert(prisma.printer, pr.id, rest);
        if (Array.isArray(maintenances)) {
          for (const m of maintenances) {
            const { createdAt, updatedAt, ...mRest } = m;
            await handleUpsert(prisma.printerMaintenance, m.id, mRest);
          }
        }
      }
    }

    // 6. Products
    if (Array.isArray(data.products)) {
      for (const p of data.products) {
        const { images, packageItems, saleItems, quoteItems, printJobs, category, season, filament, createdAt, updatedAt, ...rest } = p;
        await handleUpsert(prisma.product, p.id, rest);
        if (Array.isArray(images)) {
          for (const img of images) {
            const { createdAt, ...imgRest } = img;
            await handleUpsert(prisma.productImage, img.id, imgRest);
          }
        }
      }
    }

    // 7. Customers
    if (Array.isArray(data.customers)) {
      for (const c of data.customers) {
        const { sales, quotes, createdAt, updatedAt, ...rest } = c;
        await handleUpsert(prisma.customer, c.id, rest);
      }
    }

    // 8. Packages
    if (Array.isArray(data.packages)) {
      for (const pkg of data.packages) {
        const { items, saleItems, quoteItems, createdAt, updatedAt, ...rest } = pkg;
        await handleUpsert(prisma.package, pkg.id, rest);
        if (Array.isArray(items)) {
          for (const it of items) {
            const { createdAt, updatedAt, ...itRest } = it;
            await handleUpsert(prisma.packageItem, it.id, itRest);
          }
        }
      }
    }

    // 9. Sales
    if (Array.isArray(data.sales)) {
      for (const s of data.sales) {
        const { items, payments, customer, createdAt, updatedAt, ...rest } = s;
        await handleUpsert(prisma.sale, s.id, rest);
        if (Array.isArray(items)) {
          for (const it of items) {
            const { createdAt, ...itRest } = it;
            await handleUpsert(prisma.saleItem, it.id, itRest);
          }
        }
        if (Array.isArray(payments)) {
          for (const pay of payments) {
            const { createdAt, ...payRest } = pay;
            await handleUpsert(prisma.payment, pay.id, payRest);
          }
        }
      }
    }

    // 10. Expenses
    if (Array.isArray(data.expenses)) {
      for (const ex of data.expenses) {
        const { createdAt, updatedAt, ...rest } = ex;
        await handleUpsert(prisma.expense, ex.id, rest);
      }
    }

    // 11. Purchases
    if (Array.isArray(data.purchases)) {
      for (const po of data.purchases) {
        const { createdAt, updatedAt, ...rest } = po;
        await handleUpsert(prisma.purchaseOrder, po.id, rest);
      }
    }

    return NextResponse.json({ success: true, message: `Respaldo importado correctamente (${mode})` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
