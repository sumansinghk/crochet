const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown[];
};

export async function apiRequest<T>(path: string, options: RequestInit = {}, requireAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (requireAuth) {
    headers['x-auth-required'] = 'true';
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const raw = await response.text();
  let payload: any = {};

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload.data as T;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiRequest<{ user: { id: string; email: string; role: string; name: string }; token: string }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  login: (data: { email: string; password: string }) =>
    apiRequest<{ user: { id: string; email: string; role: string; name: string }; token: string }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  me: () => apiRequest<{ user: { id: string; email: string; role: string; name: string } }>('/api/auth/me', {}, true),
};

export const productMapper = (item: any) => {
  const image = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '/assets/images/1.png';
  const colors = Array.isArray(item.colors) && item.colors.length > 0
    ? item.colors
    : [{
        name: 'Default',
        hex: '#F7C6D0',
        image,
        price: Number(item.price ?? 0),
        stock: Number(item.stockQuantity ?? 0),
        sku: item.sku || item.id,
      }];

  return {
    id: item.id,
    name: item.name,
    category: item.category?.name ?? 'General',
    price: Number(item.price ?? 0),
    ...(Number(item.originalPrice) > Number(item.price) ? { originalPrice: Number(item.originalPrice) } : {}),
    salePercent: Number.isInteger(Number(item.salePercent)) ? Number(item.salePercent) : null,
    rating: 4.8,
    reviews: 12,
    image,
    secondaryImage: Array.isArray(item.images) && item.images.length > 1 ? item.images[1] : image,
    description: item.shortDescription || item.description || 'Handmade crochet piece.',
    badge: item.isFeatured ? 'Bestseller' : undefined,
    colors,
    stockQuantity: Number(item.stockQuantity ?? 0),
  };
};
