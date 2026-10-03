import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category';

type CategoryWithProducts = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  products?: { images: { url: string }[] }[];
};

function mapCategory(category: CategoryWithProducts) {
  const productImage = category.products?.[0]?.images?.[0]?.url;
  const fallbackImages: Record<string, string> = {
    flowers: '/assets/images/1.png',
    bouquets: '/assets/images/2.png',
    keychains: '/assets/images/3.png',
    'home-decor': '/assets/images/banner-4.png',
    plushies: '/assets/images/5.png',
    'baby-collection': '/assets/images/herobanner.png',
  };

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: `${category.name} handmade crochet collection`,
    image: productImage || fallbackImages[category.slug] || '/assets/images/herobanner.png',
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          images: {
            select: { url: true },
            take: 1,
          },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      items: categories.map(mapCategory),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body?.name || '').trim();

  if (!name) {
    return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
  }

  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: {
      name,
      slug: slugify(name),
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      item: mapCategory(category),
    },
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = String(body?.id || '').trim();
  const name = String(body?.name || '').trim();

  if (!id || !name) {
    return NextResponse.json({ success: false, message: 'Category id and name are required.' }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
  }

  const slug = slugify(name);
  const duplicate = await prisma.category.findFirst({
    where: {
      id: { not: id },
      OR: [{ name }, { slug }],
    },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json({ success: false, message: 'A category with this name already exists.' }, { status: 409 });
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { name, slug },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { images: { select: { url: true }, take: 1 } },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: { item: mapCategory(updatedCategory) },
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = String(body?.id || '').trim();

  if (!id) {
    return NextResponse.json({ success: false, message: 'Category id is required.' }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
  }

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json({
      success: false,
      message: `Cannot remove ${category.name} while ${productCount} product${productCount === 1 ? '' : 's'} use it. Reassign or remove those products first.`,
    }, { status: 409 });
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true, message: 'Category removed.' });
}
