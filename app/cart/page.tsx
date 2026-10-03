"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, BookmarkPlus } from "lucide-react";
import { useCartStore } from "../(components)/storefront/CartStore";
import { useWishlistStore } from "../(components)/storefront/WishlistStore";
import { CartSummary } from "../(components)/storefront/components";

type ProductImageLookup = {
  id?: number | string;
  name?: string;
  title?: string;
  price?: number;
  originalPrice?: number;
  salePercent?: number | null;
  stockQuantity?: number;
  image?: string;
  colors?: { name?: string; sku?: string; hex?: string; image?: string; price?: number; originalPrice?: number; salePercent?: number; stock?: number }[];
};

type ProductImageResponse = {
  data?: { item?: ProductImageLookup };
};

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const refreshCartItem = useCartStore((state) => state.refreshCartItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const saveCartItem = useWishlistStore((state) => state.saveCartItem);
  const productRequests = useRef(new Map<string, Promise<ProductImageLookup | null>>());

  const handleSaveForLater = (sku: string) => {
    const item = useCartStore.getState().items.find((cartItem) => cartItem.sku === sku);
    if (!item) return;
    saveCartItem(item);
    removeItem(sku);
  };

  useEffect(() => {
    let cancelled = false;

    const needsRefresh = items.filter((item) => {
      const image = item.product.image || "";
      return image.startsWith("data:image/") ||
        image.startsWith("blob:") ||
        !image ||
        !Object.prototype.hasOwnProperty.call(item.product, "salePercent");
    });

    if (needsRefresh.length === 0) return;

    const loadProduct = (id: string) => {
      const cachedRequest = productRequests.current.get(id);
      if (cachedRequest) return cachedRequest;

      const request = fetch(`/api/products/${encodeURIComponent(id)}?inventoryOnly=true`)
        .then(async (response) => {
          if (!response.ok) throw new Error(`Product inventory lookup failed (${response.status})`);
          const payload = (await response.json()) as ProductImageResponse;
          if (!payload.data?.item) throw new Error("Product inventory lookup returned no product");
          return payload.data.item;
        })
        .catch((error: unknown) => {
          productRequests.current.delete(id);
          console.error(`Unable to refresh cart image for product ${id}:`, error);
          return null;
        });

      productRequests.current.set(id, request);
      return request;
    };

    void Promise.all(
      needsRefresh.map(async (item) => {
        const id = String(item.product.id);
        const product = await loadProduct(id);
        if (cancelled || !product) return;

        const selectedColor = product.colors?.find(
          (color) =>
            color.name?.toLowerCase() === item.colorName.toLowerCase() ||
            (color.sku && item.sku.endsWith(`-${color.sku}`))
        );
        const productImage = product.image || item.product.image;
        const image = selectedColor?.image || productImage;
        const price = Number(selectedColor?.price ?? product.price ?? item.price);

        refreshCartItem(
          item.sku,
          {
            ...item.product,
            id: item.product.id,
            name: product.name || product.title || item.product.name,
            price: Number(selectedColor?.price ?? product.price ?? item.price),
            originalPrice: selectedColor?.originalPrice ?? product.originalPrice,
            salePercent: selectedColor?.salePercent ?? product.salePercent,
            image,
            secondaryImage: image,
            colors: [],
          },
          selectedColor?.hex || item.colorHex,
          price,
          Number(selectedColor?.stock ?? product.stockQuantity ?? 0)
        );
      })
    );

    return () => {
      cancelled = true;
    };
  }, [items, refreshCartItem]);

  return (
    <section className="px-2 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 sm:text-sm sm:tracking-[0.35em]">Cart</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-zinc-900 sm:mt-2 sm:text-4xl">Your cozy selection</h1>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div className="space-y-3 sm:space-y-4">
            {items.length === 0 ? (
              <div className="rounded-[1.5rem] border border-rose-100 bg-white p-5 text-center text-sm text-zinc-600 sm:rounded-[2rem] sm:p-10 sm:text-base">
                <p>Your cart is empty. Start exploring handmade favorites.</p>
                <Link href="/shop" className="mt-3 inline-flex rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white sm:mt-4 sm:px-5 sm:py-3 sm:text-sm">Continue shopping</Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.sku} className="flex flex-row items-center gap-2.5 rounded-[1.5rem] border border-rose-100 bg-[#faf7f2] p-2.5 shadow-sm sm:gap-4 sm:rounded-[2rem] sm:bg-white sm:p-5">
                  <div className="relative h-[clamp(88px,24vw,108px)] w-[clamp(88px,24vw,108px)] shrink-0 rounded-xl border border-zinc-200 bg-white p-1 sm:h-24 sm:w-24">
                    <Link href={`/product/${item.product.id}?color=${encodeURIComponent(item.colorName)}`} className="block h-full w-full">
                      <Image src={item.product.image} alt={item.product.name} fill sizes="108px" className="rounded-lg object-contain" />
                    </Link>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${item.product.id}?color=${encodeURIComponent(item.colorName)}`} className="block">
                          <h2 className="truncate text-sm font-medium text-zinc-900 hover:text-rose-500 sm:text-lg sm:font-semibold">{item.product.name}</h2>
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-zinc-500 sm:mt-1 sm:text-sm">{item.colorName}</p>
                      </div>
                      <p className="shrink-0 text-right text-base font-semibold text-zinc-900 sm:hidden">
                        {item.product.originalPrice && item.product.originalPrice > item.price ? <span className="mr-1 text-xs font-normal text-zinc-400 line-through">₹{(item.product.originalPrice * item.quantity).toFixed(0)}</span> : null}
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => handleSaveForLater(item.sku)} aria-label={`Save ${item.product.name} for later`} title="Save for later" className="rounded-full p-2 text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600">
                          <BookmarkPlus size={16} />
                        </button>
                        <button type="button" onClick={() => removeItem(item.sku)} aria-label={`Remove ${item.product.name} from cart`} className="hidden rounded-full p-2 text-zinc-500 hover:bg-zinc-100 sm:block"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 sm:mt-4 sm:justify-between sm:gap-4">
                      <button type="button" onClick={() => handleSaveForLater(item.sku)} aria-label={`Save ${item.product.name} for later`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-rose-200 hover:bg-white hover:text-rose-600 sm:hidden">
                        <BookmarkPlus size={16} />
                      </button>
                      <button onClick={() => removeItem(item.sku)} aria-label={`Remove ${item.product.name} from cart`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-white sm:hidden"><Trash2 size={16} /></button>
                      <div className="flex h-9 w-[96px] items-center justify-between rounded-lg border border-zinc-200 px-1.5 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-none sm:border-0 sm:px-0">
                        <button type="button" onClick={() => updateQuantity(item.sku, Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1} aria-label="Decrease quantity" className="grid h-7 w-7 place-items-center rounded-full bg-[#F7C6D0] text-zinc-900 transition hover:bg-[#f5adb9] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:h-9 sm:w-9 sm:border-0"><Minus size={14} /></button>
                        <span className="min-w-4 text-center text-sm font-medium sm:min-w-6 sm:text-base sm:font-semibold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.sku, item.quantity + 1)} disabled={!Number.isFinite(item.stock) || item.quantity >= item.stock} aria-label="Increase quantity" title={item.quantity >= item.stock ? `Only ${item.stock} available` : undefined} className="grid h-7 w-7 place-items-center rounded-full bg-[#F7C6D0] text-zinc-900 transition hover:bg-[#f5adb9] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:h-9 sm:w-9 sm:border-0"><Plus size={14} /></button>
                      </div>
                      <p className="hidden text-right text-base font-semibold text-zinc-900 sm:block sm:text-lg">
                        {item.product.originalPrice && item.product.originalPrice > item.price ? <span className="mr-2 text-sm font-normal text-zinc-400 line-through">₹{(item.product.originalPrice * item.quantity).toFixed(2)}</span> : null}
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <CartSummary items={items.map((item) => ({ quantity: item.quantity, price: item.price, originalPrice: item.product.originalPrice }))} />
        </div>
      </div>
    </section>
  );
}
