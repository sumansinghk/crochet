"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: any) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Registration failed');
      }

      const signInResult = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error || 'Unable to sign in after registration');
      }

      const session = await getSession();

      if (session?.user) {
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Join us</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-900">Create your account</h1>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Full name</label>
            <input {...register('name', { required: true })} className="w-full rounded-xl border border-zinc-200 px-3 py-3 outline-none focus:border-rose-400" placeholder="Your name" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Email</label>
            <input type="email" {...register('email', { required: true })} className="w-full rounded-xl border border-zinc-200 px-3 py-3 outline-none focus:border-rose-400" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Phone</label>
            <input {...register('phone')} className="w-full rounded-xl border border-zinc-200 px-3 py-3 outline-none focus:border-rose-400" placeholder="9876543210" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Password</label>
            <input type="password" {...register('password', { required: true, minLength: 8 })} className="w-full rounded-xl border border-zinc-200 px-3 py-3 outline-none focus:border-rose-400" placeholder="Create a strong password" />
          </div>

          <button disabled={loading} className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-rose-500">Log in</Link>
        </div>
      </div>
    </div>
  );
}
