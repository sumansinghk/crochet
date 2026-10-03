import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { hashPassword } from '../../../../lib/hash'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const v = await prisma.verificationToken.findUnique({ where: { token } })
    if (!v || new Date(v.expires) < new Date()) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: v.identifier } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const hashedPassword = await hashPassword(password)
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } })
    await prisma.verificationToken.deleteMany({ where: { identifier: v.identifier } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
