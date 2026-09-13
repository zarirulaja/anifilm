import { NextRequest, NextResponse } from 'next/server';
import { fetchWajikAnimeDetail } from '@/lib/anime/wajik';
import { normalizeAnimeDetail } from '@/lib/anime/adapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Anime ID is required' }, { status: 400 });
    }

    const raw = await fetchWajikAnimeDetail(id);
    const normalized = normalizeAnimeDetail(raw, id);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error(`API Error /api/anime/${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail anime' },
      { status: 500 }
    );
  }
}
