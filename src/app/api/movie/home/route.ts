import { NextRequest, NextResponse } from 'next/server';
import { fetchTMDBPopularMovies, fetchTMDBPopularSeries } from '@/lib/movie/tmdb';
import { normalizeMovieList } from '@/lib/movie/adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const [moviesRaw, seriesRaw] = await Promise.allSettled([
      fetchTMDBPopularMovies(1),
      fetchTMDBPopularSeries(1),
    ]);

    const popularMovies = moviesRaw.status === 'fulfilled' ? normalizeMovieList(moviesRaw.value) : [];
    const popularSeries = seriesRaw.status === 'fulfilled' ? normalizeMovieList(seriesRaw.value) : [];

    return NextResponse.json({
      success: true,
      data: {
        popularMovies,
        popularSeries,
      },
    });
  } catch (error) {
    console.error('API Error /api/movie/home:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data film & series' },
      { status: 500 }
    );
  }
}
