const LK21_API_URL = process.env.LK21_API_URL || 'http://localhost:3002';

async function lk21Fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${LK21_API_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      next: { revalidate: 300 },
    });

    console.log(`[LK21 API] GET ${endpoint} - Status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`LK21 API error ${res.status} for ${endpoint}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error(`[LK21 API ERROR] GET ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function fetchLK21PopularMovies(page: number = 1) {
  return lk21Fetch<any>(`/popular/movies?page=${page}`);
}

export async function fetchLK21LatestMovies(page: number = 1) {
  return lk21Fetch<any>(`/movies?page=${page}`);
}

export async function fetchLK21PopularSeries(page: number = 1) {
  return lk21Fetch<any>(`/popular/series?page=${page}`);
}

export async function fetchLK21LatestSeries(page: number = 1) {
  return lk21Fetch<any>(`/series?page=${page}`);
}

export async function fetchLK21Search(query: string) {
  return lk21Fetch<any>(`/search/${encodeURIComponent(query)}`);
}

export async function fetchLK21MovieDetail(movieId: string) {
  return lk21Fetch<any>(`/movies/${encodeURIComponent(movieId)}`);
}

export async function fetchLK21SeriesDetail(seriesId: string) {
  return lk21Fetch<any>(`/series/${encodeURIComponent(seriesId)}`);
}
