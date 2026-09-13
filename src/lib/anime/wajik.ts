const TMDB_API_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';

// Direct Map for popular anime slugs to their official TMDB TV show IDs
const POPULAR_SLUG_MAP: Record<string, string> = {
  'one-piece': '37854',
  '1piece': '37854',
  'blue-lock': '131041',
  'bluelock': '131041',
  'jujutsu-kaisen': '95479',
  'jjk': '95479',
  'naruto-shippuden': '31910',
  'naruto': '46260',
  'attack-on-titan': '1429',
  'shingeki-no-kyojin': '1429',
  'aot': '1429',
  'demon-slayer': '85937',
  'kimetsu-no-yaiba': '85937',
  'solo-leveling': '127532',
  'chainsaw-man': '114410',
  'frieren': '209867',
  'sousou-no-frieren': '209867',
  'my-hero-academia': '65930',
  'boku-no-hero-academia': '65930',
  'mha': '65930',
  'dragon-ball-super': '62715',
  'dragon-ball-z': '12971',
  'dragon-ball': '12609',
  'bleach': '30984',
  'death-note': '13916',
  'one-punch-man': '63926',
  'opm': '63926',
  'tokyo-ghoul': '61374',
  'seven-deadly-sins': '62104',
  'nanatsu-no-taizai': '62104',
  'spy-x-family': '120089',
  'kaiju-no-8': '207468',
  'dandadan': '213713',
  'hunter-x-hunter': '46298',
  'hxh': '46298',
  're-zero': '66263',
  'black-clover': '73223',
  'tokyo-revengers': '106454',
  'fullmetal-alchemist': '31911',
  'haikyuu': '60625',
  'steins-gate': '38692',
  'sword-art-online': '45782',
  'sao': '45782',
  'overlord': '63923',
  'classroom-of-the-elite': '72636',
  'youzitsu': '72636',
};

export async function resolveTmdbAnimeId(animeSlug: string): Promise<string> {
  const cleanId = animeSlug
    .replace(/-ep(isode)?-\d+.*/i, '')
    .replace(/-op-\d+.*/i, '')
    .replace(/-(sub|dub)-indo.*/gi, '')
    .trim();

  // 1. If cleanId is numeric, verify directly
  if (/^\d+$/.test(cleanId)) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${cleanId}?api_key=${TMDB_API_KEY}`);
      if (res.ok) {
        const d = await res.json();
        if (d.id) return String(d.id);
      }
    } catch {}
  }

  // 2. Check exact slug key in POPULAR_SLUG_MAP
  const lowerSlug = cleanId.toLowerCase();
  if (POPULAR_SLUG_MAP[lowerSlug]) {
    return POPULAR_SLUG_MAP[lowerSlug];
  }

  // 3. Regex match for popular anime titles
  if (/b[le|lu|u]+ck/i.test(cleanId) || /blue.*lock/i.test(cleanId)) return '131041';
  if (/jujutsu.*kaisen/i.test(cleanId) || /\bjjk\b/i.test(cleanId)) return '95479';
  if (/1piece|one.*piece/i.test(cleanId)) return '37854';
  if (/naruto.*shippuden/i.test(cleanId)) return '31910';
  if (/naruto/i.test(cleanId)) return '46260';
  if (/demon.*slayer|kimetsu/i.test(cleanId)) return '85937';
  if (/bleach/i.test(cleanId)) return '30984';
  if (/solo.*leveling/i.test(cleanId)) return '127532';
  if (/chainsaw.*man/i.test(cleanId)) return '114410';
  if (/frieren/i.test(cleanId)) return '209867';
  if (/my.*hero.*academia|boku.*no.*hero/i.test(cleanId)) return '65930';
  if (/attack.*on.*titan|shingeki/i.test(cleanId)) return '1429';

  // 4. Fallback search via TMDB Search API without language parameter
  const query = cleanId.replace(/[-_]/g, ' ').trim();
  try {
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`);
    const searchJson = await searchRes.json();
    if (searchJson.results && searchJson.results.length > 0) {
      return String(searchJson.results[0].id);
    }
  } catch {}

  return cleanId;
}

