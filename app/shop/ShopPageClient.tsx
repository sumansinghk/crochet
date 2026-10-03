"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, Star, Heart, ShoppingBag, Eye } from "lucide-react";
import { SectionHeading } from "../(components)/storefront/components";
import { apiRequest, productMapper } from "../../lib/api";

type ProductColor = { name: string; hex: string };

export default function ShopPageClient() {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, productRes] = await Promise.all([
          apiRequest<{ items: any[] }>('/api/categories'),
          apiRequest<{ items: any[] }>('/api/products?limit=50'),
        ]);

        const mappedProducts = (productRes.items || []).map(productMapper);
        const priceValues = mappedProducts
          .map((product) => Number(product.price))
          .filter((price) => Number.isFinite(price))
          .sort((a, b) => a - b);

        setCategories(categoryRes.items || []);
        setAllProducts(mappedProducts);
        setPriceMin(priceValues[0] ?? 0);
        setPriceMax(priceValues[priceValues.length - 1] ?? 0);
      } catch (error) {
        setAllProducts([]);
        setPriceMin(0);
        setPriceMax(0);
      }
    };

    fetchData();
  }, []);

  const priceOptions = useMemo(
    () => Array.from(new Set(allProducts.map((p) => Number(p.price)).filter((price) => Number.isFinite(price)))).sort((a, b) => a - b),
    [allProducts]
  );
  const sliderMin = priceOptions.length ? priceOptions[0] : 0;
  const sliderMax = priceOptions.length ? priceOptions[priceOptions.length - 1] : 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"relevance" | "price-low" | "price-high">("relevance");

  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, priceMin, priceMax, selectedRating, sortBy]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };

  useEffect(() => {
    if (priceMin >= priceMax) setPriceMin(Math.max(sliderMin, priceMax - 1));
    if (priceMax <= priceMin) setPriceMax(Math.min(sliderMax, priceMin + 1));
  }, [priceMin, priceMax, sliderMin, sliderMax]);

  const filteredProducts = useMemo(() => {
    const matches = allProducts.filter((p) => {
      if (selectedCategories.length && !selectedCategories.includes(p.category)) return false;
      if (p.price < priceMin) return false;
      if (p.price > priceMax) return false;
      if (selectedRating && p.rating < selectedRating) return false;
      if (searchTerm && !(`${p.name} ${p.category}`.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
      return true;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [searchTerm, selectedCategories, priceMin, priceMax, selectedRating, sortBy, allProducts]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginated = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const range = sliderMax - sliderMin || 1;
  const minPct = ((priceMin - sliderMin) / range) * 100;
  const maxPct = ((priceMax - sliderMin) / range) * 100;

  useEffect(() => {
    const clear = () => setActiveThumb(null);
    window.addEventListener("mouseup", clear);
    window.addEventListener("touchend", clear);
    return () => {
      window.removeEventListener("mouseup", clear);
      window.removeEventListener("touchend", clear);
    };
  }, []);

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-rose-100 bg-gradient-to-r from-[#FFF8F2] to-[#F7C6D0] p-8 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Shop</p>
            <h1 className="mt-2 text-4xl font-semibold text-zinc-900">Curated crochet collections</h1>
            <p className="mt-3 max-w-2xl text-lg text-zinc-700">Browse handmade blooms, cozy décor, and thoughtful gifts designed to delight.</p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white bg-white/80 px-4 py-3">
            <Search size={18} className="text-zinc-500" />
            <input placeholder="Search products" className="w-56 bg-transparent outline-none" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-6 rounded-[2rem] border border-rose-100 bg-white p-6 shadow-sm">
            <div>
              <div className="mb-4 flex items-center gap-2 text-zinc-900">
                <SlidersHorizontal size={18} />
                <h2 className="font-semibold">Filters</h2>
              </div>
              <div className="space-y-3">
                {categories.map((category) => (
                  <label key={category.id || category.name} className="flex items-center gap-2 text-sm text-zinc-600">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                      className="rounded border-zinc-300"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-zinc-900">Price</h3>
              <div className="flex items-center gap-3">
                <label className="flex flex-col text-sm">
                  Min
                  <select
                    value={priceMin}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPriceMin(v);
                      if (v >= priceMax) setPriceMax(sliderMax);
                    }}
                    className="mt-1 rounded-md border border-zinc-200 px-2 py-1 text-sm"
                  >
                    {priceOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm">
                  Max
                  <select
                    value={priceMax}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPriceMax(v);
                      if (v <= priceMin) setPriceMin(sliderMin);
                    }}
                    className="mt-1 rounded-md border border-zinc-200 px-2 py-1 text-sm"
                  >
                    {priceOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-zinc-900">Ratings</h3>
              <div className="space-y-2 text-sm text-zinc-600">
                {[5,4,3,2].map((r) => (
                  <label key={r} className="flex items-center gap-2">
                    <input type="radio" name="rating" checked={selectedRating===r} onChange={() => setSelectedRating(selectedRating===r?null:r)} />
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: r }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <span className="text-zinc-600">{r}+</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <SectionHeading eyebrow="Collections" title="Handpicked favorites" description="A luxe assortment of crochet pieces for every season and celebration." />
            <div>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products"
                        className="w-full rounded-md border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-0 placeholder:text-zinc-400"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "relevance" | "price-low" | "price-high")}
                      className="rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                  <div className="text-sm text-zinc-600">{filteredProducts.length} results</div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {paginated.map((product: any) => {
                  const productColors: ProductColor[] = Array.isArray(product.colors) && product.colors.length ? product.colors : [{ name: 'Default', hex: '#F7C6D0' }];
                  const firstColor = productColors[0] ?? { name: 'Default', hex: '#F7C6D0' };

                  return (
                    <article key={product.id} className="group overflow-hidden rounded-[2rem] border border-rose-100 bg-white p-4 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.35)]">
                      <div className="relative overflow-hidden rounded-[1.4rem]">
                        <div className="relative h-64 overflow-hidden">
                          <Image src={product.image} alt={product.name} fill sizes="(min-width: 1280px) 300px, (min-width: 1024px) 35vw, (min-width: 768px) 45vw, calc(100vw - 32px)" className="object-cover transition duration-500 group-hover:scale-105" />
                        </div>
                        <div className="absolute right-3 top-3 flex gap-2">
                          <button className="rounded-full bg-white/90 p-2 text-zinc-700" aria-label="Wishlist"><Heart size={16} /></button>
                          <button className="rounded-full bg-white/90 p-2 text-zinc-700" aria-label="Quick view"><Eye size={16} /></button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm text-zinc-500">
                          <span>{product.category}</span>
                          <div className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> {product.rating}</div>
                        </div>
                        <Link href={`/product/${product.id}`} className="block text-xl font-semibold text-zinc-900 hover:text-rose-500">{product.name}</Link>
                        <div className="flex gap-2">
                          {productColors.slice(0, 4).map((color: ProductColor) => (
                            <div key={color.name} className="relative">
                              <button
                                type="button"
                                title={color.name}
                                aria-label={color.name}
                                className="peer h-5 w-5 rounded-full border border-zinc-200 transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity peer-hover:block peer-focus:block peer-hover:opacity-100 peer-focus:opacity-100">
                                {color.name}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                            ₹{product.price}
                            {product.originalPrice && product.originalPrice > product.price ? (
                              <>
                                <span className="text-sm font-normal text-zinc-500 line-through">₹{product.originalPrice}</span>
                                {product.salePercent ? <span className="text-xs font-semibold text-emerald-700">{product.salePercent}% off</span> : null}
                              </>
                            ) : null}
                          </p>
                          <Link href={`/product/${product.id}?color=${encodeURIComponent(firstColor.name)}`} className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"><ShoppingBag size={16} /> View Details</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-center gap-2">
                <button disabled={currentPage===1} onClick={() => setCurrentPage((p) => Math.max(1, p-1))} className="rounded border px-3 py-1 disabled:opacity-50">Prev</button>
                <div className="px-3 py-1">Page {currentPage} / {totalPages}</div>
                <button disabled={currentPage===totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p+1))} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
