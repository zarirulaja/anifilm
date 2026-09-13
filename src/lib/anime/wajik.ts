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

export function fixAnimeSlugTypos(slug: string): string {
  let text = slug.toLowerCase();
  text = text.replace(/b[le|lu|u]+ck/g, 'blue lock');
  text = text.replace(/boku-no-hero-academia/g, 'my hero academia');
  text = text.replace(/shingeki-no-kyojin/g, 'attack on titan');
  text = text.replace(/kimetsu-no-yaiba/g, 'demon slayer');
  text = text.replace(/kage-no-jitsuryokusha/g, 'the eminence in shadow');
  text = text.replace(/tensei-shitara-slime/g, 'that time i got reincarnated as a slime');
  text = text.replace(/jujutsu-kaisen/g, 'jujutsu kaisen');
  return text;
}

export async function resolveTmdbAnimeId(animeSlug: string): Promise<string> {
  const cleanId = animeSlug.replace(/-episode-\d+.*/i, '').trim();

  // Explicit check for Blue Lock variants (blelock, blulck, etc.)
  if (/b[le|lu|u]+ck/i.test(cleanId) || /blue.*lock/i.test(cleanId)) {
    return '131041';
  }

  // Explicit check for Jujutsu Kaisen
  if (/jujutsu.*kaisen/i.test(cleanId)) {
    return '95479';
  }

  // If already a valid TMDB TV numeric ID
  if (/^\d+$/.test(cleanId)) {
    try {
      const directRes = await fetch(`https://api.themoviedb.org/3/tv/${cleanId}?api_key=${TMDB_API_KEY}`);
      if (directRes.ok) {
        const d = await directRes.json();
        if (d.id) return String(d.id);
      }
    } catch {}
  }

  const fixedSlug = fixAnimeSlugTypos(cleanId);
  const q1 = fixedSlug.replace(/-(sub|dub)-indo.*/gi, '').replace(/[-_]/g, ' ').trim();
  try {
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q1)}&language=id-ID`);
    const searchJson = await searchRes.json();
    if (searchJson.results?.[0]?.id) {
      return String(searchJson.results[0].id);
    }
  } catch {}

  const q2 = q1
    .replace(/\b(\d+nd|\d+rd|\d+th|\d+st)\b/gi, '')
    .replace(/\bseason\s*\d*\b/gi, '')
    .replace(/\bs\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (q2 && q2 !== q1) {
    try {
      const searchRes2 = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q2)}&language=id-ID`);
      const searchJson2 = await searchRes2.json();
      if (searchJson2.results?.[0]?.id) {
        return String(searchJson2.results[0].id);
      }
    } catch {}
  }

  return '131041';
}

export async function fetchTMDBAnimeFallback(page: number = 1) {
  try {
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&language=id-ID&page=${page}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const list = (json.results || []).map((item: any) => ({
      id: String(item.id),
      animeId: String(item.id),
      title: item.name || item.original_name || 'Anime',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
      episodes: 'Sub Indo HD',
      releaseDay: 'Update',
      score: item.vote_average ? item.vote_average.toFixed(1) : '8.0',
      status: 'Ongoing',
    }));

    return {
      success: true,
      data: {
        ongoing: { animeList: list.slice(0, 10) },
        completed: { animeList: list.slice(10, 20) },
        animeList: list,
      }
    };
  } catch (e) {
    console.error('TMDB Anime fallback error:', e);
    return {
      success: false,
      data: {
        ongoing: { animeList: [] },
        completed: { animeList: [] },
        animeList: [],
      }
    };
  }
}

