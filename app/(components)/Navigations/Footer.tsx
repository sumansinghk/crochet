import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export default function Footer() {
  return (
    <footer className="border-t border-rose-100 bg-[#FFF8F2]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-600 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-[0.2em] text-zinc-900">Crochet n&apos; Bliss</p>
          <p className="mt-3 leading-7">Thoughtfully handcrafted crochet pieces for gifts, décor, and everyday joy.</p>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900">Quick links</h3>
          <ul className="mt-3 space-y-2">
            {footerLinks.map((item) => (
              <li key={item.href}><Link href={item.href} className="transition hover:text-zinc-900">{item.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900">Contact</h3>
          <ul className="mt-3 space-y-2">
            <li>support@crochetandbliss.com</li>
            <li>+91 9999999999</li>
            <li>Hyderabad, India</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900">Follow</h3>
          <ul className="mt-3 space-y-2">
            <li>Instagram</li>
            <li>Facebook</li>
            <li>Pinterest</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rose-100 px-4 py-4 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
        © 2026 Crochet n&apos; Bliss. All rights reserved.
      </div>
    </footer>
  );
}
