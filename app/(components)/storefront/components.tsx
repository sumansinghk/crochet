"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, type MouseEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Heart, ShoppingBag, Sparkles, ShieldCheck, Truck, Gift, Star, Eye, Plus, Minus, ArrowRight, X } from "lucide-react";
import type { Product, ProductColor } from "./data";
import { useCartStore } from "./CartStore";
import { useWishlistStore } from "./WishlistStore";

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-rose-400">{eyebrow}</p>
      <h2 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-lg text-zinc-600">{description}</p>
    </div>
  );
}

export function CategoryCard({ category, index }: { category: { name: string; description: string; image: string }; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]"
    >
      <div className="relative h-56 overflow-hidden">
        <Image src={category.image} alt={category.name} fill sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, calc(100vw - 32px)" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900">{category.name}</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600">{category.description}</p>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#F7C6D0] px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-[#f5adb9]">
          Shop now <ArrowRight size={16} />
        </Link>
      </div>
    </motion.article>
  );
}

type QuickViewProduct = {
  id: Product["id"];
  title?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  category?: string | { name?: string };
  price: number;
  originalPrice?: number;
  salePercent?: number | null;
  rating?: number;
  reviews?: number;
  image: string;
  images?: string[];
  secondaryImage?: string;
  stockQuantity?: number;
  colors: ProductColor[];
};

