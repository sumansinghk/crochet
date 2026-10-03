import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { createProductImagePersister, migrateStoredProductImages } from '../../../lib/productImageStorage';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';

const DEFAULT_PRODUCT_IMAGE = '/assets/images/1.png';
type ProductColorInput = { name?: unknown; hex?: unknown; image?: unknown; price?: unknown; stock?: unknown; sku?: unknown; available?: unknown };
type ProductColorVariant = { name: string; hex: string; image: string; price: number; stock: number; sku: string; available: boolean };

function mapProduct(product: any) {
  const regularPrice = Number(product.price ?? 0);
  const legacySalePrice = Number(product.salePrice);
  const legacySalePercent = product.salePrice !== null && product.salePrice !== undefined &&
    regularPrice > 0 && Number.isFinite(legacySalePrice) &&
    legacySalePrice >= 0 && legacySalePrice < regularPrice
    ? Math.round((regularPrice - legacySalePrice) * 100 / regularPrice)
    : null;
  const configuredSalePercent = product.salePercent ?? legacySalePercent;
  const salePercent = Number(configuredSalePercent);
  const hasSale = configuredSalePercent !== null && configuredSalePercent !== undefined &&
    Number.isInteger(salePercent) && salePercent >= 1 && salePercent <= 100;
  const imageRecords = Array.isArray(product.images) ? product.images : [];
  const images = imageRecords.length > 0
    ? imageRecords.map((image: any) => image.url)
    : ['/assets/images/1.png'];

  const firstImage = images[0];
  let savedColors: ProductColorInput[] = [];
  try {
    const parsedColors: unknown = JSON.parse(product.variants || '[]');
    if (Array.isArray(parsedColors)) savedColors = parsedColors as ProductColorInput[];
  } catch {
    savedColors = [];
  }
  const colors = savedColors.map((color, index) => {
    const originalPrice = Number(color.price ?? regularPrice);
    return {
      name: typeof color.name === 'string' ? color.name : `Color ${index + 1}`,
      hex: typeof color.hex === 'string' ? color.hex : '#F7C6D0',
      image: typeof color.image === 'string' ? color.image : imageRecords.find((image: any) => image.alt === color.name)?.url || firstImage,
      price: hasSale ? Math.round(originalPrice * (100 - salePercent) / 100) : originalPrice,
      ...(hasSale ? { originalPrice, salePercent } : {}),
      stock: Number(color.stock ?? product.stock ?? 0),
      sku: typeof color.sku === 'string' ? color.sku : `${product.sku ?? product.id}-${index + 1}`,
      available: color.available !== false,
    };
  });
  const displayedPrice = hasSale ? Math.round(regularPrice * (100 - salePercent) / 100) : regularPrice;

  return {
    id: product.id,
    name: product.title,
    title: product.title,
    description: product.description ?? 'Handmade crochet piece.',
    shortDescription: product.description ?? 'Handmade crochet piece.',
    price: displayedPrice,
    ...(hasSale ? { originalPrice: regularPrice, salePercent } : {}),
    salePercent: hasSale ? salePercent : null,
    rating: 4.8,
    reviews: 12,
    stockQuantity: Number(product.stock ?? 0),
    isActive: Boolean(product.isActive),
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : { id: '', name: 'General', slug: 'general' },
    image: firstImage,
    images,
    secondaryImage: images[1] || firstImage,
    sku: product.sku ?? product.id,
    colors: colors.length ? colors : [
      {
        name: 'Default',
        hex: '#F7C6D0',
        image: firstImage,
        price: displayedPrice,
        ...(hasSale ? { originalPrice: regularPrice, salePercent } : {}),
        stock: Number(product.stock ?? 0),
        sku: product.sku ?? product.id,
      },
    ],
    isFeatured: false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const products = await prisma.product.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { category: true, images: true },
    orderBy: { createdAt: 'desc' },
    take: Number.isFinite(limit) && (limit as number) > 0 ? limit : undefined,
  });

  const items = [];
  for (const product of products) {
    const migrated = await migrateStoredProductImages(product);
    if (migrated.imagesChanged) {
      for (const image of migrated.images) {
        const previous = product.images.find((entry) => entry.id === image.id);
        if (previous && previous.url !== image.url) {
          await prisma.productImage.update({ where: { id: image.id }, data: { url: image.url } });
        }
      }
    }
    if (migrated.variantsChanged) {
      await prisma.product.update({ where: { id: product.id }, data: { variants: migrated.variants } });
    }
    items.push(mapProduct({ ...product, images: migrated.images, variants: migrated.variants }));
  }

  return NextResponse.json({
    success: true,
    data: {
      items,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const price = Number(body?.price ?? 0);
  const salePercent = body?.salePercent === '' || body?.salePercent === null || body?.salePercent === undefined
    ? null
    : Number(body.salePercent);
  const stock = Number(body?.stock ?? 0);
  const categoryName = String(body?.categoryName || body?.category || '').trim();
  const persistImage = createProductImagePersister();
  const submittedImages: unknown[] = Array.isArray(body?.images) ? body.images : [];
  const imageUrls = (await Promise.all(submittedImages.map(persistImage)))
    .filter((url) => url && url !== DEFAULT_PRODUCT_IMAGE);
  const submittedPrimaryImage = body?.imageUrl || submittedImages[0] || DEFAULT_PRODUCT_IMAGE;
  const imageUrl = submittedPrimaryImage === submittedImages[0]
    ? imageUrls[0] || DEFAULT_PRODUCT_IMAGE
    : await persistImage(submittedPrimaryImage);
  const sku = body?.sku || `SKU-${Date.now()}`;
  const colors: ProductColorVariant[] = Array.isArray(body?.colors)
    ? (await Promise.all(body.colors.map(async (color: ProductColorInput, index: number) => ({
          name: String(color?.name || `Color ${index + 1}`).trim(),
          hex: /^#[0-9a-f]{6}$/i.test(String(color?.hex || '')) ? color.hex : '#F7C6D0',
          image: await persistImage(color?.image),
          price: Number(color?.price ?? price),
          stock: Number(color?.stock ?? stock),
          sku: String(color?.sku || `${sku}-${index + 1}`),
          available: color?.available !== false,
        }))))
        .filter((color) => color.name && color.image !== DEFAULT_PRODUCT_IMAGE)
    : [];
  const savedColors = colors.length
    ? colors.map(({ name, hex, price: variantPrice, stock: variantStock, sku: variantSku, available }) => ({ name, hex, price: variantPrice, stock: variantStock, sku: variantSku, available }))
    : [{ name: 'Default', hex: '#F7C6D0', price, stock, sku, available: true }];

  if (!title || !categoryName || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ success: false, message: 'Title and category are required; price cannot be negative.' }, { status: 400 });
  }
  if (salePercent !== null && (!Number.isInteger(salePercent) || salePercent < 1 || salePercent > 100)) {
    return NextResponse.json({ success: false, message: 'Sale discount must be a whole number from 1 to 100.' }, { status: 400 });
  }

  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: {
      name: categoryName,
      slug: slugify(categoryName),
    },
  });

  const product = await prisma.product.create({
    data: {
      title,
      description: description || 'Handmade crochet piece.',
      price,
      salePrice: null,
      salePercent,
      stock,
      isActive: price > 0,
      variants: JSON.stringify(savedColors),
      categoryId: category.id,
      sku,
      images: {
        create: [
          { url: imageUrl, alt: colors.find((color) => color.image === imageUrl)?.name || title },
          ...imageUrls.slice(1).map((url: string) => ({ url, alt: colors.find((color) => color.image === url)?.name || title })),
        ].filter((img) => Boolean(img.url) && img.url !== DEFAULT_PRODUCT_IMAGE),
      },
    },
    include: {
      category: true,
      images: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      item: mapProduct(product),
    },
  });
}
