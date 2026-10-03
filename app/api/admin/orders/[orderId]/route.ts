import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !(token.role === 'ADMIN' || token.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const orderId = parts[parts.length - 1]

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true, address: true, payment: true, history: true },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ order })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !(token.role === 'ADMIN' || token.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const orderId = parts[parts.length - 1]

    const body = await req.json()
    const { toStatus, note } = body
    if (!toStatus) return NextResponse.json({ error: 'Missing toStatus' }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const fromStatus = order.status

    // create history record and update order status
    const [history] = await Promise.all([
      prisma.orderStatusHistory.create({ data: { orderId, fromStatus, toStatus, note } }),
      prisma.order.update({ where: { id: orderId }, data: { status: toStatus } }),
    ])

    return NextResponse.json({ ok: true, history })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
