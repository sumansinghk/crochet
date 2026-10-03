"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  Star,
  Heart,
  ChevronDown,
} from "lucide-react";
import { apiRequest, productMapper } from "../../lib/api";
import { useWishlistStore } from "../(components)/storefront/WishlistStore";
import type { Product } from "../(components)/storefront/data";

const seoKeywords = [
  "crochet",
  "crochet yarn",
  "yarns",
  "handmade crochet",
  "crochet products",
  "Ganga yarn",
  "Vardhaman yarn",
  "acrylic yarn",
  "wool yarn",
  "cotton yarn",
  "cotton crochet yarn",
  "premium yarn",
  "best crochet yarn",
  "crochet gifts",
  "crochet home décor",
  "crochet flowers",
  "crochet bag",
  "crochet baskets",
  "craft yarn",
  "knitting yarn",
  "soft wool yarn",
  "baby wool yarn",
  "Ganga acrylic yarn",
  "Vardhaman cotton yarn",
  "Indian yarn brands",
];

export default function ShopPage() {
  const wishlistItems = useWishlistStore((state) => state.items);
  const addWishlistItem = useWishlistStore((state) => state.addItem);
  const removeWishlistItem = useWishlistStore((state) => state.removeItem);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, productRes] = await Promise.all([
          apiRequest<{ items: any[] }>("/api/categories"),
          apiRequest<{ items: any[] }>("/api/products?limit=50"),
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
    () =>
      Array.from(
        new Set(
          allProducts
            .map((p) => Number(p.price))
            .filter((price) => Number.isFinite(price)),
        ),
      ).sort((a, b) => a - b),
    [allProducts],
  );
  const sliderMin = priceOptions.length ? priceOptions[0] : 0;
  const sliderMax = priceOptions.length
    ? priceOptions[priceOptions.length - 1]
    : 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "relevance" | "price-low" | "price-high"
  >("relevance");

  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, priceMin, priceMax, selectedRating]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const toggleWishlist = (product: Product) => {
    const isWishlisted = wishlistItems.some(
      (item) => String(item.product.id) === String(product.id),
    );
    if (isWishlisted) {
      removeWishlistItem(product.id);
      return;
    }
    addWishlistItem({
      product: {
        ...product,
        image: product.colors?.[0]?.image || product.image,
      },
    });
  };

  useEffect(() => {
    // clamp
    if (priceMin >= priceMax) setPriceMin(Math.max(sliderMin, priceMax - 1));
    if (priceMax <= priceMin) setPriceMax(Math.min(sliderMax, priceMin + 1));
  }, [priceMin, priceMax, sliderMin, sliderMax]);

  const filteredProducts = useMemo(() => {
    const matches = allProducts.filter((p) => {
      if (selectedCategories.length && !selectedCategories.includes(p.category))
        return false;
      if (p.price < priceMin) return false;
      if (p.price > priceMax) return false;
      if (selectedRating && p.rating < selectedRating) return false;
      if (
        searchTerm &&
        !`${p.name} ${p.category}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [
    searchTerm,
    selectedCategories,
    priceMin,
    priceMax,
    selectedRating,
    sortBy,
    allProducts,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );
  const paginated = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const shopStructuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Crochet n' Bliss",
    url: "https://www.crochetnbliss.com/shop",
    description:
      "Crochet n' Bliss offers handmade crochet products, yarns, cotton yarn, wool yarn, acrylic yarn, and premium brands including Ganga and Vardhaman.",
    keywords: seoKeywords.join(", "),
    brand: ["Ganga", "Vardhaman", "Acrylic", "Wool", "Cotton"],
    category: "Craft Supplies",
    areaServed: "India",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />
      <section className="min-h-screen bg-[#fcfbf9] text-zinc-900">
        <header className="border-b border-[#e9e5e0] px-4 py-10 text-center sm:py-14">
          <h1 className="text-4xl font-normal uppercase leading-none tracking-[0.04em] sm:text-6xl">
            All Yarns
          </h1>
        </header>

        <div className="border-b border-[#e9e5e0]">
          <div className="mx-auto grid h-[68px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-stretch px-4 sm:px-8">
            <button
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
              aria-expanded={isFilterOpen}
              aria-controls="shop-filters"
              className="flex items-center gap-3 justify-self-start text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm"
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} /> Filters
            </button>
            <div className="self-center text-center text-xs uppercase tracking-[0.08em] text-zinc-500 sm:text-sm">
              <span className="font-semibold text-[#a3161b]">
                {filteredProducts.length}
              </span>{" "}
              Items
            </div>
            <label className="flex items-center justify-self-end gap-2 border-l border-[#e9e5e0] pl-4 text-xs font-semibold uppercase tracking-[0.12em] sm:pl-8 sm:text-sm">
              Sort by
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "relevance"
                      | "price-low"
                      | "price-high",
                  )
                }
                className="max-w-8 cursor-pointer appearance-none bg-transparent text-transparent outline-none sm:max-w-none sm:text-zinc-800"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none -ml-7 sm:-ml-7"
              />
            </label>
          </div>
        </div>

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-8">
          {isFilterOpen ? (
            <aside
              id="shop-filters"
              className="absolute left-4 top-0 z-20 grid w-[min(88vw,440px)] gap-5 border border-[#e9e5e0] bg-white p-5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.45)] sm:left-8 sm:grid-cols-2 sm:p-6"
            >
              <label className="col-span-full flex items-center gap-3 border-b border-zinc-200 pb-3">
                <Search size={18} className="shrink-0 text-zinc-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search yarns"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </label>
              <fieldset className="space-y-3">
                <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Category
                </legend>
                {categories.map((category) => (
                  <label
                    key={category.id || category.name}
                    className="flex items-center gap-2.5 text-sm text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                      className="accent-[#a3161b]"
                    />
                    {category.name}
                  </label>
                ))}
              </fieldset>
              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Price
                  </legend>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-500">
                      Min
                      <select
                        value={priceMin}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setPriceMin(value);
                          if (value >= priceMax) setPriceMax(sliderMax);
                        }}
                        className="w-full border border-zinc-200 px-2 py-2 text-sm text-zinc-800"
                      >
                        {priceOptions.map((price) => (
                          <option key={price} value={price}>
                            {price}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-500">
                      Max
                      <select
                        value={priceMax}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setPriceMax(value);
                          if (value <= priceMin) setPriceMin(sliderMin);
                        }}
                        className="w-full border border-zinc-200 px-2 py-2 text-sm text-zinc-800"
                      >
                        {priceOptions.map((price) => (
                          <option key={price} value={price}>
                            {price}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Rating
                  </legend>
                  <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {[5, 4, 3, 2].map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center gap-1 text-xs text-zinc-700"
                      >
                        <input
                          type="radio"
                          name="rating"
                          checked={selectedRating === rating}
                          onChange={() =>
                            setSelectedRating(
                              selectedRating === rating ? null : rating,
                            )
                          }
                          className="accent-[#a3161b]"
                        />
                        <span>{rating}+</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </aside>
          ) : null}

          <div className="grid grid-cols-1 gap-x-3 gap-y-8 py-7 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
            {paginated.map((product: any) => {
              const isWishlisted = wishlistItems.some(
                (item) => String(item.product.id) === String(product.id),
              );
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
                      onClick={() => toggleWishlist(product)}
                      aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                      aria-pressed={isWishlisted}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className={`absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm transition hover:text-rose-500 ${isWishlisted ? "text-rose-500" : "text-zinc-700"}`}
                    >
                      <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="pt-3 sm:pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 sm:text-xs">
                          {product.category}
                        </p>
                        <Link
                          href={`/product/${product.id}`}
                          className="mt-1 block truncate text-sm font-medium text-zinc-900 hover:underline sm:text-base"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-700">
                      <Star
                        size={13}
                        fill="currentColor"
                        className="text-[#a3161b]"
                      />{" "}
                      {product.rating}
                    </span>

                    <p className="mt-2 text-sm font-semibold text-zinc-900">
                      <span className="inline-flex items-center gap-2">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                        {Number(product.originalPrice) > Number(product.price) ? (
                          <>
                            <span className="text-sm font-normal text-zinc-500 line-through">₹{Number(product.originalPrice).toLocaleString("en-IN")}</span>
                            {product.salePercent ? <span className="text-xs font-semibold text-emerald-700">{product.salePercent}% off</span> : null}
                          </>
                        ) : null}
                      </span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {paginated.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">
              No yarns match these filters.
            </p>
          ) : null}

          <div className="flex items-center justify-center gap-4 border-t border-[#e9e5e0] py-6 text-sm">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Previous
            </button>
            <span className="text-zinc-500">
              {Math.min(currentPage, totalPages)} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
