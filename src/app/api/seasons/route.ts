import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(seasons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });

    const slug = data.slug || data.name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    const season = await prisma.season.create({
      data: {
        name: data.name,
        slug,
        description: data.description || '',
        bannerUrl: data.bannerUrl || null,
        primaryColorHex: data.primaryColorHex || '#3B82F6',
        accentColorHex: data.accentColorHex || '#1D4ED8',
        themeStyle: data.themeStyle || 'standard',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
    return NextResponse.json(season, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const slug = data.slug || data.name?.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    const updated = await prisma.season.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        bannerUrl: data.bannerUrl,
        primaryColorHex: data.primaryColorHex,
        accentColorHex: data.accentColorHex,
        themeStyle: data.themeStyle,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
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

    const count = await prisma.product.count({ where: { seasonId: id } });
    if (count > 0) {
      return NextResponse.json({ error: `No se puede eliminar: tiene ${count} productos asociados` }, { status: 400 });
    }

    await prisma.season.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
