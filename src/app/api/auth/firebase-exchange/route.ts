import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { exchangeFirebaseIdToken } from '@/lib/firebase-auth';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));

  if (!idToken) {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  try {
    const result = await exchangeFirebaseIdToken(idToken);

    if ('status' in result && result.status === 'missing-config') {
      return NextResponse.json(
        {
          ok: false,
          error: result.message,
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: result.user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as { message?: string })?.message || 'Invalid Firebase ID token.',
      },
      { status: 401 }
    );
  }
}
