const WAJIK_API_URL = process.env.WAJIK_API_URL || 'http://localhost:3001';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';

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
      next: { revalidate: 300 },
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

export async function fetchTMDBAnimeFallback(page: number = 1) {
  try {
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&language=id-ID&page=${page}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const list = (json.results || []).map((item: any) => ({
      id: String(item.id),
      title: item.name || item.original_name || 'Anime',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
      currentEpisode: 'Sub Indo HD',
      releaseDay: 'Update',
      rating: item.vote_average ? item.vote_average.toFixed(1) : '8.0',
    }));

    return {
      success: true,
      data: {
        ongoing: list.slice(0, 10),
        completed: list.slice(10, 20),
        animeList: list,
      }
    };
  } catch (e) {
    console.error('TMDB Anime fallback error:', e);
    return { success: false, data: { ongoing: [], completed: [], animeList: [] } };
  }
}

export async function fetchWajikHome() {
  try {
    return await wajikFetch<any>('/otakudesu/home');
  } catch {
    return await fetchTMDBAnimeFallback(1);
  }
}

export async function fetchWajikOngoing(page: number = 1) {
  try {
    return await wajikFetch<any>(`/otakudesu/ongoing?page=${page}`);
  } catch {
    return await fetchTMDBAnimeFallback(page);
  }
}

export async function fetchWajikCompleted(page: number = 1) {
  try {
    return await wajikFetch<any>(`/otakudesu/completed?page=${page}`);
  } catch {
    return await fetchTMDBAnimeFallback(page);
  }
}

export async function fetchWajikSearch(query: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/search?q=${encodeURIComponent(query)}`);
  } catch {
    try {
      const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=id-ID`;
      const res = await fetch(url);
      const json = await res.json();
      const list = (json.results || []).map((item: any) => ({
        id: String(item.id),
        title: item.name || item.original_name,
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder.png',
        status: 'Anime Sub Indo',
      }));
      return { success: true, data: { animeList: list } };
    } catch {
      return { success: false, data: { animeList: [] } };
    }
  }
}

export async function fetchWajikAnimeDetail(animeId: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/anime/${encodeURIComponent(animeId)}`);
  } catch {
    // If numeric ID, fallback to TMDB detail
    if (/^\d+$/.test(animeId)) {
      try {
        const url = `https://api.themoviedb.org/3/tv/${animeId}?api_key=${TMDB_API_KEY}&language=id-ID`;
        const res = await fetch(url);
        const d = await res.json();
        return {
          success: true,
          data: {
            id: String(d.id),
            title: d.name || d.original_name,
            japaneseTitle: d.original_name,
            poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : '/placeholder.png',
            synopsis: d.overview || 'Sinopsis anime.',
            status: d.status || 'Completed',
            rating: d.vote_average ? d.vote_average.toFixed(1) : '8.0',
            genres: (d.genres || []).map((g: any) => g.name),
            episodes: Array.from({ length: Math.min(d.number_of_episodes || 12, 24) }).map((_, i) => ({
              id: `${animeId}-episode-${i + 1}`,
              title: `Episode ${i + 1}`,
              date: d.first_air_date || 'Terbaru',
            })),
          }
        };
      } catch (e) {
        throw e;
      }
    }
    throw new Error('Anime detail not available');
  }
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
