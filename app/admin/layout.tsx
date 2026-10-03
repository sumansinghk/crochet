'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Users, Package2, Settings, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/inventory', label: 'Inventory', icon: Package2 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-gradient-to-b from-zinc-900 to-zinc-800 text-white border-r border-zinc-700 shadow-xl fixed h-screen overflow-y-auto">
        <div className="p-6 border-b border-zinc-700 sticky top-0 bg-zinc-900">
          <div className="text-xl font-bold tracking-wider">Crochet N' Bliss</div>
          <div className="text-xs text-zinc-400 mt-1">Admin Panel</div>
        </div>
        <nav className="space-y-1 p-4 pb-28">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="fixed bottom-0 left-0 w-64 p-4 border-t border-zinc-700 bg-zinc-800">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col ml-64">
        <header className="bg-white border-b border-zinc-200 shadow-sm sticky top-0 z-40">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
