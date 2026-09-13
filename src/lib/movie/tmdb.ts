const TMDB_API_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

async function tmdbFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const connector = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE_URL}${endpoint}${connector}api_key=${TMDB_API_KEY}&language=id-ID`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`TMDB API error ${res.status} for ${endpoint}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`[TMDB API ERROR] GET ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function fetchTMDBPopularMovies(page: number = 1) {
  return tmdbFetch<any>(`/movie/popular?page=${page}`);
}

export async function fetchTMDBPopularSeries(page: number = 1) {
  return tmdbFetch<any>(`/tv/popular?page=${page}`);
}

export async function fetchTMDBSearch(query: string) {
  return tmdbFetch<any>(`/search/multi?query=${encodeURIComponent(query)}`);
}

export async function fetchTMDBMovieDetail(id: string | number) {
  return tmdbFetch<any>(`/movie/${id}?append_to_response=credits,videos`);
}

export async function fetchTMDBSeriesDetail(id: string | number) {
  return tmdbFetch<any>(`/tv/${id}?append_to_response=credits,videos`);
}
