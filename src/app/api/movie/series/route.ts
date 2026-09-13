import { NextRequest, NextResponse } from 'next/server';
import { fetchTMDBPopularSeries } from '@/lib/movie/tmdb';
import { normalizeMovieList } from '@/lib/movie/adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page') || '1');

    const raw = await fetchTMDBPopularSeries(page);
    const movies = normalizeMovieList(raw);

    return NextResponse.json({ success: true, data: { movies } });
  } catch (error) {
    console.error('API Error /api/movie/series:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat series populer' },
      { status: 500 }
    );
  }
}
