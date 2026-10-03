import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const pathname = request.nextUrl.pathname
  const role = String(token?.role ?? '').toUpperCase()
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role)
  const adminOnlyPaths = ['/admin', '/admin/dashboard']

  if (pathname === '/admin/login') {
    if (token && isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    if (token && !isAdmin) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  if (adminOnlyPaths.includes(pathname)) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  if (pathname.startsWith('/admin') && !adminOnlyPaths.includes(pathname)) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', '/admin/dashboard')
      return NextResponse.redirect(loginUrl)
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  if (pathname.startsWith('/account') || pathname === '/checkout' || pathname === '/cart' || pathname === '/wishlist' || pathname === '/shop' || pathname === '/' || pathname.startsWith('/product')) {
    if (token && isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/account')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()')

  try {
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol
    if (process.env.NODE_ENV === 'production' && proto && !proto.includes('https')) {
      const url = request.nextUrl.clone()
      url.protocol = 'https:'
      return NextResponse.redirect(url)
    }
  } catch {
    // noop
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/account'],
}