// Calculate exact Season and Episode numbers from an absolute episode number
export async function getSeasonAndEpisode(tmdbId: string, absEpisodeNum: number): Promise<{ season: number; episode: number }> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!res.ok) return { season: 1, episode: absEpisodeNum };
    const d = await res.json();
    const seasons = (d.seasons || []).filter((s: any) => s.season_number > 0);

    if (seasons.length === 0) return { season: 1, episode: absEpisodeNum };

    let remaining = absEpisodeNum;
    for (const s of seasons) {
      if (remaining <= s.episode_count) {
        return { season: s.season_number, episode: remaining };
      }
      remaining -= s.episode_count;
    }
    const lastSeason = seasons[seasons.length - 1];
    return { season: lastSeason.season_number, episode: remaining + lastSeason.episode_count };
  } catch (err) {
    return { season: 1, episode: absEpisodeNum };
  }
}

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
    if (json.statusCode && json.statusCode !== 200) {
      throw new Error(`Wajik API status ${json.statusCode}`);
    }

    return json;
  } catch (error) {
    console.warn(`[Wajik API Fallback] ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

const OTAKUDESU_BASE = 'https://otakudesu.cloud';

export async function fetchWajikHome() {
  try {
    return await wajikFetch<any>('/otakudesu/home');
  } catch {
    return await fetchOtakudesuScrapedHome();
  }
}

async function fetchOtakudesuScrapedHome() {
  try {
    const res = await fetch(`${OTAKUDESU_BASE}/`, { headers: { 'User-Agent': USER_AGENT }, next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Home HTTP ${res.status}`);
    const html = await res.text();

    const ongoing: any[] = [];
    const itemRegex = /<a href="https:\/\/[^"]*otakudesu[^"]*\/anime\/([^"\/]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: any;
    while ((m = itemRegex.exec(html)) !== null) {
      const animeId = m[1];
      const inner = m[2];
      const titleMatch = inner.match(/<h2[^>]*>([^<]+)<\/h2>/i) || inner.match(/title="([^"]+)"/i);
      const imgMatch = inner.match(/src="([^"]+)"/i);
      const epMatch = inner.match(/<div class="epz"[^>]*>([^<]+)/i);

      if (titleMatch && !animeId.includes('genre') && !ongoing.some(item => item.animeId === animeId)) {
        ongoing.push({
          id: animeId,
          animeId,
          title: titleMatch[1].replace(/Subtitle Indonesia/i, '').replace(/&#8211;/g, '-').trim(),
          poster: imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          episodes: epMatch ? epMatch[1].trim() : 'Sub Indo HD',
          releaseDay: 'Update Terbaru',
          score: '8.5',
          status: 'Ongoing'
        });
      }
    }

    if (ongoing.length >= 5) {
      return {
        success: true,
        data: {
          ongoing: ongoing.slice(0, 10),
          completed: ongoing.slice(10, 20)
        }
      };
    }
    throw new Error('Insufficient Otakudesu home items scraped');
  } catch (e) {
    console.error('Home anime fetch error, fallback to TMDB:', e);
    return await fetchTMDBHome();
  }
}

async function fetchTMDBHome() {
  try {
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=vote_count.desc&language=en-US`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const list = (json.results || []).map((item: any) => ({
      id: String(item.id),
      animeId: String(item.id),
      title: item.name || item.original_name || 'Anime',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
      episodes: 'Sub Indo HD',
      releaseDay: 'Update Hari Ini',
      score: item.vote_average ? item.vote_average.toFixed(1) : '8.5',
      status: 'Ongoing',
    }));

    return {
      success: true,
      data: {
        ongoing: list.slice(0, 10),
        completed: list.slice(10, 20),
      }
    };
  } catch {
    return { success: false, data: { ongoing: [], completed: [] } };
  }
}

export async function fetchWajikOngoing(page: number = 1) {
  try {
    return await wajikFetch<any>(`/otakudesu/ongoing?page=${page}`);
  } catch {
    return await fetchOtakudesuScrapedOngoing(page);
  }
}

async function fetchOtakudesuScrapedOngoing(page: number = 1) {
  try {
    const url = page === 1 ? `${OTAKUDESU_BASE}/ongoing-anime/` : `${OTAKUDESU_BASE}/ongoing-anime/page/${page}/`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Ongoing HTTP ${res.status}`);
    const html = await res.text();

    const animeList: any[] = [];
    const itemRegex = /<a href="https:\/\/[^"]*otakudesu[^"]*\/anime\/([^"\/]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: any;
    while ((m = itemRegex.exec(html)) !== null) {
      const animeId = m[1];
      const inner = m[2];
      const titleMatch = inner.match(/<h2[^>]*>([^<]+)<\/h2>/i) || inner.match(/title="([^"]+)"/i);
      const imgMatch = inner.match(/src="([^"]+)"/i);
      const epMatch = inner.match(/<div class="epz"[^>]*>([^<]+)/i);

      if (titleMatch && !animeId.includes('genre') && !animeList.some(item => item.animeId === animeId)) {
        animeList.push({
          id: animeId,
          animeId,
          title: titleMatch[1].replace(/Subtitle Indonesia/i, '').replace(/&#8211;/g, '-').trim(),
          poster: imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          episodes: epMatch ? epMatch[1].trim() : 'Sub Indo HD',
          status: 'Ongoing'
        });
      }
    }

    if (animeList.length > 0) {
      return {
        success: true,
        data: { animeList },
        pagination: { currentPage: page, hasNextPage: animeList.length >= 10, totalPages: 10 }
      };
    }
    throw new Error('No ongoing anime scraped');
  } catch {
    return await fetchTMDBOngoing(page);
  }
}

