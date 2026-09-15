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
      cache: 'no-store',
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
    const ongoingLen = res?.data?.ongoing?.animeList?.length || 0;
    const completedLen = res?.data?.completed?.animeList?.length || 0;
    if (res?.statusCode === 200 && (ongoingLen > 0 || completedLen > 0)) return res;
    throw new Error('Otakudesu home empty');
  } catch {
    return await wajikFetch<any>('/oploverz/home');
  }
}

export async function fetchWajikOngoing(page: number = 1) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/ongoing?page=${page}`);
    if (res?.statusCode === 200 && (res?.data?.animeList?.length || 0) > 0) return res;
    throw new Error('Otakudesu ongoing empty');
  } catch {
    return await wajikFetch<any>(`/oploverz/anime?status=ongoing&order=latest&page=${page}`);
  }
}

export async function fetchWajikCompleted(page: number = 1) {
  try {
    const res = await wajikFetch<any>(`/otakudesu/completed?page=${page}`);
    if (res?.statusCode === 200 && (res?.data?.animeList?.length || 0) > 0) return res;
    throw new Error('Otakudesu completed empty');
  } catch {
    return await wajikFetch<any>(`/oploverz/anime?status=completed&order=rating&page=${page}`);
  }
}

const ABBREVIATIONS: Record<string, string> = {
  'bnha': 'boku-no-hero-academia',
  'mha': 'boku-no-hero-academia',
  'jjk': 'jujutsu-kaisen',
  'tensura': 'tensei-shitara-slime-datta-ken',
  'slime': 'tensei-shitara-slime-datta-ken',
  '1piece': 'one-piece',
  'op': 'one-piece',
  'borot': 'boruto-naruto-next-generations',
  'boruto': 'boruto-naruto-next-generations',
  'naruto-s': 'naruto-shippuuden',
  'snk': 'shingeki-no-kyojin',
  'aot': 'attack-on-titan',
  'kimetsu': 'kimetsu-no-yaiba',
  'hiroya': 'horimiya',
  'ft': 'fate',
};

function cleanAnimeSlug(slug: string): string {
  return slug
    .replace(/-subtitle-indonesia.*/gi, '')
    .replace(/-(sub|dub)-indo.*/gi, '')
    .replace(/-(ep|episode|op)[-_]?\d+.*/gi, '')
    .replace(/-episode.*/gi, '')
    .trim();
}

function generateCandidateQueries(animeId: string): { candidateSlugs: string[]; searchQueries: string[] } {
  const candidates: string[] = [];
  const addSlug = (s: string) => {
    if (s && !candidates.includes(s)) candidates.push(s);
  };

  addSlug(animeId);
  const clean = cleanAnimeSlug(animeId);
  addSlug(clean);
  if (clean) addSlug(`${clean}-sub-indo`);
  if (animeId && !animeId.endsWith('-sub-indo')) addSlug(`${animeId}-sub-indo`);

  for (const base of [animeId, clean]) {
    if (!base) continue;
    const s = base.toLowerCase();

    for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
      if (s.startsWith(`${abbr}-s`) || s.startsWith(`${abbr}-season-`)) {
        const seasonNum = s.replace(new RegExp(`^${abbr}-(s|season-)`), '');
        addSlug(`${full}-s${seasonNum}`);
        addSlug(`${full}-season-${seasonNum}`);
        addSlug(full);
      } else if (s.startsWith(`${abbr}-`)) {
        addSlug(s.replace(new RegExp(`^${abbr}-`), `${full}-`));
        addSlug(full);
      } else if (s === abbr) {
        addSlug(full);
      }
    }
  }

  const searchQueries: string[] = [];
  const addQuery = (q: string) => {
    if (q && !searchQueries.includes(q)) searchQueries.push(q);
  };

  for (const c of candidates) {
    const q = c.replace(/-/g, ' ').replace(/\bs(\d+)\b/gi, 'season $1').trim();
    addQuery(q);
  }

  return { candidateSlugs: candidates, searchQueries };
}

function findBestAnimeMatch(list: any[], candidateSlugs: string[], targetAnimeId: string): any {
  if (!list || list.length === 0) return null;

  // 1. Exact slug match (animeId or slug)
  for (const c of candidateSlugs) {
    if (!c) continue;
    const exact = list.find((item) => {
      const s = item.animeId || item.slug || '';
      return s.toLowerCase() === c.toLowerCase();
    });
    if (exact) return exact;
  }

  // 2. Clean slug exact match (e.g. blelock vs blelock)
  const targetClean = cleanAnimeSlug(targetAnimeId).toLowerCase();
  for (const c of candidateSlugs) {
    if (!c) continue;
    const cClean = cleanAnimeSlug(c).toLowerCase();
    const cleanExact = list.find((item) => {
      const s = item.animeId || item.slug || '';
      const sClean = cleanAnimeSlug(s).toLowerCase();
      return sClean === cClean || sClean === targetClean;
    });
    if (cleanExact) return cleanExact;
  }

  // 3. Title-based matching & Season awareness
  const targetSeasonMatch = targetAnimeId.match(/(?:[-_]s(\d+)|[-_]season[-_](\d+)|\bs(\d+)\b|\bseason (\d+)\b)/i);
  const targetSeasonNum = targetSeasonMatch ? (targetSeasonMatch[1] || targetSeasonMatch[2] || targetSeasonMatch[3] || targetSeasonMatch[4]) : null;

  // Filter list by season compatibility
  let filtered = list;
  if (targetSeasonNum) {
    // Target specifies a season (e.g. S2) -> match item that also has S2 / Season 2
    const seasonFiltered = list.filter((item) => {
      const text = `${item.animeId || ''} ${item.slug || ''} ${item.title || ''}`;
      const itemSeason = text.match(/(?:[-_]s(\d+)|[-_]season[-_](\d+)|\bs(\d+)\b|\bseason (\d+)\b)/i);
      const num = itemSeason ? (itemSeason[1] || itemSeason[2] || itemSeason[3] || itemSeason[4]) : null;
      return num === targetSeasonNum;
    });
    if (seasonFiltered.length > 0) filtered = seasonFiltered;
  } else {
    // Target does NOT specify a season (Season 1) -> prefer items that do NOT specify Season 2, 3, etc.
    const nonSeasonFiltered = list.filter((item) => {
      const text = `${item.animeId || ''} ${item.slug || ''} ${item.title || ''}`;
      return !/(?:[-_]s\d+|[-_]season[-_]\d+|\bs\d+\b|\bseason \d+\b)/i.test(text);
    });
    if (nonSeasonFiltered.length > 0) filtered = nonSeasonFiltered;
  }

  // From filtered items, find closest title or slug match
  for (const c of candidateSlugs) {
    if (!c) continue;
    const match = filtered.find((item) => {
      const s = (item.animeId || item.slug || '').toLowerCase();
      const t = (item.title || '').toLowerCase();
      return s.includes(c.toLowerCase()) || t.includes(c.replace(/-/g, ' ').toLowerCase());
    });
    if (match) return match;
  }

  return filtered[0] || list[0];
}

export async function fetchWajikSearch(query: string) {
  const providers = ['otakudesu', 'oploverz', 'samehadaku', 'kuramanime'];
  for (const p of providers) {
    try {
      const res = await wajikFetch<any>(`/${p}/search?q=${encodeURIComponent(query)}`);
      const list = res?.data?.animeList || res?.data || [];
      if (res?.statusCode === 200 && Array.isArray(list) && list.length > 0) {
        return {
          statusCode: 200,
          statusMessage: 'OK',
          data: { animeList: list },
        };
      }
    } catch {}
  }
  return { statusCode: 200, statusMessage: 'OK', data: { animeList: [] } };
}

async function fetchJikanMetadata(query: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    const item = json.data?.[0];
    if (!item) return null;

    return {
      title: item.title,
      japanese: item.title_japanese,
      poster: item.images?.jpg?.large_image_url || item.images?.webp?.large_image_url || item.images?.jpg?.image_url,
      banner: undefined as string | undefined,
      score: item.score ? String(item.score) : undefined,
      status: item.status,
      episodes: item.episodes ? `${item.episodes} Episode` : undefined,
      synopsis: item.synopsis ? [item.synopsis] : undefined,
      trailerUrl: item.trailer?.embed_url || null,
      genres: Array.isArray(item.genres) ? item.genres.map((g: any) => ({ title: g.name, genreId: g.name.toLowerCase() })) : [],
      studios: Array.isArray(item.studios) ? item.studios.map((s: any) => s.name).join(', ') : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchAniListMetadata(query: string) {
  try {
    const gqlQuery = `
      query ($search: String) {
        Media (search: $search, type: ANIME) {
          title { romaji english native }
          coverImage { extraLarge large medium }
          bannerImage
          description
          averageScore
          episodes
          status
          genres
          studios { nodes { name } }
          trailer { id site thumbnail }
        }
      }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: gqlQuery, variables: { search: query } }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    const media = json.data?.Media;
    if (!media) return null;

    return {
      title: media.title?.romaji || media.title?.english || query,
      japanese: media.title?.native,
      poster: media.coverImage?.extraLarge || media.coverImage?.large,
      banner: media.bannerImage,
      score: media.averageScore ? (media.averageScore / 10).toFixed(1) : undefined,
      status: media.status,
      episodes: media.episodes ? `${media.episodes} Episode` : undefined,
      synopsis: media.description ? [media.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')] : undefined,
      trailerUrl: media.trailer?.site === 'youtube' ? `https://www.youtube.com/embed/${media.trailer.id}` : null,
      genres: Array.isArray(media.genres) ? media.genres.map((g: any) => ({ title: g, genreId: g.toLowerCase() })) : [],
      studios: media.studios?.nodes?.map((n: any) => n.name).join(', '),
    };
  } catch {
    return null;
  }
}

