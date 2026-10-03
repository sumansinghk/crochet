"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Edit2, X } from 'lucide-react'

type Order = {
  id: string
  orderNumber: string
  placedAt: string
  total: number
  paymentStatus: string
  status: string
  shippingStatus: string
  user: { name?: string; email?: string }
  items: any[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({ status: '', note: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        setOrders(j.orders || [])
      })
      .finally(() => setLoading(false))
  }, [])

  function openEditModal(order: Order) {
    setEditingOrder(order)
    setEditForm({ status: order.status, note: '' })
  }

  function closeEditModal() {
    setEditingOrder(null)
    setEditForm({ status: '', note: '' })
    setError('')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingOrder) return

    setEditSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toStatus: editForm.status, note: editForm.note }),
      })

      if (!res.ok) {
        throw new Error('Failed to update order')
      }

      closeEditModal()
      setLoading(true)
      fetch('/api/admin/orders', { credentials: 'include' })
        .then((r) => r.json())
        .then((j) => {
          setOrders(j.orders || [])
        })
        .finally(() => setLoading(false))
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Order ID</th>
                <th className="p-2">Date</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Items</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Payment</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-2">{o.orderNumber}</td>
                  <td className="p-2">{new Date(o.placedAt).toLocaleString()}</td>
                  <td className="p-2">{o.user?.name || o.user?.email}</td>
                  <td className="p-2">{o.items.length}</td>
                  <td className="p-2">₹{o.total}</td>
                  <td className="p-2">{o.paymentStatus}</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2 flex gap-2">
                    <button type="button" onClick={() => openEditModal(o)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                    <Link href={`/admin/orders/${o.id}`} className="text-pink-600">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Edit Order</h2>
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
                <label className="block text-sm font-medium mb-1">Order Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Add a note about this update"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Update Order'}
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
