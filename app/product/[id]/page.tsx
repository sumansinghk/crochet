"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Check, ShoppingBag, ShoppingBasket, Star, X, ZoomIn, ZoomOut } from "lucide-react";
import { QuantitySelector } from "../../(components)/storefront/components";
import { Breadcrumb } from "../../(components)/storefront/Breadcrumb";
import { useCartStore } from "../../(components)/storefront/CartStore";
import { useSearchParams } from "next/navigation";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [isMobileCartVisible, setIsMobileCartVisible] = useState(false);
  const [mobileCartBottom, setMobileCartBottom] = useState(16);
  const [loading, setLoading] = useState(true);
  const zoomDrag = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const zoomImageDimensions = useRef({ width: 0, height: 0 });
  const cartFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSectionRef = useRef<HTMLElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  const closeZoomViewer = () => {
    setIsZoomOpen(false);
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    setIsDraggingZoom(false);
    zoomDrag.current = null;
  };

  useEffect(() => {
    if (!params?.id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const json = await res.json();
        const item = json?.data?.item ?? null;
        setProduct(item);
        setSelectedColor(0);
        setActiveImage(item?.colors?.[0]?.image || item?.image || item?.images?.[0] || "");
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  useEffect(() => {
    if (!product) return;
    const colorParam = searchParams?.get?.("color");
    if (colorParam) {
      const idx = product.colors.findIndex(
        (c: any) => c.name.toLowerCase() === colorParam.toLowerCase() || c.sku?.toLowerCase() === colorParam.toLowerCase()
      );
      if (idx >= 0) {
        setSelectedColor(idx);
        setActiveImage(product.colors[idx].image);
      }
    }
  }, [searchParams, product]);

  useEffect(() => {
    if (!isZoomOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeZoomViewer();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isZoomOpen]);

  useEffect(() => () => {
    if (cartFeedbackTimer.current) clearTimeout(cartFeedbackTimer.current);
  }, []);

  useEffect(() => {
    const section = productSectionRef.current;
    if (!section) return;

    let frame = 0;
    const updateMobileCartPosition = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const sectionBottom = section.getBoundingClientRect().bottom;
        const buttonHeight = 56;
        const isMobile = window.innerWidth < 640;
        setIsMobileCartVisible(isMobile && sectionBottom > buttonHeight + 16);
        setMobileCartBottom(Math.max(16, window.innerHeight - sectionBottom + 16));
      });
    };

    updateMobileCartPosition();
    window.addEventListener("scroll", updateMobileCartPosition, { passive: true });
    window.addEventListener("resize", updateMobileCartPosition);
    return () => {
      window.removeEventListener("scroll", updateMobileCartPosition);
      window.removeEventListener("resize", updateMobileCartPosition);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [product]);

  if (loading) return <div className="px-4 py-20 text-center text-zinc-600">Loading product...</div>;
  if (!product) return <div className="px-4 py-20 text-center text-zinc-600">Product not found.</div>;

  const colors = product.colors || [];
  const selectedVariant = colors[selectedColor] || colors[0];
  const selectedStock = Math.max(0, Number(selectedVariant.stock ?? product.stockQuantity ?? 0));
  const selectedQuantity = selectedStock > 0 ? Math.min(Math.max(1, quantity), selectedStock) : 0;
  const productImages = Array.isArray(product.images) ? product.images : [];
  const galleryImages = Array.from(new Set([
    ...productImages,
    ...colors.map((color: any) => color.image),
    selectedVariant.image,
  ].filter(Boolean)));
  const displayImage = activeImage || selectedVariant.image;

  const selectGalleryImage = (image: string) => {
    const matchingColor = colors.findIndex((color: any) => color.image === image);
    if (matchingColor >= 0) setSelectedColor(matchingColor);
    setActiveImage(image);
  };

  const selectColor = (index: number) => {
    setSelectedColor(index);
    setActiveImage(colors[index].image);
  };

  const setZoom = (scale: number) => {
    const nextScale = Math.min(3, Math.max(1, scale));
    setZoomScale(nextScale);
    if (nextScale === 1) setZoomOffset({ x: 0, y: 0 });
  };

  const startZoomDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoomScale <= 1 || (event.target instanceof Element && event.target.closest("button"))) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    zoomDrag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setIsDraggingZoom(true);
  };

  const moveZoomImage = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = zoomDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const bounds = event.currentTarget.getBoundingClientRect();
    const image = zoomImageDimensions.current;
    const fitScale = image.width && image.height
      ? Math.min(bounds.width / image.width, bounds.height / image.height)
      : 1;
    const maxX = Math.max(0, (image.width * fitScale * zoomScale - bounds.width) / 2);
    const maxY = Math.max(0, (image.height * fitScale * zoomScale - bounds.height) / 2);

    setZoomOffset((offset) => ({
      x: Math.max(-maxX, Math.min(maxX, offset.x + deltaX)),
      y: Math.max(-maxY, Math.min(maxY, offset.y + deltaY)),
    }));
    zoomDrag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const stopZoomDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoomDrag.current?.pointerId !== event.pointerId) return;
    zoomDrag.current = null;
    setIsDraggingZoom(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const addSelectedToCart = () => {
    addItem({
      product: {
        ...product,
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        originalPrice: selectedVariant.originalPrice,
        category: product.category?.name || product.category || "General",
        image: selectedVariant.image,
        colors: product.colors,
      },
      colorName: selectedVariant.name,
      colorHex: selectedVariant.hex,
      price: selectedVariant.price,
      quantity: selectedQuantity,
      stock: selectedStock,
      sku: `${product.id}-${selectedVariant.sku}`,
    });
    setCartAdded(true);
    if (cartFeedbackTimer.current) clearTimeout(cartFeedbackTimer.current);
    cartFeedbackTimer.current = setTimeout(() => setCartAdded(false), 1400);
  };

  return (
    <section ref={productSectionRef} className="min-h-[calc(100vh-108px)] bg-white px-4 py-5 text-zinc-900 sm:px-7 sm:py-7 lg:py-10">
      <div className="mx-auto grid max-w-[1440px] gap-y-2 gap-x-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-y-3 lg:gap-x-14 xl:gap-x-20">
        <div className="lg:col-span-2">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: product.category?.name || product.category || "Shop", href: product.category?.slug ? `/shop?category=${product.category.slug}` : "/shop" },
              { label: product.name, href: "#" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <div className="relative flex h-[min(54svh,500px)] min-h-[280px] min-w-0 items-center justify-center bg-white sm:h-[min(70svh,720px)] sm:min-h-[320px] lg:h-[min(78vh,860px)]">
            <button type="button" onClick={() => { setZoom(1); setIsZoomOpen(true); }} aria-label={`Zoom ${product.name} image`} className="absolute inset-0 cursor-zoom-in">
              <Image src={displayImage} alt={`${product.name} in ${selectedVariant.name}`} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain" />
            </button>
            <span className="pointer-events-none absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-zinc-800 shadow-sm" aria-hidden="true">
              <ZoomIn size={18} />
            </span>
          </div>
        </div>

        <div className="min-w-0 pt-1 lg:pt-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{product.category?.name || product.category || "Collection"}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-zinc-900 sm:text-[34px]">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2.5 sm:mt-4">
            <div className="flex items-center gap-0.5 text-[#a3161b]" aria-label={`${product.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={19} fill="currentColor" strokeWidth={1.5} />)}
            </div>
            <span className="text-sm text-zinc-600">{product.reviews} reviews</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-zinc-200 pb-5 sm:mt-6 sm:pb-7">
            <div className="flex items-baseline gap-3">
              <p className="text-[30px] font-medium leading-none">₹{Number(selectedVariant.price).toLocaleString("en-IN")}</p>
              {Number(selectedVariant.originalPrice) > Number(selectedVariant.price) ? (
                <>
                  <p className="text-lg text-zinc-500 line-through">₹{Number(selectedVariant.originalPrice).toLocaleString("en-IN")}</p>
                  {selectedVariant.salePercent ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{selectedVariant.salePercent}% off</span> : null}
                </>
              ) : null}
            </div>
            <span className="rounded-md bg-[#f9dddd] px-3 py-2 text-xs text-zinc-700">Incl. of all taxes</span>
          </div>

          <div className="pt-6 sm:pt-7">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span className="text-zinc-600">Shade</span>
              <span className="font-medium text-zinc-900">{selectedVariant.sku} - {selectedVariant.name}</span>
            </div>
            <div className="grid grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7">
              {colors.map((color: any, index: number) => (
                <button
                  type="button"
                  key={color.sku || `${color.name}-${index}`}
                  onClick={() => selectColor(index)}
                  aria-label={`Select ${color.name} shade`}
                  aria-pressed={selectedColor === index}
                  className={`relative mx-auto aspect-[0.76] w-full max-w-[66px] overflow-hidden rounded-[16px] border bg-white p-1.5 transition ${selectedColor === index ? "border-zinc-900 ring-1 ring-zinc-900" : "border-transparent hover:border-zinc-300"}`}
                >
                  <Image src={color.image} alt="" fill sizes="66px" className="object-contain p-1" />
                  {Number(color.stock ?? 1) <= 0 ? <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,transparent_49%,rgba(39,39,42,0.42)_50%,transparent_51%)]" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <QuantitySelector value={selectedQuantity || 1} onChange={setQuantity} max={selectedStock} />
            <button
              type="button"
              disabled={Number(selectedVariant.stock ?? product.stockQuantity ?? 1) <= 0}
              onClick={addSelectedToCart}
              className={`hidden min-h-12 flex-1 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-white transition duration-200 disabled:cursor-not-allowed disabled:bg-zinc-400 sm:inline-flex sm:flex-none ${cartAdded ? "scale-[1.03] bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-700"}`}
            >
              {cartAdded ? <Check key="added" size={17} className="animate-bounce" /> : <ShoppingBag key="add" size={17} />}
              <span aria-live="polite">{Number(selectedVariant.stock ?? product.stockQuantity ?? 1) <= 0 ? "Out of stock" : cartAdded ? "Added to bag" : "Add to bag"}</span>
            </button>
          </div>

          {product.description ? <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-600 sm:mt-7">{product.description}</p> : null}
        </div>
      </div>
      {isMobileCartVisible ? (
        <button
          type="button"
          onClick={addSelectedToCart}
          disabled={Number(selectedVariant.stock ?? product.stockQuantity ?? 1) <= 0}
          aria-label={cartAdded ? "Added to cart" : "Add selected item to cart"}
          title={cartAdded ? "Added to cart" : "Add selected item to cart"}
          style={{ bottom: `max(${mobileCartBottom}px, env(safe-area-inset-bottom) + 16px)` }}
          className={`fixed right-4 z-50 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:bg-zinc-400 sm:hidden ${cartAdded ? "scale-110 bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-700"}`}
        >
          {cartAdded ? <Check size={22} className="animate-bounce" /> : <ShoppingBasket size={22} />}
        </button>
      ) : null}
      {isZoomOpen ? (
        <div role="dialog" aria-modal="true" aria-label={`Zoomed ${product.name} image`} onClick={closeZoomViewer} className="fixed inset-0 z-[130] h-[100dvh] w-screen overflow-hidden bg-white text-zinc-900">
          <button type="button" autoFocus onClick={(event) => { event.stopPropagation(); closeZoomViewer(); }} aria-label="Close zoomed image" title="Close zoom" className="absolute right-12 top-[100px] z-30 grid h-11 w-11 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 sm:right-14 sm:top-[100px]">
            <X size={22} />
          </button>
        
          <div className="absolute inset-x-0 top-10 bottom-24 lg:bottom-0 lg:right-24" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-full w-full">
              <div
                className={`absolute inset-0 touch-none overflow-hidden ${zoomScale > 1 ? isDraggingZoom ? "cursor-grabbing" : "cursor-grab" : "cursor-default"}`}
                onPointerDown={startZoomDrag}
                onPointerMove={moveZoomImage}
                onPointerUp={stopZoomDrag}
                onPointerCancel={stopZoomDrag}
              >
                <Image
                  src={displayImage}
                  alt={`${product.name} in ${selectedVariant.name}`}
                  fill
                  sizes="(min-width: 1024px) calc(100vw - 96px), 100vw"
                  draggable={false}
                  onLoad={(event) => {
                    zoomImageDimensions.current = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
                  }}
                  className={`select-none object-contain ${isDraggingZoom ? "" : "transition-transform duration-200"}`}
                  style={{ transform: `translate3d(${zoomOffset.x}px, ${zoomOffset.y}px, 0) scale(${zoomScale})` }}
                />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-md">
              <button type="button" onClick={() => setZoom(zoomScale - 0.5)} disabled={zoomScale <= 1} aria-label="Zoom out" className="grid h-10 w-10 place-items-center rounded-full hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">
                <ZoomOut size={19} />
              </button>
              <span className="min-w-12 text-center text-xs font-medium">{Math.round(zoomScale * 100)}%</span>
              <button type="button" onClick={() => setZoom(zoomScale + 0.5)} disabled={zoomScale >= 3} aria-label="Zoom in" className="grid h-10 w-10 place-items-center rounded-full hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">
                <ZoomIn size={19} />
              </button>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-24 items-center justify-center gap-2 overflow-x-auto bg-white px-3 lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-24 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:px-2 lg:py-16" onClick={(event) => event.stopPropagation()}>
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`zoom-${image}-${index}`}
                onClick={() => { selectGalleryImage(image); setZoom(1); }}
                aria-label={`View enlarged product image ${index + 1}`}
                aria-pressed={displayImage === image}
                className={`relative h-[76px] w-[62px] shrink-0 overflow-hidden border bg-white p-1.5 transition lg:h-[88px] lg:w-[72px] ${displayImage === image ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-500"}`}
              >
                <Image src={image} alt="" fill sizes="72px" className="object-contain p-1" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