export async function fetchTMDBAnimeSlugDetail(animeId: string) {
  try {
    const tmdbId = await resolveTmdbAnimeId(animeId);
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=id-ID`;
    const res = await fetch(url);
    const d = await res.json();

    const title = d.name || d.original_name || animeId.replace(/-/g, ' ').toUpperCase();
    const epCount = d.number_of_episodes || 24;

    return {
      success: true,
      data: {
        details: {
          id: String(animeId),
          animeId: String(animeId),
          title,
          japanese: d.original_name || title,
          poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          synopsis: { paragraphList: [d.overview || 'Sinopsis tayangan anime.'] },
          status: d.status || 'Ongoing',
          score: d.vote_average ? d.vote_average.toFixed(1) : '8.5',
          type: 'Anime',
          episodes: `${epCount} Episode`,
          genreList: (d.genres || [{ name: 'Action' }, { name: 'Animation' }]).map((g: any) => ({ title: g.name, genreId: String(g.id || g.name) })),
          episodeList: Array.from({ length: Math.min(epCount, 24) }).map((_, i) => ({
            episodeId: `${animeId}-episode-${i + 1}`,
            title: `Episode ${i + 1}`,
          })),
        }
      }
    };
  } catch (e) {
    console.error('Anime detail fallback error:', e);
    return {
      success: true,
      data: {
        details: {
          id: animeId,
          animeId: animeId,
          title: animeId.replace(/-/g, ' ').toUpperCase(),
          poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          synopsis: { paragraphList: ['Sinopsis anime tayangan.'] },
          status: 'Ongoing',
          score: '8.0',
          type: 'Anime',
          episodes: '12 Episode',
          genreList: [{ title: 'Action', genreId: 'action' }, { title: 'Animation', genreId: 'animation' }],
          episodeList: Array.from({ length: 12 }).map((_, i) => ({
            episodeId: `${animeId}-episode-${i + 1}`,
            title: `Episode ${i + 1}`,
          })),
        }
      }
    };
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
        animeId: String(item.id),
        title: item.name || item.original_name,
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
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
    return await fetchTMDBAnimeSlugDetail(animeId);
  }
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/episode/${encodeURIComponent(episodeId)}`);
  } catch {
    const parts = episodeId.split('-episode-');
    const animeSlug = parts[0] || 'blue-lock';
    let epNum = parts[1] ? parts[1].replace(/\D/g, '') : '1';
    if (!epNum) epNum = '1';

    const tmdbId = await resolveTmdbAnimeId(animeSlug);

    const streamUrl = `https://autoembed.co/tv/tmdb/${tmdbId}-1-${epNum}`;

    return {
      success: true,
      data: {
        details: {
          id: episodeId,
          title: `Episode ${epNum}`,
          animeId: animeSlug,
          defaultStreamingUrl: streamUrl,
          hasPrevEpisode: Number(epNum) > 1,
          prevEpisode: Number(epNum) > 1 ? { episodeId: `${animeSlug}-episode-${Number(epNum) - 1}` } : null,
          hasNextEpisode: true,
          nextEpisode: { episodeId: `${animeSlug}-episode-${Number(epNum) + 1}` },
          server: {
            qualityList: [
              {
                title: 'HD 720p Sub Indo',
                serverList: [
                  { title: 'Server AutoEmbed HD', serverId: `autoembed-${tmdbId}-1-${epNum}` },
                  { title: 'Server MultiEmbed (Sub Indo)', serverId: `multiembed-${tmdbId}-1-${epNum}` },
                  { title: 'Server VidLink HD', serverId: `vidlink-${tmdbId}-1-${epNum}` },
                  { title: 'Server 2Embed HD', serverId: `2embed-${tmdbId}-1-${epNum}` },
                  { title: 'Server VidSrc HD', serverId: `vidsrc-${tmdbId}-1-${epNum}` },
                ]
              }
            ]
          }
        }
      }
    };
  }
}

export async function fetchWajikServerStream(serverId: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/server/${encodeURIComponent(serverId)}`);
  } catch {
    if (serverId.startsWith('multiembed-')) {
      const parts = serverId.replace('multiembed-', '').split('-');
      const tId = parts[0] || '131041';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://multiembed.mov/?video_id=${tId}&tmdb=1&s=1&e=${eNum}` } } };
    }
    if (serverId.startsWith('2embed-')) {
      const parts = serverId.replace('2embed-', '').split('-');
      const tId = parts[0] || '131041';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://www.2embed.cc/embedtv/${tId}&s=1&e=${eNum}` } } };
    }
    if (serverId.startsWith('vidlink-')) {
      const parts = serverId.replace('vidlink-', '').split('-');
      const tId = parts[0] || '131041';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://vidlink.pro/tv/${tId}/1/${eNum}` } } };
    }
    if (serverId.startsWith('vidsrc-')) {
      const parts = serverId.replace('vidsrc-', '').split('-');
      const tId = parts[0] || '131041';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://vidsrc.to/embed/tv/${tId}/1/${eNum}` } } };
    }
    const parts = serverId.replace('autoembed-', '').split('-');
    const tId = parts[0] || '131041';
    const eNum = parts[2] || '1';
    return { success: true, data: { details: { url: `https://autoembed.co/tv/tmdb/${tId}-1-${eNum}` } } };
  }
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