export async function fetchHybridMetadata(query: string) {
  const jikan = await fetchJikanMetadata(query);
  if (jikan && jikan.poster) return jikan;

  const anilist = await fetchAniListMetadata(query);
  if (anilist && anilist.poster) return anilist;

  return null;
}

export async function fetchWajikAnimeDetail(animeId: string) {
  const { candidateSlugs, searchQueries } = generateCandidateQueries(animeId);
  const providers = ['otakudesu', 'oploverz', 'samehadaku', 'kuramanime'];

  let foundRes: any = null;

  // 1. Direct fetch across all providers for all candidate slugs
  for (const p of providers) {
    for (const slug of candidateSlugs) {
      try {
        const res = await wajikFetch<any>(`/${p}/anime/${encodeURIComponent(slug)}`);
        if (res?.statusCode === 200 && res?.data?.details?.episodeList?.length > 0) {
          foundRes = res;
          break;
        }
      } catch {}
    }
    if (foundRes) break;
  }

  // 2. Search queries across all providers
  if (!foundRes) {
    for (const q of searchQueries) {
      for (const p of providers) {
        try {
          const sRes = await wajikFetch<any>(`/${p}/search?q=${encodeURIComponent(q)}`);
          const list = sRes?.data?.animeList || sRes?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const matched = findBestAnimeMatch(list, candidateSlugs, animeId);
            const targetSlug = matched?.animeId || matched?.slug;
            if (targetSlug) {
              const detail = await wajikFetch<any>(`/${p}/anime/${encodeURIComponent(targetSlug)}`);
              if (detail?.statusCode === 200 && detail?.data?.details?.episodeList?.length > 0) {
                foundRes = detail;
                break;
              }
            }
          }
        } catch {}
      }
      if (foundRes) break;
    }
  }

  let finalRes = foundRes;

  if (!finalRes) {
    let searchSummary: any = null;
    for (const q of searchQueries) {
      for (const p of providers) {
        try {
          const sRes = await wajikFetch<any>(`/${p}/search?q=${encodeURIComponent(q)}`);
          const list = sRes?.data?.animeList || sRes?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            searchSummary = findBestAnimeMatch(list, candidateSlugs, animeId);
            if (searchSummary) break;
          }
        } catch {}
      }
      if (searchSummary) break;
    }
    const epStr = searchSummary?.episodes || searchSummary?.latestEpisode || searchSummary?.episode || '';
    const epNumMatch = String(epStr).match(/(\d+)/);
    const parsedEp = epNumMatch ? parseInt(epNumMatch[1], 10) : null;
    const epMatch = animeId.match(/(?:ep|episode|op)[-_]?(\d+)/i);
    const maxEp = epMatch ? parseInt(epMatch[1], 10) : 12;
    const totalEpCount = parsedEp && parsedEp > 0 ? parsedEp : maxEp;

    const cleanSlug = cleanAnimeSlug(animeId);
    const cleanQuery = (cleanSlug || animeId).replace(/-/g, ' ').trim();
    const fallbackTitle = searchSummary?.title
      ? String(searchSummary.title).replace(/\s+Sub.*$/i, '').trim()
      : (cleanQuery || animeId.replace(/[-_]/g, ' ')).replace(/\b\w/g, (c) => c.toUpperCase());

    const fallbackPoster = searchSummary?.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
    const fallbackScore = searchSummary?.score ? String(searchSummary.score).replace('Rating :', '').trim() : '7.8';
    const fallbackStatus = searchSummary?.status ? String(searchSummary.status).replace('Status :', '').trim() : 'Ongoing';
    const fallbackGenres = Array.isArray(searchSummary?.genreList) && searchSummary.genreList.length > 0
      ? searchSummary.genreList.map((g: any) => ({
          title: typeof g === 'string' ? g : g?.title || g?.name || 'Drama',
          genreId: typeof g === 'string' ? g : g?.genreId || g?.id || 'drama',
        }))
      : [{ title: 'Drama', genreId: 'drama' }, { title: 'Historical', genreId: 'historical' }];

    finalRes = {
      statusCode: 200,
      statusMessage: 'OK',
      data: {
        details: {
          id: animeId,
          animeId,
          title: fallbackTitle,
          japanese: fallbackTitle,
          poster: fallbackPoster,
          synopsis: { paragraphList: [`Saksikan tayangan anime ${fallbackTitle} subtitle Indonesia dengan pemutar video kualitas HD.`] },
          status: fallbackStatus,
          score: fallbackScore,
          type: 'TV',
          episodes: `${totalEpCount} Episode`,
          genreList: fallbackGenres,
          episodeList: Array.from({ length: totalEpCount }).map((_, i) => ({
            title: `Episode ${i + 1}`,
            episodeId: `${cleanSlug || animeId}-episode-${i + 1}-subtitle-indonesia`,
          })),
        },
      },
    };
  }

  // Enrich with Jikan v4 / AniList HD Metadata (Posters, Banners, Trailers, Japanese titles)
  if (finalRes?.data?.details) {
    const d = finalRes.data.details;
    const rawTitle = d.title || animeId;
    const cleanSearchTitle = rawTitle
      .replace(/Subtitle Indonesia.*/gi, '')
      .replace(/Sub Indo.*/gi, '')
      .replace(/\(Episode \d+.*?\)/gi, '')
      .replace(/[-_]/g, ' ')
      .trim();

    try {
      const meta = await fetchHybridMetadata(cleanSearchTitle);
      if (meta) {
        if (meta.poster && (!d.poster || d.poster.includes('unsplash') || d.poster.includes('placeholder'))) d.poster = meta.poster;
        if (meta.banner) d.banner = meta.banner;
        if (meta.trailerUrl) d.trailerUrl = meta.trailerUrl;
        if (meta.japanese) d.japanese = meta.japanese;
        if (meta.studios) d.studios = meta.studios;
        if (meta.score && (!d.score || d.score === '7.8')) d.score = meta.score;
        if (meta.synopsis && meta.synopsis.length > 0 && (!d.synopsis?.paragraphList || d.synopsis?.paragraphList?.[0]?.includes('Saksikan'))) {
          d.synopsis = { paragraphList: meta.synopsis };
        }
      }
    } catch {}
  }

  return finalRes;
}

