import Image from "next/image";
import { Sparkles, HeartHandshake, Leaf, BadgeCheck, ArrowRight } from "lucide-react";

const storyPoints = [
  { title: "Our Story", description: "Crochet n' Bliss began as a small studio rooted in warmth, color, and handmade detail." },
  { title: "Mission", description: "We create heirloom-worthy crochet pieces that bring comfort and joy to everyday life." },
  { title: "Vision", description: "To inspire homes with timeless, handcrafted beauty that feels personal and enduring." },
];

export default function AboutPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-rose-100 bg-gradient-to-r from-[#FFF8F2] to-[#F7C6D0] shadow-sm">
          <div className="grid gap-10 p-8 lg:grid-cols-[1fr_0.8fr] lg:p-12">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">About us</p>
              <h1 className="text-4xl font-semibold text-zinc-900 sm:text-5xl">Crafted with love, made to be treasured.</h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-700">Each piece is thoughtfully created in small batches using premium yarns, expressive colors, and a timeless handmade finish.</p>
              <div className="flex flex-wrap gap-3">
                <a href="/shop" className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">Explore shop <ArrowRight size={16} /></a>
                <a href="/contact" className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700">Contact us</a>
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem]">
              <Image src="/assets/images/herobanner.png" alt="Crochet maker working on handmade pieces" width={700} height={600} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {storyPoints.map((point) => (
            <div key={point.title} className="rounded-[1.75rem] border border-rose-100 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-zinc-900">{point.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{point.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[2.5rem] border border-rose-100 bg-[#FFF8F2] p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: "Handmade with Love" },
              { icon: HeartHandshake, title: "Thoughtful Gifts" },
              { icon: Leaf, title: "Eco Friendly" },
              { icon: BadgeCheck, title: "Premium Craftsmanship" },
            ].map((item) => {
              const Icon = item.icon;
              return <div key={item.title} className="rounded-[1.5rem] bg-white p-6 text-center"><div className="mb-4 flex justify-center"><div className="rounded-full bg-rose-100 p-3 text-rose-500"><Icon size={20} /></div></div><h3 className="font-semibold text-zinc-900">{item.title}</h3></div>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
