import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ ok: true }) // don't reveal

    const token = randomBytes(24).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.verificationToken.create({ data: { identifier: email, token, expires } })

    // TODO: send email via SMTP provider; for now log reset link
    console.log('Password reset link:', `${process.env.NEXTAUTH_URL}/auth/reset?token=${token}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
