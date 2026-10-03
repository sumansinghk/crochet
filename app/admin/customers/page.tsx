"use client"
import React, { useEffect, useState } from 'react'
import { Edit2, X } from 'lucide-react'

type Customer = {
  id: string
  name?: string
  email: string
  phone?: string
  createdAt: string
  totalOrders: number
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  function loadCustomers() {
    setLoading(true)
    fetch('/api/auth/customers', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        setCustomers(j.customers || [])
      })
      .catch(() => {
        // Fallback: mock customers data if API not available
        setCustomers([])
      })
      .finally(() => setLoading(false))
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer)
    setEditForm({ name: customer.name || '', email: customer.email, phone: customer.phone || '' })
  }

  function closeEditModal() {
    setEditingCustomer(null)
    setEditForm({ name: '', email: '', phone: '' })
    setError('')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCustomer) return

    setEditSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/users/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editForm.name, email: editForm.email, phone: editForm.phone }),
      })

      if (!res.ok) {
        throw new Error('Failed to update customer')
      }

      closeEditModal()
      loadCustomers()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Customers</h1>
      {loading ? (
        <div>Loading...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center text-gray-500">
          No customers yet
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Joined</th>
                <th className="p-2">Total Orders</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name || 'N/A'}</td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2">{c.phone || 'N/A'}</td>
                  <td className="p-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">{c.totalOrders || 0}</td>
                  <td className="p-2">
                    <button type="button" onClick={() => openEditModal(c)} className="text-blue-600 hover:text-blue-800">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Edit Customer</h2>
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
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Update Customer'}
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
