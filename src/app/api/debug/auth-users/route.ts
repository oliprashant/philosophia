import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function getHeaderSecret(req: NextRequest) {
  return req.headers.get('x-debug-secret') || req.nextUrl.searchParams.get('secret') || '';
}

function safeCompare(value: string, expected: string) {
  if (!value || !expected || value.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  const expectedSecret = process.env.DEBUG_AUTH_USERS_SECRET;
  const providedSecret = getHeaderSecret(req);

  if (!expectedSecret || !safeCompare(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const supabaseEmails = new Set<string>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.error('[Debug Auth Users] Supabase listUsers error:', error.message);
      return NextResponse.json({ error: 'Failed to list Supabase users' }, { status: 500 });
    }

    for (const user of data.users ?? []) {
      if (user.email) supabaseEmails.add(user.email.toLowerCase().trim());
    }

    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }

  const prismaUsers = await prisma.user.findMany({ select: { email: true } });
  const prismaEmails = new Set(
    prismaUsers
      .map(user => user.email.toLowerCase().trim())
      .filter(Boolean)
  );

  const onlyInPrisma = [...prismaEmails].filter(email => !supabaseEmails.has(email)).sort();
  const onlyInSupabase = [...supabaseEmails].filter(email => !prismaEmails.has(email)).sort();

  return NextResponse.json({
    counts: {
      prisma: prismaEmails.size,
      supabase: supabaseEmails.size,
      onlyInPrisma: onlyInPrisma.length,
      onlyInSupabase: onlyInSupabase.length,
    },
    onlyInPrisma,
    onlyInSupabase,
    inBoth: [...prismaEmails].filter(email => supabaseEmails.has(email)).sort(),
  });
}