"use client"
import React, { useState } from 'react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'Crochet N\' Bliss',
    storeEmail: 'info@crochetbliss.com',
    storePhone: '+91-XXX-XXX-XXXX',
    storeAddress: 'Your Store Address',
    currency: 'INR',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSuccess(false)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded px-3 py-2 text-sm">
            Settings saved successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input
            type="text"
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Store Email</label>
          <input
            type="email"
            value={settings.storeEmail}
            onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Store Phone</label>
          <input
            type="tel"
            value={settings.storePhone}
            onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Store Address</label>
          <textarea
            value={settings.storeAddress}
            onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
