import { NextRequest, NextResponse } from 'next/server';
import { fetchTMDBPopularMovies } from '@/lib/movie/tmdb';
import { normalizeMovieList } from '@/lib/movie/adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page') || '1');

    const raw = await fetchTMDBPopularMovies(page);
    const movies = normalizeMovieList(raw);

    return NextResponse.json({ success: true, data: { movies } });
  } catch (error) {
    console.error('API Error /api/movie/popular:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat film populer' },
      { status: 500 }
    );
  }
}
