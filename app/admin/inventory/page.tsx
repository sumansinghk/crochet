"use client"
import React, { useEffect, useState } from 'react'
import { Edit2, X } from 'lucide-react'

type InventoryItem = {
  id: string
  title: string
  name: string
  stockQuantity: number
  stock: number
  price: number
  image?: string
  colors?: InventoryColor[]
  category?: { name: string }
  categoryName?: string
  isActive?: boolean
}

type InventoryColor = {
  name: string
  hex?: string
  image?: string
  price?: number
  stock: number
  sku?: string
  available?: boolean
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editingColorIndex, setEditingColorIndex] = useState(0)
  const [editForm, setEditForm] = useState({ price: '0', stock: '0' })
  const [editSaving, setEditSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadInventory()
  }, [])

  function loadInventory() {
    setLoading(true)
    fetch('/api/products?limit=100&includeInactive=true', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        setInventory(j?.data?.items || [])
      })
      .finally(() => setLoading(false))
  }

  function openEditModal(item: InventoryItem, colorIndex: number) {
    setEditingItem(item)
    setEditingColorIndex(colorIndex)
    const color = item.colors?.[colorIndex]
    setEditForm({ price: String(color?.price ?? item.price ?? 0), stock: '0' })
  }

  function closeEditModal() {
    setEditingItem(null)
    setEditingColorIndex(0)
    setEditForm({ price: '0', stock: '0' })
    setError('')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return

    const quantityToAdd = Number(editForm.stock)
    const colorPrice = Number(editForm.price)
    if (!Number.isInteger(quantityToAdd) || quantityToAdd < 0) {
      setError('Enter a valid quantity to add.')
      return
    }
    if (!Number.isInteger(colorPrice) || colorPrice <= 0) {
      setError('Enter a price greater than zero.')
      return
    }

    setEditSaving(true)
    setError('')

    try {
      const sourceColors = editingItem.colors?.length
        ? editingItem.colors
        : [{ name: 'Default', hex: '#F7C6D0', image: editingItem.image, price: editingItem.price, stock: editingItem.stockQuantity ?? editingItem.stock ?? 0, sku: editingItem.id, available: true }]
      const updatedColors = sourceColors.map((color, index) => index === editingColorIndex
        ? { ...color, price: colorPrice, stock: Number(color.stock ?? 0) + quantityToAdd }
        : color)
      const availableColors = updatedColors.filter((color) => color.available !== false)
      const inventoryReady = availableColors.length > 0 && availableColors.every((color) => Number(color.price) > 0)
      const productPrice = inventoryReady ? Math.min(...availableColors.map((color) => Number(color.price))) : 0
      const productStock = updatedColors.reduce((total, color) => total + Number(color.stock ?? 0), 0)
      const res = await fetch(`/api/products/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          price: productPrice,
          stock: productStock,
          colors: updatedColors,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to add inventory')
      }

      closeEditModal()
      loadInventory()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setEditSaving(false)
    }
  }

  const inventoryByCategory = inventory.reduce<Record<string, InventoryItem[]>>((grouped, item) => {
    const categoryName = item.category?.name || item.categoryName || 'General'
    ;(grouped[categoryName] ||= []).push(item)
    return grouped
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Inventory Management</h1>
      {loading ? (
        <div>Loading...</div>
      ) : inventory.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center text-gray-500">
          No products in inventory
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(inventoryByCategory).map(([categoryName, products], categoryIndex) => {
            const colorCount = products.reduce((count, product) => count + Math.max(1, product.colors?.length || 0), 0)

            return (
              <details key={categoryName} open={categoryIndex === 0} className="overflow-hidden rounded border border-zinc-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium text-zinc-900 marker:hidden">
                  <span>{categoryName}</span>
                  <span className="text-xs font-normal text-zinc-500">{products.length} products · {colorCount} colors</span>
                </summary>
                <div className="overflow-x-auto border-t border-zinc-200">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                      <tr>
                        <th className="p-2">Product Name</th>
                        <th className="p-2">Color</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Stock Quantity</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.flatMap((item) => {
                        const productColors = item.colors?.length
                          ? item.colors
                          : [{ name: 'Default', stock: item.stockQuantity ?? item.stock ?? 0 }]

                        return productColors.map((color, colorIndex) => {
                          const currentStock = Number(color.stock ?? 0)
                          const status = !item.isActive ? 'Draft' : color.available === false ? 'Unavailable' : currentStock > 0 ? 'In Stock' : 'Out of Stock'
                          const statusColor = !item.isActive ? 'text-amber-700' : color.available === false || currentStock <= 0 ? 'text-red-600' : 'text-green-600'

                          return (
                            <tr key={`${item.id}-${color.sku || colorIndex}`} className="border-t border-zinc-100">
                              <td className="p-2">{item.title || item.name}</td>
                              <td className="p-2">{color.name}</td>
                              <td className="p-2">₹{color.price ?? item.price}</td>
                              <td className="p-2">{currentStock}</td>
                              <td className={`p-2 font-medium ${statusColor}`}>{status}</td>
                              <td className="p-2">
                                <button type="button" onClick={() => openEditModal(item, colorIndex)} className="text-blue-600 hover:text-blue-800" aria-label={`Add stock for ${item.name} ${color.name}`}>
                                  <Edit2 size={18} />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            )
          })}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Add Inventory</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <div className="p-3 bg-gray-50 rounded border">
                  {editingItem.title || editingItem.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex items-center gap-2 rounded border bg-gray-50 p-3">
                  <span className="h-4 w-4 rounded-full border border-zinc-300" style={{ backgroundColor: editingItem.colors?.[editingColorIndex]?.hex || '#F7C6D0' }} />
                  {editingItem.colors?.[editingColorIndex]?.name || 'Default'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <div className="p-3 bg-gray-50 rounded border">
                  {editingItem.colors?.[editingColorIndex]?.stock ?? editingItem.stockQuantity ?? editingItem.stock ?? 0}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.stock}
                  onChange={(e) => setEditForm((current) => ({ ...current, stock: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price per Color</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.price}
                  onChange={(event) => setEditForm((current) => ({ ...current, price: event.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                >
                  {editSaving ? 'Adding...' : 'Add Stock'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
