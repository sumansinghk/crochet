"use client"
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const { register, handleSubmit } = useForm()
  const router = useRouter()
  const [token, setToken] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  async function onSubmit(data: any) {
    const res = await fetch('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, password: data.password }), headers: { 'Content-Type': 'application/json' } })
    if (res.ok) {
      alert('Password updated. You can now login.')
      router.push('/auth/login')
    } else {
      alert('Failed to reset password')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Reset password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm">New password</label>
          <input type="password" {...register('password')} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Confirm password</label>
          <input type="password" {...register('confirm')} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="w-full bg-pink-200 text-white py-2 rounded">Set new password</button>
      </form>
    </div>
  )
}
