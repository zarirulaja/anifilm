import { NextResponse } from 'next/server';
import { fetchWajikHome } from '@/lib/anime/wajik';
import { normalizeHomeResponse } from '@/lib/anime/adapter';

export async function GET() {
  try {
    const raw = await fetchWajikHome();
    const normalized = normalizeHomeResponse(raw);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('API Error /api/anime/home:', error);
    return NextResponse.json(
      { success: false, error: 'Layanan Wajik Anime API sedang tidak tersedia' },
      { status: 500 }
    );
  }
}
