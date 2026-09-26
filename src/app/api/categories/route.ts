import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });

    const slug = data.slug || data.name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || '',
        icon: data.icon || 'tag',
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const slug = data.slug || data.name?.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    const updated = await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
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

    // Check if category has products
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json({ error: `No se puede eliminar: tiene ${count} productos asociados` }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