async function fetchTMDBOngoing(page: number = 1) {
  try {
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&language=en-US&page=${page}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const list = (json.results || []).map((item: any) => ({
      id: String(item.id),
      animeId: String(item.id),
      title: item.name || item.original_name,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
      episodes: 'Sub Indo HD',
      status: 'Ongoing',
    }));

    return {
      success: true,
      data: { animeList: list },
      pagination: { currentPage: page, hasNextPage: page < (json.total_pages || 10), totalPages: json.total_pages || 10 }
    };
  } catch {
    return { success: false, data: { animeList: [] } };
  }
}

export async function fetchWajikCompleted(page: number = 1) {
  try {
    return await wajikFetch<any>(`/otakudesu/completed?page=${page}`);
  } catch {
    return await fetchOtakudesuScrapedCompleted(page);
  }
}

async function fetchOtakudesuScrapedCompleted(page: number = 1) {
  try {
    const url = page === 1 ? `${OTAKUDESU_BASE}/complete-anime/` : `${OTAKUDESU_BASE}/complete-anime/page/${page}/`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Completed HTTP ${res.status}`);
    const html = await res.text();

    const animeList: any[] = [];
    const itemRegex = /<a href="https:\/\/[^"]*otakudesu[^"]*\/anime\/([^"\/]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: any;
    while ((m = itemRegex.exec(html)) !== null) {
      const animeId = m[1];
      const inner = m[2];
      const titleMatch = inner.match(/<h2[^>]*>([^<]+)<\/h2>/i) || inner.match(/title="([^"]+)"/i);
      const imgMatch = inner.match(/src="([^"]+)"/i);
      const epMatch = inner.match(/<div class="epz"[^>]*>([^<]+)/i);

      if (titleMatch && !animeId.includes('genre') && !animeList.some(item => item.animeId === animeId)) {
        animeList.push({
          id: animeId,
          animeId,
          title: titleMatch[1].replace(/Subtitle Indonesia/i, '').replace(/&#8211;/g, '-').trim(),
          poster: imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          episodes: epMatch ? epMatch[1].trim() : 'Complete Sub Indo',
          status: 'Completed'
        });
      }
    }

    if (animeList.length > 0) {
      return {
        success: true,
        data: { animeList },
        pagination: { currentPage: page, hasNextPage: animeList.length >= 10, totalPages: 10 }
      };
    }
    throw new Error('No completed anime scraped');
  } catch {
    return await fetchTMDBCompleted(page);
  }
}

async function fetchTMDBCompleted(page: number = 1) {
  try {
    const targetPage = page + 1;
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=vote_count.desc&language=en-US&page=${targetPage}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const list = (json.results || []).map((item: any) => ({
      id: String(item.id),
      animeId: String(item.id),
      title: item.name || item.original_name,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
      episodes: 'Sub Indo HD',
      status: 'Completed',
    }));

    return {
      success: true,
      data: { animeList: list },
      pagination: { currentPage: page, hasNextPage: page < 10, totalPages: 10 }
    };
  } catch {
    return { success: false, data: { animeList: [] } };
  }
}

export async function fetchWajikSearch(query: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/search?q=${encodeURIComponent(query)}`);
  } catch {
    return await fetchOtakudesuScrapedSearch(query);
  }
}

