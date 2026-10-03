"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { CategoryCard, ProductCard, ProductQuickView, BenefitsSection, SectionHeading } from "./(components)/storefront/components";
import { apiRequest, productMapper } from "../lib/api";
import type { Product } from "./(components)/storefront/data";

const testimonials = [
  { name: "Mira", quote: "The attention to detail is breathtaking. Every piece looks like a keepsake." },
  { name: "Naina", quote: "My order arrived beautifully packaged and felt so personal and luxe." },
  { name: "Priya", quote: "The color selection is gorgeous and the quality is absolutely premium." },
];

const galleryImages = ["/assets/images/1.png", "/assets/images/2.png", "/assets/images/3.png", "/assets/images/5.png", "/assets/images/banner-4.png", "/assets/images/herobanner.png"];

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [quickViewProducts, setQuickViewProducts] = useState<Product[]>([]);
  const [activeQuickViewProducts, setActiveQuickViewProducts] = useState<Product[]>([]);
  const [quickViewIndex, setQuickViewIndex] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const openQuickView = (product: Product) => {
    const category = product.category.trim().toLocaleLowerCase();
    const categoryProducts = quickViewProducts.filter(
      (item) => item.category.trim().toLocaleLowerCase() === category,
    );
    const productIndex = categoryProducts.findIndex(
      (item) => String(item.id) === String(product.id),
    );

    if (productIndex < 0) return;
    setActiveQuickViewProducts(categoryProducts);
    setQuickViewIndex(productIndex);
  };

  const subscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubscribing(true);
    setNewsletterMessage('');
    setNewsletterError('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Unable to subscribe right now. Please try again.');
      }
      setNewsletterMessage(result.message);
      setNewsletterEmail('');
    } catch (error) {
      setNewsletterError(error instanceof Error ? error.message : 'Unable to subscribe right now. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role && ["ADMIN", "SUPER_ADMIN"].includes((session?.user as any).role)) {
      router.replace("/admin/dashboard");
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await apiRequest<{ items: any[] }>('/api/categories');
        const productsData = await apiRequest<{ items: any[] }>('/api/products');
        setCategories(categoriesData.items || []);
        const mappedProducts = (productsData.items || []).map(productMapper);
        setFeaturedProducts(mappedProducts.slice(0, 8));
        setQuickViewProducts(mappedProducts);
      } catch (error) {
        // fallback remains empty state silently
      }
    };

    fetchData();
  }, []);

  return (
    <main className="bg-[#FFF8F2]">
      <section className="overflow-hidden bg-gradient-to-r from-[#FFF8F2] via-white to-[#F7C6D0]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Yarn for every idea</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Find your perfect yarn. Make something wonderful.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-700">
              Explore soft, beautiful yarns in colors you will love, with quality you can trust for every stitch, project, and handmade gift.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700">
                Shop yarn <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                Find your color
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-[2.5rem] bg-[#F7C6D0]/40 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-rose-100 bg-white p-4 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.4)]">
              <Image src="/assets/images/herobanner.png" alt="Handmade crochet products" width={900} height={700} className="h-[500px] w-full rounded-[2rem] object-cover" />
            </div>
          </div>
        </div>
      </section>
{/*
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Shop by category" title="Find your favorite handmade charm" description="From blooming bouquets to cozy home accents, every collection is designed to feel personal and premium." />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.length > 0 ? categories.map((category, index) => (
              <CategoryCard key={category.id || category.name} category={{ name: category.name, description: category.description || 'Handmade favorites', image: category.image || '/assets/images/1.png' }} index={index} />
            )) : null}
          </div>
        </div>
      </section> */}

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Customer favorites" title="Yarns made for your next favorite project" description="Discover popular yarns chosen for their soft feel, beautiful colors, and dependable quality." />
          <div className="grid grid-cols-1 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
            {featuredProducts.length > 0 ? featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={() => openQuickView(product)}
              />
            )) : null}
          </div>
        </div>
      </section>
      {quickViewIndex !== null && activeQuickViewProducts[quickViewIndex] ? (
        <ProductQuickView
          key={activeQuickViewProducts[quickViewIndex].id}
          products={activeQuickViewProducts}
          index={quickViewIndex}
          onNavigate={setQuickViewIndex}
          onClose={() => setQuickViewIndex(null)}
        />
      ) : null}

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-rose-100 bg-white p-8 shadow-sm sm:p-12">
          <SectionHeading eyebrow="Why choose us" title="A thoughtful shopping experience from start to finish" description="Every order is wrapped in care, quality, and dependable support." />
          <BenefitsSection />
        </div>
      </section>

      {/* <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-rose-100 bg-[#FFF8F2] p-8 shadow-sm sm:p-12">
          <SectionHeading eyebrow="Testimonials" title="What customers are saying" description="Handmade pieces that feel as beautiful as they look." />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-[1.75rem] border border-rose-100 bg-white p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-amber-500"><Sparkles size={18} fill="currentColor" /><Sparkles size={18} fill="currentColor" /><Sparkles size={18} fill="currentColor" /></div>
                <p className="text-base leading-8 text-zinc-700">“{item.quote}”</p>
                <p className="mt-6 font-semibold text-zinc-900">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Instagram gallery" title="A little peek into the studio" description="Every detail is crafted to feel warm, airy, and full of personality." />
          <div className="grid gap-4 md:grid-cols-3">
            {galleryImages.map((image, index) => (
              <div key={image} className="overflow-hidden rounded-[1.8rem] border border-rose-100 bg-white p-2 shadow-sm">
                <Image src={image} alt={`Studio image ${index + 1}`} width={600} height={500} className="h-64 w-full rounded-[1.4rem] object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-rose-100 bg-gradient-to-r from-[#F7C6D0] to-[#FFF8F2] p-8 shadow-sm sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Newsletter</p>
              <h2 className="mt-3 text-3xl font-semibold text-zinc-900 sm:text-4xl">Stay in the loop with new drops and cozy inspirations.</h2>
              <p className="mt-4 text-lg text-zinc-700">Receive exclusive offers, new collection previews, and handmade styling notes straight to your inbox.</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 backdrop-blur">
              <form onSubmit={subscribe} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="Email address"
                  aria-label="Email address"
                  aria-describedby="newsletter-feedback"
                  className="min-w-0 flex-1 rounded-full border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubscribing ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
              <p id="newsletter-feedback" aria-live="polite" className={`mt-3 text-sm ${newsletterError ? 'text-red-700' : 'text-emerald-800'}`}>
                {newsletterError || newsletterMessage}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600">
                <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-rose-500" /> No spam</span>
                <span className="flex items-center gap-2"><HeartHandshake size={16} className="text-rose-500" /> Personal support</span>
                <span className="flex items-center gap-2"><Leaf size={16} className="text-rose-500" /> Eco-conscious packing</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
