// src/app/api/newsletter/route.ts
// POST /api/newsletter → subscribe an email to the newsletter
// Stores in DB and optionally syncs to Mailchimp.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

async function syncToMailchimp(email: string) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!apiKey || !listId) return; // Mailchimp not configured – skip silently

  // Derive datacenter from API key (format: key-us1)
  const dc = apiKey.split('-').pop();
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email, status: 'subscribed' }),
  });
  // We intentionally don't throw on Mailchimp errors – local DB save is the source of truth.
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

  const { email } = parsed.data;

  const existing = await prisma.newsletterSubscription.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ message: 'Already subscribed' });

  try {
    await prisma.newsletterSubscription.create({
      data: {
        email,
        userId: session?.user ? (session.user as any).id : null,
        confirmed: true, // For now, skip double opt-in. Add email confirmation flow for production.
      },
    });

    // Background: sync to Mailchimp
    syncToMailchimp(email).catch(console.error);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[Newsletter]', err);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
