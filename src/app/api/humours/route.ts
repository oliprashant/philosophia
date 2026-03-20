// src/app/api/humours/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const humours = await prisma.humour.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ humours });
}
