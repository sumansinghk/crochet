"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useWishlistStore } from "../(components)/storefront/WishlistStore";
import { useCartStore } from "../(components)/storefront/CartStore";

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const addCartItem = useCartStore((state) => state.addItem);

  const moveToCart = (item: (typeof items)[number]) => {
    if (item.cartItem) {
      addCartItem(item.cartItem);
      removeItem(item.product.id);
      return;
    }

    const color = item.product.colors[0];
    if (!color || color.stock <= 0) return;
    addCartItem({
      product: item.product,
      colorName: color.name,
      colorHex: color.hex,
      price: color.price,
      quantity: 1,
      stock: color.stock,
      sku: color.sku,
    });
    removeItem(item.product.id);
  };

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 border-b border-[#e9e5e0] pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Your collection</p>
            <h1 className="mt-2 text-3xl font-medium text-zinc-900 sm:text-4xl">Wishlist</h1>
          </div>
          <p className="text-sm text-zinc-500">{items.length} saved {items.length === 1 ? "item" : "items"}</p>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Heart size={28} className="mx-auto text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-600">No saved favourites yet.</p>
            <Link href="/shop" className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-10">
            {items.map((item) => {
              const product = item.product;
              const color = product.colors[0];
              const canMoveToCart = Boolean(item.cartItem || (color && color.stock > 0));
              return (
                <article key={product.id} className="group min-w-0">
                  <div className="relative aspect-[0.9] overflow-hidden bg-white">
                    <Link href={`/product/${product.id}`} className="absolute inset-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
                        className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03] sm:p-5"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      title="Remove from wishlist"
                      className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 text-rose-500 shadow-sm transition hover:bg-white"
                    >
                      <Heart size={17} fill="currentColor" />
                    </button>
                  </div>
                  <div className="pt-3 sm:pt-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 sm:text-xs">
                      {product.category}
                    </p>
                    <Link href={`/product/${product.id}`} className="mt-1 block truncate text-sm font-medium text-zinc-900 hover:underline sm:text-base">
                      {product.name}
                    </Link>
                    <span className="mt-1 flex items-center gap-1 text-xs text-zinc-700">
                      <Star size={13} fill="currentColor" className="text-[#a3161b]" />
                      {product.rating}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-zinc-900">
                      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                        {Number(product.originalPrice) > Number(product.price) ? (
                          <>
                            <span className="text-sm font-normal text-zinc-500 line-through">
                              ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                            </span>
                            {product.salePercent ? (
                              <span className="text-xs font-semibold text-emerald-700">{product.salePercent}% off</span>
                            ) : null}
                          </>
                        ) : null}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => moveToCart(item)}
                      disabled={!canMoveToCart}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-800 transition hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                      <ShoppingBag size={15} />
                      {item.cartItem ? "Move to cart" : canMoveToCart ? "Add to cart" : "Out of stock"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