export function ProductQuickView({
  products,
  index,
  onNavigate,
  onClose,
}: {
  products: Product[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const product = products[index];
  const addItem = useCartStore((state) => state.addItem);
  const [loadedProduct, setLoadedProduct] = useState<{
    id: string;
    details?: QuickViewProduct;
    error?: string;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const productId = String(product.id);

    fetch(`/api/products/${product.id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result?.success || !result?.data?.item) {
          throw new Error(result?.message || `Unable to load product (${response.status}).`);
        }
        if (isCurrent) {
          setLoadedProduct({ id: productId, details: result.data.item as QuickViewProduct });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadedProduct({
            id: productId,
            error: error instanceof Error ? error.message : "Unable to load product details.",
          });
        }
      })

    return () => {
      isCurrent = false;
    };
  }, [product.id]);

  const currentProductLoaded = loadedProduct?.id === String(product.id);
  const details = currentProductLoaded ? loadedProduct.details ?? null : null;
  const loading = !currentProductLoaded;
  const loadError = currentProductLoaded ? loadedProduct.error ?? "" : "";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onNavigate((index - 1 + products.length) % products.length);
      if (event.key === "ArrowRight") onNavigate((index + 1) % products.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [index, onClose, onNavigate, products.length]);

  const variants = details?.colors?.length ? details.colors : product.colors;
  const variant = variants[selectedColor] || variants[0];
  const stock = Math.max(0, Number(variant?.stock ?? details?.stockQuantity ?? 0));
  const image = variant?.image || details?.image || product.image;
  const productName = details?.name || details?.title || product.name;
  const category = typeof details?.category === "string"
    ? details.category
    : details?.category?.name || product.category;
  const price = Number(variant?.price ?? details?.price ?? product.price);
  const originalPrice = Number(variant?.originalPrice ?? details?.originalPrice ?? product.originalPrice ?? 0);
  const salePercent = variant?.salePercent ?? details?.salePercent ?? product.salePercent;

  const addSelectedToCart = () => {
    if (!details || !variant || stock < 1) return;
    const name = details.name || details.title || product.name;
    const cartProduct: Product = {
      id: details.id,
      name,
      category,
      price,
      ...(originalPrice > price ? { originalPrice, salePercent } : {}),
      rating: details.rating ?? product.rating,
      reviews: details.reviews ?? product.reviews,
      image,
      secondaryImage: details.secondaryImage || image,
      description: details.description || details.shortDescription || product.description,
      colors: variants,
    };
    addItem({
      product: cartProduct,
      colorName: variant.name,
      colorHex: variant.hex,
      price,
      quantity: Math.min(Math.max(1, quantity), stock),
      stock,
      sku: `${details.id}-${variant.sku}`,
    });
    setCartAdded(true);
    window.setTimeout(() => setCartAdded(false), 1400);
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 sm:p-6"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${productName}`}
        className="relative max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white text-zinc-900 shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Quick view · {index + 1} of {products.length}</p>
          <button type="button" onClick={onClose} aria-label="Close quick view" className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 p-4 sm:gap-8 sm:p-7 md:grid-cols-2">
          <div className="relative h-[min(58vh,640px)] min-h-[280px] w-full bg-[#FFF8F2] sm:min-h-[420px]">
            <Image
              src={image}
              alt={`${productName}${variant ? ` in ${variant.name}` : ""}`}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover object-center"
            />
          </div>

          <div className="flex min-w-0 flex-col py-1 sm:py-3">
            {loading ? (
              <p className="py-8 text-sm text-zinc-500">Loading product details...</p>
            ) : loadError ? (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
            ) : details && variant ? (
              <>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{category}</p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{productName}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                  <span className="flex items-center gap-1 text-[#a3161b]"><Star size={15} fill="currentColor" /> {details.rating ?? product.rating}</span>
                  <span>·</span>
                  <span>{details.reviews ?? product.reviews} reviews</span>
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-3 border-b border-zinc-200 pb-5">
                  <span className="text-3xl font-medium">₹{price.toLocaleString("en-IN")}</span>
                  {originalPrice > price ? (
                    <>
                      <span className="text-lg text-zinc-500 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                      {salePercent ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{salePercent}% off</span> : null}
                    </>
                  ) : null}
                </div>
                <div className="mt-5">
                  <p className="mb-3 text-sm text-zinc-600">Shade: <span className="font-medium text-zinc-900">{variant.name}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((color, colorIndex) => (
                      <button
                        key={color.sku || `${color.name}-${colorIndex}`}
                        type="button"
                        onClick={() => {
                          setSelectedColor(colorIndex);
                          setQuantity(1);
                          setCartAdded(false);
                        }}
                        aria-label={`Select ${color.name} shade`}
                        aria-pressed={selectedColor === colorIndex}
                        className={`relative h-14 w-14 overflow-hidden rounded-xl border bg-white p-1 ${selectedColor === colorIndex ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"}`}
                      >
                        <Image src={color.image} alt="" fill sizes="56px" className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <QuantitySelector value={Math.min(quantity, Math.max(stock, 1))} onChange={setQuantity} max={stock} />
                  <button
                    type="button"
                    onClick={addSelectedToCart}
                    disabled={stock < 1}
                    className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-400 ${cartAdded ? "bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-700"}`}
                  >
                    {cartAdded ? <Check size={17} /> : <ShoppingBag size={17} />}
                    {stock < 1 ? "Out of stock" : cartAdded ? "Added to bag" : "Add to cart"}
                  </button>
                </div>
                {details.description || details.shortDescription ? (
                  <p className="mt-5 line-clamp-4 text-sm leading-6 text-zinc-600">{details.description || details.shortDescription}</p>
                ) : null}
                <Link href={`/product/${details.id}`} onClick={onClose} className="mt-5 text-sm font-medium underline underline-offset-4 hover:text-rose-600">
                  View full product details
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: () => void }) {
  const wishlistItems = useWishlistStore((state) => state.items);
  const addWishlistItem = useWishlistStore((state) => state.addItem);
  const removeWishlistItem = useWishlistStore((state) => state.removeItem);
  const isWishlisted = wishlistItems.some((item) => String(item.product.id) === String(product.id));

  const handleChooseColor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.();
  };

  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    handleButtonClick(e);
    if (isWishlisted) {
      removeWishlistItem(product.id);
      return;
    }

    addWishlistItem({
      product: {
        ...product,
        image: product.colors[0]?.image || product.image,
      },
    });
  };

  const firstColor = product.colors[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="group min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div className="relative aspect-[1.08] overflow-hidden bg-[#F8F5F0] sm:aspect-[0.9]">
        <Link href={`/product/${product.id}`} className="absolute inset-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute left-3 top-3 z-10 rounded-full bg-white/95 p-2 shadow-sm transition ${isWishlisted ? "text-rose-500" : "text-zinc-700 hover:text-rose-500"}`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={(event) => { handleButtonClick(event); onQuickView?.(); }}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-zinc-700 shadow-sm transition hover:text-zinc-900"
          aria-label={`Quick view ${product.name}`}
        >
          <Eye size={16} />
        </button>
        {product.badge ? <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-zinc-800 shadow-sm">{product.badge}</span> : null}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs">
            {product.category}
          </p>
          <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-700">
            <Star size={13} fill="currentColor" className="text-[#a3161b]" />
            {product.rating}
          </span>
        </div>
        <Link href={`/product/${product.id}`} className="mt-1.5 block truncate text-base font-semibold leading-snug text-zinc-900 hover:underline sm:text-lg">
          {product.name}
        </Link>
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            ₹{Number(product.price).toLocaleString("en-IN")}
            {Number(product.originalPrice) > Number(product.price) ? (
              <>
                <span className="text-sm font-normal text-zinc-500 line-through">
                  ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                </span>
                {product.salePercent ? <span className="text-xs font-semibold text-emerald-700">{product.salePercent}% off</span> : null}
              </>
            ) : null}
          </span>
        </p>
        <button
          type="button"
          onClick={handleChooseColor}
          disabled={!firstColor || product.colors.every((color) => color.stock <= 0)}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:w-auto"
        >
          {firstColor && product.colors.some((color) => color.stock > 0) ? "Choose a color" : "Out of stock"}
        </button>
      </div>
    </motion.article>
  );
}

export function BenefitsSection() {
  const benefitItems = [
    { title: "Handmade with Love", description: "Every stitch is shaped with care and intention.", icon: Sparkles },
    { title: "Premium Yarn", description: "Soft, durable fibers chosen for comfort and beauty.", icon: ShieldCheck },
    { title: "Eco Friendly", description: "Thoughtful sourcing and low-waste packaging.", icon: Gift },
    { title: "Secure Payments", description: "Encrypted checkout with trusted payment methods.", icon: ShieldCheck },
    { title: "Fast Shipping", description: "Packed and dispatched with care within 48 hours.", icon: Truck },
    { title: "Gift Packaging", description: "Wrapped beautifully for birthdays, weddings, and milestones.", icon: Gift },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {benefitItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-[1.8rem] border border-rose-100 bg-[#FFF8F2] p-8 text-center shadow-sm"
          >
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-white p-3 text-rose-500 shadow-sm">
                <Icon size={22} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-600">{item.description}</p>
          </motion.div>
        );
      })}
    </section>
  );
}

export function QuantitySelector({ value, onChange, max }: { value: number; onChange: (value: number) => void; max?: number }) {
  const atMinimum = value <= 1;
  const atMaximum = max !== undefined && value >= max;
  const buttonClass = "grid h-9 w-9 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400";

  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={atMinimum}
        className={`${buttonClass} ${atMinimum ? "" : "bg-[#F7C6D0] text-zinc-900 hover:bg-[#f5adb9]"}`}
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-zinc-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
        disabled={atMaximum}
        className={`${buttonClass} ${atMaximum ? "" : "bg-[#F7C6D0] text-zinc-900 hover:bg-[#f5adb9]"}`}
        aria-label="Increase quantity"
        title={atMaximum ? `Maximum quantity is ${max}` : undefined}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export function CartSummary({ items, showCheckoutLink = true }: { items: { quantity: number; price: number; originalPrice?: number }[]; showCheckoutLink?: boolean }) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + item.quantity * Math.max(item.price, item.originalPrice ?? item.price), 0);
  const discount = originalSubtotal - subtotal;
  const shipping = subtotal > 0 ? 8 : 0;
  return (
    <div className="rounded-[1.5rem] border border-rose-100 bg-[#FFF8F2] p-4 shadow-sm sm:rounded-[1.75rem] sm:p-6">
      <h3 className="text-lg font-semibold text-zinc-900 sm:text-xl">Order Summary</h3>
      <div className="mt-4 space-y-2 text-xs text-zinc-600 sm:mt-6 sm:space-y-3 sm:text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span className="flex items-center gap-2">{discount > 0 ? <span className="text-zinc-400 line-through">₹{originalSubtotal.toFixed(2)}</span> : null}<span>₹{subtotal.toFixed(2)}</span></span></div>
        {discount > 0 ? <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−₹{discount.toFixed(2)}</span></div> : null}
        <div className="flex justify-between"><span>Shipping</span><span>₹{shipping.toFixed(2)}</span></div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-900 sm:mt-6 sm:pt-4 sm:text-lg">
        <span>Total</span>
        <span>₹{(subtotal + shipping).toFixed(2)}</span>
      </div>
      {showCheckoutLink ? (
        <a href="/checkout" className="relative z-10 mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-700 sm:mt-6 sm:py-3 sm:text-sm">
          Proceed to checkout
        </a>
      ) : null}
    </div>
  );
}