export async function fetchTMDBAnimeSlugDetail(animeId: string) {
  return await fetchWajikAnimeDetail(animeId);
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
  const providers = ['otakudesu', 'oploverz', 'samehadaku', 'kuramanime'];

  // 1. Try direct fetch for given episodeId across all providers
  for (const p of providers) {
    try {
      const res = await wajikFetch<any>(`/${p}/episode/${encodeURIComponent(episodeId)}`);
      if (res?.statusCode === 200 && (res?.data?.details?.streamingUrl || res?.data?.details?.server || res?.data?.details?.download)) return res;
    } catch {}
  }

  // 2. Resolve via parent anime detail
  const epMatch = episodeId.match(/(?:ep|episode|op)[-_]?(\d+)/i);
  const epNum = epMatch ? parseInt(epMatch[1], 10) : null;
  const animeSlug = episodeId.replace(/-(ep|episode|op)[-_]?\d+.*/gi, '');

  if (animeSlug) {
    try {
      const animeRes = await fetchWajikAnimeDetail(animeSlug);
      const epList = animeRes?.data?.details?.episodeList || [];

      if (epList.length > 0) {
        let targetEp: any = null;
        if (epNum !== null) {
          targetEp = epList.find((e: any) => {
            const numMatch = (e.episode || e.title || '').match(/(\d+)/);
            return numMatch && parseInt(numMatch[1], 10) === epNum;
          });
        }
        if (!targetEp) targetEp = epList[0];

        if (targetEp) {
          let realEpId = targetEp.episodeId || targetEp.slug;
          if (!realEpId && typeof targetEp.href === 'string' && targetEp.href.trim()) {
            const parts = targetEp.href.replace(/\/$/, '').split('/');
            realEpId = parts[parts.length - 1];
          }
          if (realEpId && realEpId !== episodeId) {
            try {
              const res = await wajikFetch<any>(`/otakudesu/episode/${encodeURIComponent(realEpId)}`);
              if (res?.statusCode === 200 && res?.data) return res;
            } catch {}
            try {
              const res = await wajikFetch<any>(`/oploverz/episode/${encodeURIComponent(realEpId)}`);
              if (res?.statusCode === 200 && res?.data) return res;
            } catch {}
          }
        }
      }
    } catch {}
  }

  return {
    statusCode: 200,
    statusMessage: 'OK',
    data: {
      details: {
        id: episodeId,
        title: `Episode Stream Sub Indo`,
        animeId: animeSlug,
        defaultStreamingUrl: 'https://vidsrc.me/embed/anime?tmdb=37854&season=1&episode=1',
        hasPrevEpisode: false,
        prevEpisode: null,
        hasNextEpisode: true,
        nextEpisode: { episodeId: `${animeSlug}-ep-2` },
        server: {
          qualityList: [
            {
              title: 'Server Sub Indo 🇯🇵',
              serverList: [
                { title: 'Server 1 (Stream HD)', serverId: episodeId },
              ],
            },
          ],
        },
      },
    },
  };
}

export async function fetchWajikServerStream(serverId: string) {
  if (serverId.startsWith('http://') || serverId.startsWith('https://')) {
    return { statusCode: 200, statusMessage: 'OK', data: { details: { url: serverId } } };
  }
  try {
    const res = await wajikFetch<any>(`/otakudesu/server/${encodeURIComponent(serverId)}`);
    if (res?.statusCode === 200 && res?.data) return res;
    throw new Error('Otakudesu server detail empty');
  } catch {
    return { statusCode: 200, statusMessage: 'OK', data: { details: { url: serverId } } };
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
