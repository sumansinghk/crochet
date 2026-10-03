import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createProductImagePersister, migrateStoredProductImages } from '../../../../lib/productImageStorage';

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (new URL(request.url).searchParams.get('inventoryOnly') === 'true') {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        salePercent: true,
        stock: true,
        variants: true,
        sku: true,
        images: { select: { id: true, url: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

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
      await prisma.product.update({ where: { id }, data: { variants: migrated.variants } });
    }

    let savedColors: ProductColorInput[] = [];
    try {
      const parsed: unknown = JSON.parse(migrated.variants || '[]');
      if (Array.isArray(parsed)) savedColors = parsed as ProductColorInput[];
    } catch {
      savedColors = [];
    }

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
    const colors = savedColors.map((color, index) => {
      const colorOriginalPrice = Number(color.price ?? regularPrice);
      return {
      name: typeof color.name === 'string' ? color.name : `Color ${index + 1}`,
      hex: typeof color.hex === 'string' ? color.hex : '#F7C6D0',
      image: typeof color.image === 'string'
        ? color.image
        : migrated.images[0]?.url || DEFAULT_PRODUCT_IMAGE,
      price: hasSale ? Math.round(colorOriginalPrice * (100 - salePercent) / 100) : colorOriginalPrice,
      ...(hasSale ? { originalPrice: colorOriginalPrice, salePercent } : {}),
      stock: Number(color.stock ?? product.stock ?? 0),
      sku: typeof color.sku === 'string' ? color.sku : `${product.sku ?? product.id}-${index + 1}`,
    };
    });

    return NextResponse.json({
      success: true,
      data: {
        item: {
          id: product.id,
          title: product.title,
          price: hasSale ? Math.round(regularPrice * (100 - salePercent) / 100) : regularPrice,
          ...(hasSale ? { originalPrice: regularPrice, salePercent } : {}),
          salePercent: hasSale ? salePercent : null,
          stockQuantity: Number(product.stock ?? 0),
          image: migrated.images[0]?.url || DEFAULT_PRODUCT_IMAGE,
          colors: colors.length
            ? colors
            : [{ name: 'Default', hex: '#F7C6D0', image: migrated.images[0]?.url || DEFAULT_PRODUCT_IMAGE, price: hasSale ? Math.round(regularPrice * (100 - salePercent) / 100) : regularPrice, ...(hasSale ? { originalPrice: regularPrice, salePercent } : {}), stock: Number(product.stock ?? 0), sku: product.sku ?? product.id }],
        },
      },
    });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, images: true },
  });

  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

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
    await prisma.product.update({ where: { id }, data: { variants: migrated.variants } });
  }

  return NextResponse.json({
    success: true,
    data: {
      item: mapProduct({ ...product, images: migrated.images, variants: migrated.variants }),
    },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

  if (!product.isActive) {
    if (product._count.items > 0) {
      return NextResponse.json(
        { success: false, message: 'This draft has order history and cannot be permanently deleted.' },
        { status: 409 }
      );
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
      message: Number(product.price) <= 0 ? 'Draft permanently deleted.' : 'Archived product permanently deleted.',
    });
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({
    success: true,
    data: { id },
    message: 'Product archived from the storefront.',
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, categoryName, price, salePercent: submittedSalePercent, stock, imageUrl, description, images, colors } = body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const salePercent = submittedSalePercent === undefined
      ? product.salePercent ?? (product.salePrice !== null && product.salePrice !== undefined &&
        Number(product.salePrice) < Number(product.price) && Number(product.price) > 0
        ? Math.round((Number(product.price) - Number(product.salePrice)) * 100 / Number(product.price))
        : null)
      : submittedSalePercent === '' || submittedSalePercent === null
        ? null
        : Number(submittedSalePercent);
    if (salePercent !== null && (!Number.isInteger(Number(salePercent)) || Number(salePercent) < 1 || Number(salePercent) > 100)) {
      return NextResponse.json({ success: false, message: 'Sale discount must be a whole number from 1 to 100.' }, { status: 400 });
    }

    let categoryId = product.categoryId;
    if (categoryName) {
      const category = await prisma.category.findFirst({
        where: { name: categoryName },
      });
      if (category) {
        categoryId = category.id;
      }
    }

    // Handle multiple images
    const persistImage = createProductImagePersister();
    const submittedImages: unknown[] = Array.isArray(images) ? images : [];
    const imageUrls = (await Promise.all(submittedImages.map(persistImage)))
      .filter((url) => url && url !== DEFAULT_PRODUCT_IMAGE);
    const submittedPrimaryImage = imageUrl || submittedImages[0] || product.images[0]?.url || DEFAULT_PRODUCT_IMAGE;
    const primaryImageUrl = submittedPrimaryImage === submittedImages[0]
      ? imageUrls[0] || DEFAULT_PRODUCT_IMAGE
      : await persistImage(submittedPrimaryImage);
    const colorsWithImages: ProductColorVariant[] | null = Array.isArray(colors)
      ? (await Promise.all(colors.map(async (color: ProductColorInput, index: number) => ({
            name: String(color?.name || `Color ${index + 1}`).trim(),
            hex: typeof color?.hex === 'string' && /^#[0-9a-f]{6}$/i.test(color.hex) ? color.hex : '#F7C6D0',
            image: await persistImage(color?.image),
            price: Number(color?.price ?? price ?? product.price),
            stock: Number(color?.stock ?? stock ?? product.stock),
            sku: String(color?.sku || `${product.sku ?? product.id}-${index + 1}`),
            available: color?.available !== false,
          }))))
          .filter((color: any) => color.name)
      : null;
    const savedColors = colorsWithImages?.map(({ name, hex, price: variantPrice, stock: variantStock, sku: variantSku, available }) => ({ name, hex, price: variantPrice, stock: variantStock, sku: variantSku, available })) ?? null;

    await prisma.product.update({
      where: { id },
      data: {
        title: title || product.title,
        description: description || product.description,
        price: price !== undefined ? price : product.price,
        salePrice: null,
        salePercent: salePercent === null ? null : Number(salePercent),
        stock: stock !== undefined ? stock : product.stock,
        isActive: price !== undefined ? Number(price) > 0 : product.isActive,
        categoryId: categoryId,
        ...(savedColors ? { variants: JSON.stringify(savedColors.length ? savedColors : [{
          name: 'Default',
          hex: '#F7C6D0',
          price: Number(price ?? product.price),
          stock: Number(stock ?? product.stock),
          sku: product.sku ?? product.id,
          available: true,
        }]) } : {}),
      },
      include: { category: true, images: true },
    });

    // Update images if provided
    if (imageUrls.length > 0 || (imageUrl && imageUrl.startsWith('data:'))) {
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      const imagesToCreate = [
        { url: primaryImageUrl, alt: colorsWithImages?.find((color) => color.image === primaryImageUrl)?.name || title || product.title },
        ...imageUrls.slice(1).map((url: string) => ({ url, alt: colorsWithImages?.find((color) => color.image === url)?.name || title || product.title })),
      ].filter((img) => Boolean(img.url) && img.url !== DEFAULT_PRODUCT_IMAGE);

      if (imagesToCreate.length > 0) {
        await prisma.productImage.createMany({
          data: imagesToCreate.map((img) => ({
            productId: id,
            url: img.url,
            alt: img.alt,
          })),
        });
      }
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        item: mapProduct(finalProduct),
      },
      message: 'Product updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update product.' },
      { status: 500 }
    );
  }
}
