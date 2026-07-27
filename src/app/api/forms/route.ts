import { NextResponse } from 'next/server';
import { FORMS } from '@/lib/forms';

export async function GET() {
  return NextResponse.json(FORMS);
}
