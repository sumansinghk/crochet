import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { hashPassword } from '../../../lib/hash'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, password } = body
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 })

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({ data: { name, email, phone, hashedPassword } })

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