async function fetchOtakudesuScrapedSearch(query: string) {
  try {
    const url = `${OTAKUDESU_BASE}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
    const html = await res.text();

    const animeList: any[] = [];
    const searchItemRegex = /<li[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<h2[^>]*><a href="https:\/\/[^"]*otakudesu[^"]*\/anime\/([^"\/]+)\/?"[^>]*>([^<]+)<\/a>/gi;
    let m: any;
    while ((m = searchItemRegex.exec(html)) !== null) {
      animeList.push({
        id: m[2],
        animeId: m[2],
        title: m[3].replace(/Subtitle Indonesia/i, '').replace(/&#8211;/g, '-').trim(),
        poster: m[1],
        status: 'Anime Sub Indo'
      });
    }

    if (animeList.length === 0) {
      const altRegex = /<h2[^>]*><a href="https:\/\/[^"]*otakudesu[^"]*\/anime\/([^"\/]+)\/?"[^>]*>([^<]+)<\/a>/gi;
      while ((m = altRegex.exec(html)) !== null) {
        animeList.push({
          id: m[1],
          animeId: m[1],
          title: m[2].replace(/Subtitle Indonesia/i, '').replace(/&#8211;/g, '-').trim(),
          poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          status: 'Anime Sub Indo'
        });
      }
    }

    if (animeList.length > 0) {
      return { success: true, data: { animeList } };
    }
    throw new Error('No search results scraped');
  } catch {
    return await fetchTMDBSearch(query);
  }
}

async function fetchTMDBSearch(query: string) {
  try {
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
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

export async function getAnimeSearchTitle(idOrSlug: string): Promise<string> {
  const cleanId = idOrSlug.replace(/-ep(isode)?-\d+.*/i, '').replace(/-op-\d+.*/i, '').replace(/-(sub|dub)-indo.*/gi, '').trim();
  if (TMDB_TITLE_MAP[cleanId]) return TMDB_TITLE_MAP[cleanId];
  if (/^\d+$/.test(cleanId)) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${cleanId}?api_key=${TMDB_API_KEY}`);
      if (res.ok) {
        const d = await res.json();
        if (d.name || d.original_name) return d.name || d.original_name;
      }
    } catch {}
  }
  return cleanId.replace(/[-_]/g, ' ');
}

