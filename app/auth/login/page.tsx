"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: any) {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        throw new Error(result.error || 'Invalid email or password');
      }

      const session = await getSession();

      if ((session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-900">Login to Crochet N&apos; Bliss</h1>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Email</label>
            <input {...register('email', { required: true })} className="w-full rounded-xl border border-zinc-200 px-3 py-3 outline-none focus:border-rose-400" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Password</label>
            <input type="password" {...register('password', { required: true })} className="w-full rounded-xl border border-zinc-200 px-3 py-3 outline-none focus:border-rose-400" placeholder="••••••••" />
          </div>

          <button disabled={loading} className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-zinc-600">
          Need an account?{' '}
          <Link href="/auth/register" className="font-medium text-rose-500">Create one</Link>
        </div>
      </div>
    </div>
  );
}
