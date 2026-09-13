import { NextRequest, NextResponse } from 'next/server';
import { fetchTMDBSearch } from '@/lib/movie/tmdb';
import { normalizeMovieList } from '@/lib/movie/adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    if (!query) {
      return NextResponse.json({ success: false, error: 'Query search required' }, { status: 400 });
    }

    const raw = await fetchTMDBSearch(query);
    const movies = normalizeMovieList(raw);

    return NextResponse.json({ success: true, data: { movies } });
  } catch (error) {
    console.error('API Error /api/movie/search:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencari film' },
      { status: 500 }
    );
  }
}
