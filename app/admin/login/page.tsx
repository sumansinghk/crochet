"use client"
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const { register, handleSubmit } = useForm()
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('/admin/dashboard')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setRedirectTo(params.get('from') || '/admin/dashboard')
  }, [])

  async function onSubmit(data: any) {
    const res = await signIn('credentials', { redirect: false, email: data.email, password: data.password })

    if (!res || (res as any).error) {
      alert('Invalid admin credentials')
      return
    }

    const session = await getSession()
    const role = String((session?.user as any)?.role ?? '').toUpperCase()

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      await signOut({ redirect: false })
      alert('Only admin users can access the dashboard')
      return
    }

    router.push(redirectTo)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Admin Sign In</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm">Email</label>
            <input {...register('email')} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" {...register('password')} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2"><input type="checkbox" /> Remember me</label>
            <a href="/auth/forgot" className="text-sm text-pink-600">Forgot password?</a>
          </div>
          <button className="w-full bg-sage-200 text-white py-2 rounded" style={{background:'#D88CA2'}}>Sign in</button>
        </form>
      </div>
    </div>
  )
}
