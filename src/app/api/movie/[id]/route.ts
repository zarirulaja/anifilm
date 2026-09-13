import { NextRequest, NextResponse } from 'next/server';
import { fetchTMDBMovieDetail, fetchTMDBSeriesDetail } from '@/lib/movie/tmdb';
import { fetchLK21MovieDetail } from '@/lib/movie/lk21';
import { normalizeMovieDetail } from '@/lib/movie/adapter';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let movieId = params.id;
    if (Array.isArray(movieId)) {
      movieId = (movieId as string[]).join('/');
    }

    if (!movieId) {
      return NextResponse.json({ success: false, error: 'Movie ID required' }, { status: 400 });
    }

    // Try TMDB API first (numeric IDs)
    if (/^\d+$/.test(movieId)) {
      try {
        const raw = await fetchTMDBMovieDetail(movieId);
        const normalized = normalizeMovieDetail(raw, movieId);
        return NextResponse.json({ success: true, data: normalized });
      } catch {
        const rawSeries = await fetchTMDBSeriesDetail(movieId);
        const normalized = normalizeMovieDetail(rawSeries, movieId);
        return NextResponse.json({ success: true, data: normalized });
      }
    }

    // Fallback to LK21 for slug-based IDs
    try {
      const raw = await fetchLK21MovieDetail(movieId);
      const normalized = normalizeMovieDetail(raw, movieId);
      return NextResponse.json({ success: true, data: normalized });
    } catch {
      return NextResponse.json({ success: false, error: 'Detail film tidak ditemukan' }, { status: 404 });
    }
  } catch (error) {
    console.error(`API Error /api/movie/${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail film' },
      { status: 500 }
    );
  }
}
