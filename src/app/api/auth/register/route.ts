import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

function generateOtp(length = 8) {
  const max = 10 ** length;
  return String(Math.floor(Math.random() * max)).padStart(length, '0');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const hash = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    if (existing && existing.emailVerified) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = existing
      ? await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            name,
            password: hash,
            passwordHash: hash,
            emailVerified: false,
          },
        })
      : await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            password: hash,
            passwordHash: hash,
            role: 'READER',
            emailVerified: false,
          },
        });

    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: otp,
        expires: expiresAt,
      },
    });

    await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your Philosophia account',
      html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>This code expires in 30 minutes.</p>`,
    });

    return NextResponse.json({ success: true, requiresVerification: true, email: user.email });
  } catch (error) {
    console.error('[Auth Register POST]', error);
    return NextResponse.json({ error: 'Could not register account' }, { status: 500 });
  }
}
