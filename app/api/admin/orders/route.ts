import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !(token.role === 'ADMIN' || token.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize

    const [orders, count] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: pageSize,
        orderBy: { placedAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, items: true },
      }),
      prisma.order.count(),
    ])

    return NextResponse.json({ orders, count })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
