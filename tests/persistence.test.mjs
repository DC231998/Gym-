import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('Verificación de persistencia real en base de datos', async (t) => {
  await t.test('1. Persistencia de configuración del negocio', async () => {
    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
    assert.ok(settings, 'La configuración debe existir en la base de datos');
    assert.equal(settings.id, 'default');
    assert.ok(settings.defaultElectricityRate > 0, 'La tarifa eléctrica debe estar persistida');
  });

  await t.test('2. Creación, consulta y persistencia de producto con imagen', async () => {
    const category = await prisma.category.findFirst();
    const season = await prisma.season.findFirst();
    assert.ok(category && season, 'Categorías y temporadas deben existir en la base de datos');

    const testSku = `TEST-PRD-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        sku: testSku,
        name: 'Producto de Prueba de Persistencia',
        categoryId: category.id,
        seasonId: season.id,
        salePrice: 150.0,
        realCost: 65.0,
        stock: 10,
        images: {
          create: [{ url: 'data:image/svg+xml;utf8,<svg></svg>', isPrimary: true }],
        },
      },
      include: { images: true },
    });

    assert.ok(product.id, 'El producto debe tener un ID único persistido');
    assert.equal(product.sku, testSku);
    assert.equal(product.images.length, 1);

    // Consulta directa desde la base de datos para comprobar que persistió
    const fetched = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: true },
    });
    assert.equal(fetched?.name, 'Producto de Prueba de Persistencia');
    assert.equal(fetched?.stock, 10);

    // Modificación de stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: 8 },
    });

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    assert.equal(updated?.stock, 8, 'La actualización de stock debe persistir');

    // Limpieza del registro de prueba
    await prisma.product.delete({ where: { id: product.id } });
    const afterDelete = await prisma.product.findUnique({ where: { id: product.id } });
    assert.equal(afterDelete, null, 'El producto eliminado no debe existir');
  });

  await t.test('3. Persistencia de ventas y pagos parciales', async () => {
    const sale = await prisma.sale.findFirst({
      include: { items: true, payments: true },
    });
    assert.ok(sale, 'Debe existir al menos una venta persistida');
    assert.ok(sale.total > 0);
    assert.ok(sale.items.length > 0, 'Los items de venta con snapshot deben persistir');
  });

  await t.test('4. Impresora Bambu Lab P1S Combo persistida', async () => {
    const printer = await prisma.printer.findFirst({
      where: { model: 'P1S Combo' },
      include: { maintenances: true },
    });
    assert.ok(printer, 'La impresora Bambu Lab P1S Combo debe estar persistida');
    assert.ok(printer.accumulatedHours >= 0);
    assert.equal(printer.brand, 'Bambu Lab');
  });
});
