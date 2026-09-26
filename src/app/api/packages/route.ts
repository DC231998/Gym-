import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePackageMetrics } from '@/lib/calculations';

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(packages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'Nombre y al menos un producto son requeridos' }, { status: 400 });
    }

    const sku = data.sku?.trim() || `PKG-${Date.now().toString(36).toUpperCase()}`;

    // Calculate metrics
    const metrics = calculatePackageMetrics(
      data.items.map((i: any) => ({
        unitCost: Number(i.unitCost || 0),
        unitPrice: Number(i.unitPrice || 0),
        quantity: Number(i.quantity || 1),
      })),
      data.discountType || 'percent',
      Number(data.discountValue || 0)
    );

    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        sku,
        description: data.description || '',
        discountType: data.discountType || 'percent',
        discountValue: Number(data.discountValue || 0),
        normalPrice: metrics.normalPrice,
        packagePrice: data.customPrice !== undefined ? Number(data.customPrice) : metrics.packagePrice,
        totalCost: metrics.totalCost,
        profit: (data.customPrice !== undefined ? Number(data.customPrice) : metrics.packagePrice) - metrics.totalCost,
        marginPercent: metrics.marginPercent,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    for (const item of data.items) {
      await prisma.packageItem.create({
        data: {
          packageId: pkg.id,
          productId: item.productId,
          quantity: Number(item.quantity || 1),
          unitCost: Number(item.unitCost || 0),
          unitPrice: Number(item.unitPrice || 0),
        },
      });
    }

    const created = await prisma.package.findUnique({
      where: { id: pkg.id },
      include: { items: { include: { product: { include: { images: true } } } } },
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

    if (Array.isArray(data.items) && data.items.length > 0) {
      await prisma.packageItem.deleteMany({ where: { packageId: data.id } });
      for (const item of data.items) {
        await prisma.packageItem.create({
          data: {
            packageId: data.id,
            productId: item.productId,
            quantity: Number(item.quantity || 1),
            unitCost: Number(item.unitCost || 0),
            unitPrice: Number(item.unitPrice || 0),
          },
        });
      }
    }

    const metrics = calculatePackageMetrics(
      (data.items || []).map((i: any) => ({
        unitCost: Number(i.unitCost || 0),
        unitPrice: Number(i.unitPrice || 0),
        quantity: Number(i.quantity || 1),
      })),
      data.discountType || 'percent',
      Number(data.discountValue || 0)
    );

    const updated = await prisma.package.update({
      where: { id: data.id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue !== undefined ? Number(data.discountValue) : undefined,
        normalPrice: metrics.normalPrice,
        packagePrice: data.customPrice !== undefined ? Number(data.customPrice) : metrics.packagePrice,
        totalCost: metrics.totalCost,
        profit: (data.customPrice !== undefined ? Number(data.customPrice) : metrics.packagePrice) - metrics.totalCost,
        marginPercent: metrics.marginPercent,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
      include: { items: { include: { product: { include: { images: true } } } } },
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

    await prisma.package.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