export async function fetchWajikAnimeDetail(animeId: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/anime/${encodeURIComponent(animeId)}`);
  } catch {
    return await fetchOtakudesuScrapedDetail(animeId);
  }
}

async function fetchOtakudesuScrapedDetail(animeId: string) {
  try {
    const cleanId = animeId.replace(/^\//, '').replace(/\/$/, '');
    let url = `${OTAKUDESU_BASE}/anime/${cleanId}/`;
    let res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    
    // If cleanId is numeric or direct slug 404s, search Otakudesu by title
    if (!res.ok || /^\d+$/.test(cleanId)) {
      const title = await getAnimeSearchTitle(cleanId);
      const searchUrl = `${OTAKUDESU_BASE}/?s=${encodeURIComponent(title)}&post_type=anime`;
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (searchRes.ok) {
        const searchHtml = await searchRes.text();
        const animeMatch = searchHtml.match(/<h2[^>]*><a href="(https:\/\/[^"]*otakudesu[^"]*\/anime\/[^"\/]+\/?)"[^>]*>/i);
        if (animeMatch) {
          url = animeMatch[1];
          res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        }
      }
    }

    if (!res.ok) throw new Error(`Anime detail status ${res.status}`);
    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/<div class="j2xtda">[^<]*<h1>([^<]+)/i);
    const title = titleMatch ? titleMatch[1].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/Subtitle Indonesia.*/i, '').trim() : cleanId;

    const posterMatch = html.match(/<img[^>]+src="(https:\/\/[^"]+\.(jpg|png|jpeg|webp))"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    const synopsisMatch = html.match(/<div class="sinopc">([\s\S]*?)<\/div>/i);
    const synopsisText = synopsisMatch ? synopsisMatch[1].replace(/<[^>]+>/g, '').trim() : 'Sinopsis tayangan anime.';

    const epMatches: any[] = [];
    const epRegex = /href="(https:\/\/[^"]*otakudesu[^"]*\/episode\/([^"\/]+)\/?)"[^>]*>([^<]+)/gi;
    let m: any;
    while ((m = epRegex.exec(html)) !== null) {
      const epId = m[2];
      const epTitle = m[3];
      if (epId && epTitle && !epMatches.some(e => e.episodeId === epId)) {
        epMatches.push({
          episodeId: epId,
          title: epTitle.replace(/&#8211;/g, '-').replace(/&amp;/g, '&').trim(),
        });
      }
    }

    if (epMatches.length > 0) {
      return {
        success: true,
        data: {
          details: {
            id: cleanId,
            animeId: cleanId,
            title,
            japanese: title,
            poster,
            synopsis: { paragraphList: [synopsisText] },
            status: 'Ongoing',
            score: '8.5',
            type: 'Anime',
            episodes: `${epMatches.length} Episode`,
            genreList: [{ title: 'Action', genreId: 'action' }, { title: 'Animation', genreId: 'animation' }],
            episodeList: epMatches,
          }
        }
      };
    }
    throw new Error('No episodes scraped from Otakudesu');
  } catch (e) {
    console.error(`Otakudesu detail scrape error for ${animeId}, fallback to TMDB:`, e);
    return await fetchTMDBAnimeDetail(animeId);
  }
}

async function fetchTMDBAnimeDetail(animeId: string) {
  try {
    const tmdbId = await resolveTmdbAnimeId(animeId);
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB status ${res.status}`);
    const d = await res.json();

    const title = d.name || d.original_name || animeId.replace(/-(sub|dub)-indo.*/gi, '').replace(/-/g, ' ').toUpperCase();
    
    const regularSeasons = (d.seasons || []).filter((s: any) => s.season_number > 0);
    let totalEpCount = d.number_of_episodes || 24;
    if (regularSeasons.length > 0) {
      const sum = regularSeasons.reduce((acc: number, s: any) => acc + (s.episode_count || 0), 0);
      if (sum > 0) totalEpCount = sum;
    }

    const episodeList = Array.from({ length: totalEpCount }).map((_, i) => ({
      episodeId: `${tmdbId}-ep-${i + 1}`,
      title: `Episode ${i + 1}`,
    }));

    return {
      success: true,
      data: {
        details: {
          id: String(tmdbId),
          animeId: String(tmdbId),
          title,
          japanese: d.original_name || title,
          poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          synopsis: { paragraphList: [d.overview || 'Sinopsis tayangan anime.'] },
          status: d.status || 'Ongoing',
          score: d.vote_average ? d.vote_average.toFixed(1) : '8.5',
          type: 'Anime',
          episodes: `${totalEpCount} Episode`,
          genreList: (d.genres || [{ name: 'Action' }, { name: 'Animation' }]).map((g: any) => ({ title: g.name, genreId: String(g.id || g.name) })),
          episodeList,
        }
      }
    };
  } catch (e) {
    const cleanTitle = animeId.replace(/-(sub|dub)-indo.*/gi, '').replace(/-/g, ' ').toUpperCase();
    return {
      success: true,
      data: {
        details: {
          id: animeId,
          animeId: animeId,
          title: cleanTitle,
          japanese: cleanTitle,
          poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
          synopsis: { paragraphList: [`Sinopsis tayangan anime ${cleanTitle}.`] },
          status: 'Ongoing',
          score: '8.0',
          type: 'Anime',
          episodes: '24 Episode',
          genreList: [{ title: 'Action', genreId: 'action' }, { title: 'Animation', genreId: 'animation' }],
          episodeList: Array.from({ length: 24 }).map((_, i) => ({
            episodeId: `${animeId}-ep-${i + 1}`,
            title: `Episode ${i + 1}`,
          })),
        }
      }
    };
  }
}

