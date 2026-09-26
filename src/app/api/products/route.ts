import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const seasonId = searchParams.get('seasonId');
    const search = searchParams.get('search');

    const where: any = {};
    if (categoryId && categoryId !== 'all') where.categoryId = categoryId;
    if (seasonId && seasonId !== 'all') where.seasonId = seasonId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        season: true,
        filament: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name || !data.categoryId || !data.seasonId) {
      return NextResponse.json({ error: 'Nombre, categoría y temporada son requeridos' }, { status: 400 });
    }

    // Generate automatic SKU if not provided
    const sku = data.sku?.trim() || `PRD-${Date.now().toString(36).toUpperCase()}`;

    // Verify unique SKU
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json({ error: `El SKU ${sku} ya existe` }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name: data.name,
        description: data.description || '',
        categoryId: data.categoryId,
        seasonId: data.seasonId,
        primaryFilamentId: data.primaryFilamentId || null,
        defaultColorHex: data.defaultColorHex || '#1A1A1A',
        defaultColorName: data.defaultColorName || 'Negro',
        weightGrams: Number(data.weightGrams || 0),
        printTimeMinutes: Number(data.printTimeMinutes || 0),
        failureRatePercent: Number(data.failureRatePercent ?? 5),
        filamentCost: Number(data.filamentCost || 0),
        electricityCost: Number(data.electricityCost || 0),
        depreciationCost: Number(data.depreciationCost || 0),
        laborCost: Number(data.laborCost || 0),
        otherCosts: Number(data.otherCosts || 0),
        realCost: Number(data.realCost || 0),
        marginPercent: Number(data.marginPercent || 50),
        salePrice: Number(data.salePrice || 0),
        stock: Number(data.stock || 0),
        minStock: Number(data.minStock || 1),
        status: data.status || 'activo',
        notes: data.notes || '',
      },
    });

    // Handle images if provided
    if (Array.isArray(data.images) && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        const url = typeof img === 'string' ? img : img.url;
        if (url) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url,
              isPrimary: i === 0 || img.isPrimary,
              displayOrder: i,
            },
          });
        }
      }
    }

    // Record initial inventory movement if stock > 0
    if (Number(data.stock) > 0) {
      await prisma.inventoryMovement.create({
        data: {
          itemType: 'product',
          itemId: product.id,
          movementType: 'entrada',
          quantity: Number(data.stock),
          previousStock: 0,
          newStock: Number(data.stock),
          reason: 'Inventario inicial de producto',
        },
      });
    }

    const created = await prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true, season: true, filament: true, images: true },
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

    const current = await prisma.product.findUnique({ where: { id: data.id } });
    if (!current) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    // Track stock change if applicable
    if (data.stock !== undefined && Number(data.stock) !== current.stock) {
      const newStock = Number(data.stock);
      const diff = newStock - current.stock;
      await prisma.inventoryMovement.create({
        data: {
          itemType: 'product',
          itemId: current.id,
          movementType: diff >= 0 ? 'entrada' : 'ajuste',
          quantity: Math.abs(diff),
          previousStock: current.stock,
          newStock,
          reason: data.adjustmentReason || 'Ajuste manual de stock',
        },
      });
    }

    const updated = await prisma.product.update({
      where: { id: data.id },
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        seasonId: data.seasonId,
        primaryFilamentId: data.primaryFilamentId,
        defaultColorHex: data.defaultColorHex,
        defaultColorName: data.defaultColorName,
        weightGrams: data.weightGrams !== undefined ? Number(data.weightGrams) : undefined,
        printTimeMinutes: data.printTimeMinutes !== undefined ? Number(data.printTimeMinutes) : undefined,
        failureRatePercent: data.failureRatePercent !== undefined ? Number(data.failureRatePercent) : undefined,
        filamentCost: data.filamentCost !== undefined ? Number(data.filamentCost) : undefined,
        electricityCost: data.electricityCost !== undefined ? Number(data.electricityCost) : undefined,
        depreciationCost: data.depreciationCost !== undefined ? Number(data.depreciationCost) : undefined,
        laborCost: data.laborCost !== undefined ? Number(data.laborCost) : undefined,
        otherCosts: data.otherCosts !== undefined ? Number(data.otherCosts) : undefined,
        realCost: data.realCost !== undefined ? Number(data.realCost) : undefined,
        marginPercent: data.marginPercent !== undefined ? Number(data.marginPercent) : undefined,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : undefined,
        stock: data.stock !== undefined ? Number(data.stock) : undefined,
        minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
        status: data.status,
        notes: data.notes,
      },
    });

    // Replace images if provided
    if (Array.isArray(data.images)) {
      await prisma.productImage.deleteMany({ where: { productId: data.id } });
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        const url = typeof img === 'string' ? img : img.url;
        if (url) {
          await prisma.productImage.create({
            data: {
              productId: data.id,
              url,
              isPrimary: i === 0 || img.isPrimary,
              displayOrder: i,
            },
          });
        }
      }
    }

    const result = await prisma.product.findUnique({
      where: { id: data.id },
      include: { category: true, season: true, filament: true, images: true },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
