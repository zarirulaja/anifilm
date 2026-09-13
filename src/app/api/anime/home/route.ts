import { NextResponse } from 'next/server';
import { fetchWajikHome } from '@/lib/anime/wajik';
import { normalizeHomeResponse } from '@/lib/anime/adapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const raw = await fetchWajikHome();
    const normalized = normalizeHomeResponse(raw);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('API Error /api/anime/home:', error);
    return NextResponse.json(
      { success: false, error: 'Layanan Anime API sedang tidak tersedia' },
      { status: 500 }
    );
  }
}
