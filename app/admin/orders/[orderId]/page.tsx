"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrderDetail() {
  const params = useParams()
  const orderId = params?.orderId
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    fetch(`/api/admin/orders/${orderId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => setOrder(j.order))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <div>Loading...</div>
  if (!order) return <div>No order found.</div>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Order {order.orderNumber}</h1>
      <div className="mb-4 flex items-center gap-4">
        <div>Current status: <strong>{order.status}</strong></div>
        <StatusUpdate orderId={order.id} current={order.status} onUpdated={(h: any, newStatus: string) => {
          // append history and update status locally
          setOrder((prev: any) => ({ ...prev, status: newStatus, history: [h, ...(prev.history || [])] }))
        }} />
      </div>
      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold">Customer</h2>
        <div>{order.user?.name} — {order.user?.email}</div>
        <div>Phone: {order.address?.phone}</div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold">Items</h2>
        <ul>
          {order.items.map((it: any) => (
            <li key={it.id} className="flex justify-between border-b py-2">
              <div>{it.title} {it.variant ? `(${it.variant})` : ''}</div>
              <div>{it.quantity} x ₹{it.price} = ₹{it.subtotal}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold">Pricing</h2>
        <div>Subtotal: ₹{order.subtotal}</div>
        <div>Shipping: ₹{order.shipping}</div>
        <div>Tax: ₹{order.tax}</div>
        <div className="font-semibold">Grand Total: ₹{order.total}</div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold">Address</h2>
        <div>{order.address?.name}</div>
        <div>{order.address?.line1} {order.address?.line2}</div>
        <div>{order.address?.city} {order.address?.state} - {order.address?.pincode}</div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold">Payment</h2>
        <div>Method: {order.payment?.method}</div>
        <div>Status: {order.payment?.status}</div>
        <div>Payment ID: {order.payment?.paymentId}</div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold">Order history</h2>
        <ol className="mt-2 space-y-2">
          {(order.history || []).sort((a: any,b: any)=> new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map((h: any)=> (
            <li key={h.id} className="p-2 border rounded">
              <div className="text-sm text-gray-600">{new Date(h.changedAt).toLocaleString()}</div>
              <div><strong>{h.fromStatus}</strong> → <strong>{h.toStatus}</strong></div>
              {h.note ? <div className="text-sm mt-1">{h.note}</div> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function StatusUpdate({ orderId, current, onUpdated }: { orderId: string, current: string, onUpdated: (h: any, s: string) => void }) {
  const [toStatus, setToStatus] = useState(current)
  const [saving, setSaving] = useState(false)
  const statuses = ['Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned','Refunded']

  async function update() {
    if (!toStatus) return
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toStatus }) })
    const j = await res.json()
    setSaving(false)
    if (res.ok && j.ok) onUpdated(j.history, toStatus)
    else alert(j?.error || 'Failed to update status')
  }

  return (
    <div className="flex items-center gap-2">
      <select value={toStatus} onChange={(e) => setToStatus(e.target.value)} className="border rounded px-2 py-1">
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={update} disabled={saving || toStatus===current} className="bg-pink-200 text-white px-3 py-1 rounded disabled:opacity-50">{saving ? 'Saving...' : 'Update status'}</button>
    </div>
  )
}
