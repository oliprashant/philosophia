import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const headers: Record<string, string | null> = {};
    for (const [k, v] of req.headers) headers[k] = v;

    let raw = '';
    try {
      raw = await req.text();
    } catch (e) {
      console.error('[Debug Echo] req.text() failed', e);
      return NextResponse.json({ error: 'could not read body' }, { status: 500 });
    }

    console.info('[Debug Echo] headers=', headers);
    console.info('[Debug Echo] raw=', raw ? raw.slice(0, 200) : '<empty>');

    return NextResponse.json({ ok: true, length: raw.length, preview: raw ? raw.slice(0, 200) : '' });
  } catch (err) {
    console.error('[Debug Echo] error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
