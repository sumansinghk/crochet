import React from 'react'

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">Total Orders<br/><strong>0</strong></div>
        <div className="p-4 bg-white rounded shadow">Total Revenue<br/><strong>₹0</strong></div>
        <div className="p-4 bg-white rounded shadow">Total Customers<br/><strong>0</strong></div>
      </div>
    </div>
  )
}
