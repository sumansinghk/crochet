"use client"
import React from 'react'
import { useForm } from 'react-hook-form'

export default function ForgotPage() {
  const { register, handleSubmit } = useForm()

  async function onSubmit(data: any) {
    const res = await fetch('/api/auth/forgot', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    if (res.ok) alert('If an account exists, a reset link was sent.')
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Forgot password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm">Enter your registered email</label>
          <input {...register('email')} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="w-full bg-pink-200 text-white py-2 rounded">Send reset link</button>
      </form>
    </div>
  )
}
