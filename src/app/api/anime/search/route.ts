import { NextRequest, NextResponse } from 'next/server';
import { fetchWajikSearch } from '@/lib/anime/wajik';
import { normalizePaginatedList } from '@/lib/anime/adapter';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: { animeList: [] } });
    }

    const raw = await fetchWajikSearch(query);
    const normalized = normalizePaginatedList(raw);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('API Error /api/anime/search:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal melakukan pencarian anime' },
      { status: 500 }
    );
  }
}
