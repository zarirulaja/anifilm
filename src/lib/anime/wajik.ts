const WAJIK_API_URL = process.env.WAJIK_API_URL || 'https://wajik-api-gold.vercel.app';

async function wajikFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WAJIK_API_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Wajik API error ${res.status} for ${endpoint}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.warn(`[Wajik API Fetch] ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function fetchWajikHome() {
  try {
    const res = await wajikFetch<any>('/otakudesu/home');
    if (res?.statusCode === 200 && res?.data) return res;
    throw new Error('Otakudesu home empty');
  } catch {
    return await wajikFetch<any>('/oploverz/home');
  }
}

export async function fetchWajikOngoing(page: number = 1) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/ongoing?page=${page}`);
    if (res?.statusCode === 200 && res?.data) return res;
    throw new Error('Otakudesu ongoing empty');
  } catch {
    return await wajikFetch<any>(`/oploverz/anime?status=ongoing&order=latest&page=${page}`);
  }
}

export async function fetchWajikCompleted(page: number = 1) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/completed?page=${page}`);
    if (res?.statusCode === 200 && res?.data) return res;
    throw new Error('Otakudesu completed empty');
  } catch {
    return await wajikFetch<any>(`/oploverz/anime?status=completed&order=rating&page=${page}`);
  }
}

export async function fetchWajikSearch(query: string) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/search?q=${encodeURIComponent(query)}`);
    if (res?.statusCode === 200 && res?.data?.animeList?.length) return res;
    throw new Error('Otakudesu search empty');
  } catch {
    return await wajikFetch<any>(`/oploverz/search?q=${encodeURIComponent(query)}`);
  }
}

export async function fetchWajikAnimeDetail(animeId: string) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/anime/${encodeURIComponent(animeId)}`);
    if (res?.statusCode === 200 && res?.data) return res;
  } catch {}

  try {
    const res = await wajikFetch<any>(`/oploverz/anime/${encodeURIComponent(animeId)}`);
    if (res?.statusCode === 200 && res?.data) return res;
  } catch {}

  const cleanQuery = animeId
    .replace(/-(sub|dub)-indo.*/gi, '')
    .replace(/-(ep|episode|op)-\d+.*/gi, '')
    .replace(/-/g, ' ')
    .trim();

  try {
    const sRes = await wajikFetch<any>(`/otakudesu/search?q=${encodeURIComponent(cleanQuery)}`);
    const first = sRes?.data?.animeList?.[0];
    if (first?.animeId) {
      const detail = await wajikFetch<any>(`/otakudesu/anime/${encodeURIComponent(first.animeId)}`);
      if (detail?.statusCode === 200 && detail?.data) return detail;
    }
  } catch {}

  try {
    const sRes = await wajikFetch<any>(`/oploverz/search?q=${encodeURIComponent(cleanQuery)}`);
    const first = sRes?.data?.animeList?.[0];
    const firstSlug = first?.animeId || first?.slug;
    if (firstSlug) {
      const detail = await wajikFetch<any>(`/oploverz/anime/${encodeURIComponent(firstSlug)}`);
      if (detail?.statusCode === 200 && detail?.data) return detail;
    }
  } catch {}

  throw new Error(`Detail anime ${animeId} tidak ditemukan`);
}

export async function fetchTMDBAnimeSlugDetail(animeId: string) {
  return await fetchWajikAnimeDetail(animeId);
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/episode/${encodeURIComponent(episodeId)}`);
    if (res?.statusCode === 200 && res?.data) return res;
  } catch {}

  try {
    const res = await wajikFetch<any>(`/oploverz/episode/${encodeURIComponent(episodeId)}`);
    if (res?.statusCode === 200 && res?.data) return res;
  } catch {}

  const cleanQuery = episodeId
    .replace(/-(sub|dub)-indo.*/gi, '')
    .replace(/-(ep|episode|op)-\d+.*/gi, '')
    .replace(/-/g, ' ')
    .trim();

  try {
    const sRes = await wajikFetch<any>(`/otakudesu/search?q=${encodeURIComponent(cleanQuery)}`);
    const first = sRes?.data?.animeList?.[0];
    if (first?.animeId) {
      const detail = await wajikFetch<any>(`/otakudesu/anime/${encodeURIComponent(first.animeId)}`);
      const epList = detail?.data?.details?.episodeList || [];
      const matched = epList.find((e: any) => e.episodeId === episodeId) || epList[0];
      if (matched?.episodeId) {
        return await wajikFetch<any>(`/otakudesu/episode/${encodeURIComponent(matched.episodeId)}`);
      }
    }
  } catch {}

  throw new Error(`Detail episode ${episodeId} tidak ditemukan`);
}

export async function fetchWajikServerStream(serverId: string) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/server/${encodeURIComponent(serverId)}`);
    if (res?.statusCode === 200 && res?.data) return res;
    throw new Error('Otakudesu server detail empty');
  } catch {
    return { success: true, data: { details: { url: serverId } } };
  }
}

export async function fetchWajikSchedule() {
  try {
    const res = await wajikFetch<any>('/otakudesu/schedule');
    if (res?.statusCode === 200 && res?.data) return res;
    throw new Error('Otakudesu schedule empty');
  } catch {
    return await wajikFetch<any>('/oploverz/schedule');
  }
}

export async function fetchWajikGenres() {
  try {
    return await wajikFetch<any>('/otakudesu/genre');
  } catch {
    return { statusCode: 200, statusMessage: 'OK', data: { genreList: [] } };
  }
}

export async function fetchWajikGenreAnime(genreId: string, page: number = 1) {
  try {
    return await wajikFetch<any>(`/otakudesu/genre/${encodeURIComponent(genreId)}?page=${page}`);
  } catch {
    return await fetchWajikOngoing(page);
  }
}
