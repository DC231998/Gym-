import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const CURRENT_BACKUP_VERSION = '1.0.0';

export async function GET() {
  try {
    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
    const printers = await prisma.printer.findMany({ include: { maintenances: true } });
    const filaments = await prisma.filament.findMany({ include: { purchases: true } });
    const categories = await prisma.category.findMany();
    const seasons = await prisma.season.findMany();
    const products = await prisma.product.findMany({ include: { images: true } });
    const packages = await prisma.package.findMany({ include: { items: true } });
    const customers = await prisma.customer.findMany();
    const sales = await prisma.sale.findMany({ include: { items: true, payments: true } });
    const expenses = await prisma.expense.findMany();
    const purchases = await prisma.purchaseOrder.findMany();
    const inventoryMovements = await prisma.inventoryMovement.findMany();
    const quotes = await prisma.quote.findMany({ include: { items: true } });

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
      await prisma.category.deleteMany();
      await prisma.season.deleteMany();
    }

    // 1. Settings
    if (data.settings) {
      const { id, createdAt, updatedAt, ...restSettings } = data.settings;
      await prisma.businessSettings.upsert({
        where: { id: 'default' },
        update: restSettings,
        create: { id: 'default', ...restSettings },
      });
    }

    // 2. Categories
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        const { products, _count, createdAt, updatedAt, ...rest } = cat;
        await prisma.category.upsert({
          where: { id: cat.id },
          update: rest,
          create: rest,
        });
      }
    }

    // 3. Seasons
    if (Array.isArray(data.seasons)) {
      for (const sea of data.seasons) {
        const { products, _count, createdAt, updatedAt, ...rest } = sea;
        await prisma.season.upsert({
          where: { id: sea.id },
          update: rest,
          create: rest,
        });
      }
    }

    // 4. Filaments
    if (Array.isArray(data.filaments)) {
      for (const fil of data.filaments) {
        const { purchases, products, printJobs, createdAt, updatedAt, ...rest } = fil;
        await prisma.filament.upsert({
          where: { id: fil.id },
          update: rest,
          create: rest,
        });
      }
    }

    // 5. Printers
    if (Array.isArray(data.printers)) {
      for (const pr of data.printers) {
        const { maintenances, printJobs, createdAt, updatedAt, ...rest } = pr;
        await prisma.printer.upsert({
          where: { id: pr.id },
          update: rest,
          create: rest,
        });
        if (Array.isArray(maintenances)) {
          for (const m of maintenances) {
            const { createdAt, updatedAt, ...mRest } = m;
            await prisma.printerMaintenance.upsert({
              where: { id: m.id },
              update: mRest,
              create: mRest,
            });
          }
        }
      }
    }

    // 6. Products
    if (Array.isArray(data.products)) {
      for (const p of data.products) {
        const { images, packageItems, saleItems, quoteItems, printJobs, category, season, filament, createdAt, updatedAt, ...rest } = p;
        await prisma.product.upsert({
          where: { id: p.id },
          update: rest,
          create: rest,
        });
        if (Array.isArray(images)) {
          for (const img of images) {
            const { createdAt, ...imgRest } = img;
            await prisma.productImage.upsert({
              where: { id: img.id },
              update: imgRest,
              create: imgRest,
            });
          }
        }
      }
    }

    // 7. Customers
    if (Array.isArray(data.customers)) {
      for (const c of data.customers) {
        const { sales, quotes, createdAt, updatedAt, ...rest } = c;
        await prisma.customer.upsert({
          where: { id: c.id },
          update: rest,
          create: rest,
        });
      }
    }

    // 8. Packages
    if (Array.isArray(data.packages)) {
      for (const pkg of data.packages) {
        const { items, saleItems, quoteItems, createdAt, updatedAt, ...rest } = pkg;
        await prisma.package.upsert({
          where: { id: pkg.id },
          update: rest,
          create: rest,
        });
        if (Array.isArray(items)) {
          for (const it of items) {
            await prisma.packageItem.upsert({
              where: { id: it.id },
              update: it,
              create: it,
            });
          }
        }
      }
    }

    // 9. Sales
    if (Array.isArray(data.sales)) {
      for (const s of data.sales) {
        const { items, payments, customer, createdAt, updatedAt, ...rest } = s;
        await prisma.sale.upsert({
          where: { id: s.id },
          update: rest,
          create: rest,
        });
        if (Array.isArray(items)) {
          for (const it of items) {
            const { createdAt, ...itRest } = it;
            await prisma.saleItem.upsert({
              where: { id: it.id },
              update: itRest,
              create: itRest,
            });
          }
        }
        if (Array.isArray(payments)) {
          for (const pay of payments) {
            const { createdAt, ...payRest } = pay;
            await prisma.payment.upsert({
              where: { id: pay.id },
              update: payRest,
              create: payRest,
            });
          }
        }
      }
    }

    // 10. Expenses
    if (Array.isArray(data.expenses)) {
      for (const ex of data.expenses) {
        const { createdAt, updatedAt, ...rest } = ex;
        await prisma.expense.upsert({
          where: { id: ex.id },
          update: rest,
          create: rest,
        });
      }
    }

    // 11. Purchases
    if (Array.isArray(data.purchases)) {
      for (const po of data.purchases) {
        const { createdAt, updatedAt, ...rest } = po;
        await prisma.purchaseOrder.upsert({
          where: { id: po.id },
          update: rest,
          create: rest,
        });
      }
    }

    return NextResponse.json({ success: true, message: `Respaldo importado correctamente (${mode})` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
