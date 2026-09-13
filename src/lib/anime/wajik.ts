const WAJIK_API_URL = process.env.WAJIK_API_URL || 'http://localhost:3001';

async function wajikFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WAJIK_API_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      next: { revalidate: 300 }, // Cache server responses for 5 minutes by default
    });

    console.log(`[Wajik API] GET ${endpoint} - Status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`Wajik API error ${res.status} for ${endpoint}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error(`[Wajik API ERROR] GET ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function fetchWajikHome() {
  return wajikFetch<any>('/otakudesu/home');
}

export async function fetchWajikOngoing(page: number = 1) {
  return wajikFetch<any>(`/otakudesu/ongoing?page=${page}`);
}

export async function fetchWajikCompleted(page: number = 1) {
  return wajikFetch<any>(`/otakudesu/completed?page=${page}`);
}

export async function fetchWajikSearch(query: string) {
  return wajikFetch<any>(`/otakudesu/search?q=${encodeURIComponent(query)}`);
}

export async function fetchWajikAnimeDetail(animeId: string) {
  return wajikFetch<any>(`/otakudesu/anime/${encodeURIComponent(animeId)}`);
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
  return wajikFetch<any>(`/otakudesu/episode/${encodeURIComponent(episodeId)}`);
}

export async function fetchWajikServerStream(serverId: string) {
  return wajikFetch<any>(`/otakudesu/server/${encodeURIComponent(serverId)}`);
}

export async function fetchWajikSchedule() {
  return wajikFetch<any>('/otakudesu/schedule');
}

export async function fetchWajikGenres() {
  return wajikFetch<any>('/otakudesu/genre');
}

export async function fetchWajikGenreAnime(genreId: string, page: number = 1) {
  return wajikFetch<any>(`/otakudesu/genre/${encodeURIComponent(genreId)}?page=${page}`);
}
