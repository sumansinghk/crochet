"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X, User, LayoutDashboard, LogOut } from "lucide-react";
import { useCartStore } from "../storefront/CartStore";
import { useWishlistStore } from "../../(components)/storefront/WishlistStore";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const items = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const loggedIn = status === "authenticated";
    const role = ((session?.user as any)?.role ?? "USER").toString().toUpperCase();
    setIsLoggedIn(loggedIn);
    setIsAdmin(loggedIn && (role === "ADMIN" || role === "SUPER_ADMIN"));
  }, [status, session]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleLogin = () => {
    setMenuOpen(false);
    router.push("/auth/login");
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut({ callbackUrl: "/auth/login" });
  };

  const visibleNavItems = isAdmin ? [] : navItems;

  return (
    <header className="sticky top-0 z-[120] border-b border-rose-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-[0.25em] text-zinc-900">
          Crochet n&apos; Bliss
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition relative ${
                pathname === item.href
                  ? "text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {item.label}
              {pathname === item.href && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-rose-600" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100" aria-label="Search">
            <Search size={18} />
          </button>
          <Link href="/wishlist" className="relative rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100">
            <Heart size={18} />
            {wishlistItems.length > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{wishlistItems.length}</span> : null}
          </Link>
          <Link href="/cart" className="relative rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100">
            <ShoppingBag size={18} />
            {cartCount > 0 ? <span key={cartCount} aria-live="polite" aria-atomic="true" className="cart-count-pop absolute -right-1 -top-1 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">{cartCount}</span> : null}
          </Link>

          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100" aria-label="My account menu">
              <UserRound size={18} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                {isLoggedIn ? (
                  <>
                    <Link href={isAdmin ? "/admin/dashboard" : "/account"} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-50">
                      {isAdmin ? <LayoutDashboard size={16} /> : <User size={16} />}
                      {isAdmin ? "Dashboard" : "My Profile"}
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleLogin} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-50">
                    <User size={16} />
                    Login
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/cart" aria-label={`Cart, ${cartCount} items`} className="relative rounded-full border border-zinc-200 p-2 text-zinc-700">
            <ShoppingBag size={18} />
            {cartCount > 0 ? <span key={cartCount} aria-live="polite" aria-atomic="true" className="cart-count-pop absolute -right-1 -top-1 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">{cartCount}</span> : null}
          </Link>
          <button className="rounded-full border border-zinc-200 p-2 text-zinc-700" onClick={() => setIsOpen((value) => !value)} aria-label="Toggle navigation">
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-rose-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-zinc-600">
            {visibleNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-zinc-900" onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <Link href="/wishlist" className="rounded-full border border-zinc-200 p-2" onClick={() => setIsOpen(false)}><Heart size={18} /></Link>

            {isLoggedIn ? (
              <>
                <Link href={isAdmin ? "/admin/dashboard" : "/account"} className="rounded-full border border-zinc-200 p-2" onClick={() => setIsOpen(false)} aria-label="My account">
                  <UserRound size={18} />
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-full border border-red-200 p-2 text-red-600" aria-label="Logout">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button type="button" onClick={handleLogin} className="rounded-full border border-zinc-200 p-2" aria-label="Login">
                <UserRound size={18} />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
