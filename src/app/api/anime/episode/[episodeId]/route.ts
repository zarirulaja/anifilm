import { NextRequest, NextResponse } from 'next/server';
import { fetchWajikEpisodeDetail } from '@/lib/anime/wajik';
import { normalizeEpisodeDetail } from '@/lib/anime/adapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { episodeId: string } }
) {
  try {
    const episodeId = params.episodeId;
    if (!episodeId) {
      return NextResponse.json({ success: false, error: 'Episode ID is required' }, { status: 400 });
    }

    const raw = await fetchWajikEpisodeDetail(episodeId);
    const normalized = normalizeEpisodeDetail(raw, episodeId);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error(`API Error /api/anime/episode/${params.episodeId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail episode' },
      { status: 500 }
    );
  }
}
