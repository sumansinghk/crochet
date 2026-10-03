import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
  }

  const email = typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return NextResponse.json({
    success: true,
    message: 'Thanks for subscribing! Watch your inbox for yarn news and offers.',
  });
}
