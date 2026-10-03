import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_PRODUCT_IMAGE = '/assets/images/1.png';
const MAX_LEGACY_IMAGE_SIZE = 20 * 1024 * 1024;

const imageTypes = {
  'image/jpeg': {
    extension: 'jpg',
    matches: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    matches: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: 'webp',
    matches: (bytes: Buffer) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
  },
} as const;

export async function saveProductImage(bytes: Buffer, mimeType: string): Promise<string> {
  const imageType = imageTypes[mimeType as keyof typeof imageTypes];
  if (!imageType || bytes.length === 0 || bytes.length > MAX_LEGACY_IMAGE_SIZE || !imageType.matches(bytes)) {
    throw new Error('Image must be a valid JPEG, PNG, or WebP file smaller than 20 MB.');
  }

  const filename = `${randomUUID()}.${imageType.extension}`;
  const directory = path.join(process.cwd(), 'public', 'uploads', 'products');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes, { flag: 'wx' });
  return `/uploads/products/${filename}`;
}

export function createProductImagePersister() {
  const cachedImages = new Map<string, Promise<string>>();

  return (value: unknown): Promise<string> => {
    if (typeof value !== 'string') return Promise.resolve(DEFAULT_PRODUCT_IMAGE);

    const cleaned = value.trim().replace(/^['"]|['"]$/g, '');
    if (!cleaned.startsWith('data:image/')) {
      if (cleaned.startsWith('/') && !cleaned.startsWith('//') && !cleaned.includes('\\')) {
        return Promise.resolve(cleaned);
      }

      try {
        const parsed = new URL(cleaned);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return Promise.resolve(cleaned);
      } catch {
        return Promise.resolve(DEFAULT_PRODUCT_IMAGE);
      }

      return Promise.resolve(DEFAULT_PRODUCT_IMAGE);
    }

    const cached = cachedImages.get(cleaned);
    if (cached) return cached;

    const saving = (async () => {
      const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(cleaned);
      if (!match || match[2].length > Math.ceil(MAX_LEGACY_IMAGE_SIZE * 4 / 3) + 4) {
        throw new Error('Legacy image data is invalid or exceeds 20 MB.');
      }

      const bytes = Buffer.from(match[2], 'base64');
      return saveProductImage(bytes, match[1]);
    })();
    cachedImages.set(cleaned, saving);
    return saving;
  };
}

export async function migrateStoredProductImages<
  I extends { id: string; url: string },
  T extends { variants: string | null; images: I[] },
>(product: T) {
  const persistImage = createProductImagePersister();
  let imagesChanged = false;
  let variantsChanged = false;

  const images = await Promise.all(product.images.map(async (image) => {
    const url = await persistImage(image.url);
    if (url !== image.url) imagesChanged = true;
    return { ...image, url };
  }));

  let variants = product.variants;
  if (variants) {
    try {
      const parsed: unknown = JSON.parse(variants);
      if (Array.isArray(parsed)) {
        const migrated = await Promise.all(parsed.map(async (color) => {
          if (!color || typeof color !== 'object' || !('image' in color)) return color;
          const value = (color as { image?: unknown }).image;
          const url = await persistImage(value);
          if (url !== value) variantsChanged = true;
          return { ...color, image: url };
        }));
        if (variantsChanged) variants = JSON.stringify(migrated);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Preserve malformed legacy variant data so product retrieval still works.
      } else {
        throw error;
      }
    }
  }

  return { images, variants, imagesChanged, variantsChanged };
}