const TMDB_TITLE_MAP: Record<string, string> = {
  '1429': 'Attack on Titan',
  '37854': 'One Piece',
  '95479': 'Jujutsu Kaisen',
  '131041': 'Blue Lock',
  '85937': 'Demon Slayer',
  '31910': 'Naruto Shippuden',
  '46260': 'Naruto',
  '127532': 'Solo Leveling',
  '114410': 'Chainsaw Man',
  '209867': 'Frieren',
  '65930': 'My Hero Academia',
  '62715': 'Dragon Ball Super',
  '12971': 'Dragon Ball Z',
  '30984': 'Bleach',
  '13916': 'Death Note',
  '63926': 'One Punch Man',
  '61374': 'Tokyo Ghoul',
  '62104': 'Seven Deadly Sins',
  '120089': 'Spy x Family',
  '207468': 'Kaiju No 8',
  '213713': 'Dandadan',
  '46298': 'Hunter x Hunter',
  '66263': 'Re Zero',
  '73223': 'Black Clover',
  '106454': 'Tokyo Revengers',
  '31911': 'Fullmetal Alchemist',
  '60625': 'Haikyuu',
  '38692': 'Steins Gate',
  '45782': 'Sword Art Online',
  '63923': 'Overlord',
  '72636': 'Classroom of the Elite',
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function resolveOtakudesuStream(animeTitle: string, epNum: number): Promise<string | null> {
  try {
    const searchUrl = `https://otakudesu.cloud/?s=${encodeURIComponent(animeTitle)}&post_type=anime`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(4000)
    });
    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();

    const animeMatch = searchHtml.match(/<h2[^>]*><a href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    if (!animeMatch) return null;

    const animeUrl = animeMatch[1];
    const detailRes = await fetch(animeUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(4000)
    });
    if (!detailRes.ok) return null;
    const detailHtml = await detailRes.text();

    const epRegex = /href="(https:\/\/[^"]*otakudesu[^"]*\/episode\/[^"]+)"[^>]*>([^<]+)/gi;
    const episodes: Array<{ url: string; title: string }> = [];
    let m: any;
    while ((m = epRegex.exec(detailHtml)) !== null) {
      const epUrl = m[1];
      const epTitle = m[2];
      if (epUrl && epTitle) {
        episodes.push({ url: epUrl, title: epTitle.trim() });
      }
    }

    if (episodes.length === 0) return null;

    let targetEp = episodes.find(e => {
      const matchNum = e.title.match(/episode\s*(\d+)/i) || e.url.match(/episode-(\d+)/i);
      return matchNum && parseInt(matchNum[1], 10) === epNum;
    });

    if (!targetEp) {
      const reversed = [...episodes].reverse();
      targetEp = reversed[epNum - 1] || reversed[0];
    }

    const epRes = await fetch(targetEp.url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(4000)
    });
    if (!epRes.ok) return null;
    const epHtml = await epRes.text();

    const iframeMatch = epHtml.match(/<iframe[^>]+src="([^"]+)"/i) || epHtml.match(/src="([^"]*(?:desustream|nekoclouds|odstream|desu\.stream|moeclip|streamanime)[^"]*)"/i);
    if (iframeMatch) {
      return iframeMatch[1];
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function fetchTMDBAnimeSlugDetail(animeId: string) {
  return await fetchWajikAnimeDetail(animeId);
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
  try {
    return await wajikFetch<any>(`/otakudesu/episode/${encodeURIComponent(episodeId)}`);
  } catch {
    return await fetchOtakudesuScrapedEpisode(episodeId);
  }
}

async function fetchOtakudesuScrapedEpisode(episodeId: string) {
  try {
    let animeSlug = '131041';
    let epNum = 1;

    if (episodeId.includes('-ep-')) {
      const parts = episodeId.split('-ep-');
      animeSlug = parts[0] || '131041';
      epNum = parseInt(parts[1] || '1', 10) || 1;
    } else if (episodeId.includes('-op-')) {
      const parts = episodeId.split('-op-');
      animeSlug = parts[0] || '131041';
      epNum = parseInt(parts[1] || '1', 10) || 1;
    } else if (episodeId.includes('-episode-')) {
      const parts = episodeId.split('-episode-');
      animeSlug = parts[0] || '131041';
      epNum = parseInt(parts[1] || '1', 10) || 1;
    } else {
      const match = episodeId.match(/^(.*?)[-_]?(?:ep|episode|op)?[-_]?(\d+)$/i);
      if (match) {
        animeSlug = match[1] || '131041';
        epNum = parseInt(match[2] || '1', 10) || 1;
      }
    }

    const tmdbId = await resolveTmdbAnimeId(animeSlug);
    const { season, episode } = await getSeasonAndEpisode(tmdbId, epNum);

    const animeTitle = await getAnimeSearchTitle(animeSlug);
    const otakudesuStream = await resolveOtakudesuStream(animeTitle, epNum);

    const defaultStreamUrl = otakudesuStream || `https://vidsrc.me/embed/anime?tmdb=${tmdbId}&season=${season}&episode=${episode}`;

    const serverList = [];
    if (otakudesuStream) {
      const b64 = Buffer.from(otakudesuStream).toString('base64url');
      serverList.push({ title: 'Server 1 (Otakudesu Sub Indo - Audio Jepang 🇯🇵)', serverId: `otakudesu-${b64}` });
      serverList.push({ title: 'Server 2 (VidSrc Anime - Audio Jepang 🇯🇵)', serverId: `vidsrcanime-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 3 (VidSrc.pm Anime - Audio Jepang 🇯🇵)', serverId: `vidsrcpmanime-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 4 (2Embed Skin)', serverId: `2embedskin-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 5 (AutoEmbed HD)', serverId: `autoembed-${tmdbId}-${season}-${episode}` });
    } else {
      serverList.push({ title: 'Server 1 (VidSrc Anime - Audio Jepang 🇯🇵)', serverId: `vidsrcanime-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 2 (VidSrc.pm Anime - Audio Jepang 🇯🇵)', serverId: `vidsrcpmanime-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 3 (2Embed Skin)', serverId: `2embedskin-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 4 (VidSrc Ultra HD)', serverId: `vidsrc-${tmdbId}-${season}-${episode}` });
      serverList.push({ title: 'Server 5 (AutoEmbed HD)', serverId: `autoembed-${tmdbId}-${season}-${episode}` });
    }

    return {
      success: true,
      data: {
        details: {
          id: episodeId,
          title: `Episode ${epNum}`,
          animeId: tmdbId,
          defaultStreamingUrl: defaultStreamUrl,
          hasPrevEpisode: epNum > 1,
          prevEpisode: epNum > 1 ? { episodeId: `${tmdbId}-ep-${epNum - 1}` } : null,
          hasNextEpisode: true,
          nextEpisode: { episodeId: `${tmdbId}-ep-${epNum + 1}` },
          server: {
            qualityList: [
              {
                title: 'HD Subbed Servers (Audio Asli Jepang 🇯🇵 & Sub Indo)',
                serverList
              }
            ]
          }
        }
      }
    };
  } catch (e) {
    console.error(`Episode detail error for ${episodeId}:`, e);
    return {
      success: false,
      data: null
    };
  }
}

export async function fetchWajikServerStream(serverId: string) {
  try {
    if (serverId.startsWith('otakudesu-')) {
      const b64 = serverId.replace('otakudesu-', '');
      try {
        const decodedUrl = Buffer.from(b64, 'base64url').toString('utf-8');
        if (decodedUrl.startsWith('http')) {
          return { success: true, data: { details: { url: decodedUrl } } };
        }
      } catch {}
    }
    if (serverId.startsWith('vidsrcanime-')) {
      const parts = serverId.replace('vidsrcanime-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://vidsrc.me/embed/anime?tmdb=${tId}&season=${sNum}&episode=${eNum}` } } };
    }
    if (serverId.startsWith('vidsrcpmanime-')) {
      const parts = serverId.replace('vidsrcpmanime-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://vidsrc.pm/embed/anime/${tId}/${sNum}/${eNum}` } } };
    }
    if (serverId.startsWith('2embedskin-')) {
      const parts = serverId.replace('2embedskin-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://2embed.skin/embedtv/${tId}&s=${sNum}&e=${eNum}` } } };
    }
    if (serverId.startsWith('autoembed-')) {
      const parts = serverId.replace('autoembed-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://autoembed.co/tv/tmdb/${tId}-${sNum}-${eNum}` } } };
    }
    const parts = serverId.replace('vidsrc-', '').split('-');
    const tId = parts[0] || '131041';
    const sNum = parts[1] || '1';
    const eNum = parts[2] || '1';
    return { success: true, data: { details: { url: `https://vidsrc.to/embed/tv/${tId}/${sNum}/${eNum}` } } };
  } catch {
    return { success: false, data: { details: { url: '' } } };
  }
}

export async function fetchWajikSchedule() {
  return { success: true, data: [] };
}

export async function fetchWajikGenres() {
  return { success: true, data: [] };
}

export async function fetchWajikGenreAnime(genreId: string, page: number = 1) {
  return await fetchWajikOngoing(page);
}
