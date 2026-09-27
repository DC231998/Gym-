import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seasons = await prisma.season.findMany({
      where: { companyId: session.companyId },
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
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        companyId: session.companyId,
      },
    });
    return NextResponse.json(season, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const existing = await prisma.season.findFirst({
      where: { id: data.id, companyId: session.companyId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slug = data.slug || data.name?.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    await prisma.season.updateMany({
      where: { id: data.id, companyId: session.companyId },
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

    const updated = await prisma.season.findFirst({
      where: { id: data.id, companyId: session.companyId }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const count = await prisma.product.count({ where: { seasonId: id, companyId: session.companyId } });
    if (count > 0) {
      return NextResponse.json({ error: `No se puede eliminar: tiene ${count} productos asociados` }, { status: 400 });
    }

    await prisma.season.deleteMany({ where: { id, companyId: session.companyId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
