// GET /api/forms — list all post forms (genres)
import { NextResponse } from 'next/server';
import { getFormsForApi } from '@/lib/forms';

export async function GET() {
  return NextResponse.json({ forms: getFormsForApi() });
}
