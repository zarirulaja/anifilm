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

export async function fetchWajikHome() {
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
  } catch (e) {
    console.error('Home anime fetch error:', e);
    return {
      success: false,
      data: { ongoing: [], completed: [] }
    };
  }
}

export async function fetchWajikOngoing(page: number = 1) {
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

export async function fetchWajikAnimeDetail(animeId: string) {
  try {
    const tmdbId = await resolveTmdbAnimeId(animeId);
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB status ${res.status}`);
    const d = await res.json();

    const title = d.name || d.original_name || animeId.replace(/-(sub|dub)-indo.*/gi, '').replace(/-/g, ' ').toUpperCase();
    
    // Calculate total episode count from all regular seasons
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
    console.error(`Anime detail error for ${animeId}:`, e);
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

export async function fetchTMDBAnimeSlugDetail(animeId: string) {
  return await fetchWajikAnimeDetail(animeId);
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
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

    // Calculate exact mapped Season and Episode numbers
    const { season, episode } = await getSeasonAndEpisode(tmdbId, epNum);

    // Stream URL routed through /api/proxy/stream with base tag injection to fix blank iframe & ISP blocks
    const multiEmbedTarget = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
    const defaultStreamUrl = `/api/proxy/stream?url=${encodeURIComponent(multiEmbedTarget)}`;

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
                title: 'HD Sub Indo (Audio Asli Jepang 🇯🇵)',
                serverList: [
                  { title: 'Server 1 (MultiEmbed - Audio Jepang 🇯🇵)', serverId: `multiembed-${tmdbId}-${season}-${episode}` },
                  { title: 'Server 2 (2Embed - Audio Jepang 🇯🇵)', serverId: `2embed-${tmdbId}-${season}-${episode}` },
                  { title: 'Server 3 (VidSrc Ultra HD)', serverId: `vidsrc-${tmdbId}-${season}-${episode}` },
                  { title: 'Server 4 (AutoEmbed HD)', serverId: `autoembed-${tmdbId}-${season}-${episode}` },
                  { title: 'Server 5 (VidSrc.me HD)', serverId: `vidsrcme-${tmdbId}-${season}-${episode}` },
                ]
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
    if (serverId.startsWith('multiembed-')) {
      const parts = serverId.replace('multiembed-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      const target = `https://multiembed.mov/?video_id=${tId}&tmdb=1&s=${sNum}&e=${eNum}`;
      return { success: true, data: { details: { url: `/api/proxy/stream?url=${encodeURIComponent(target)}` } } };
    }
    if (serverId.startsWith('2embed-')) {
      const parts = serverId.replace('2embed-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      const target = `https://www.2embed.cc/embedtv/${tId}&s=${sNum}&e=${eNum}`;
      return { success: true, data: { details: { url: `/api/proxy/stream?url=${encodeURIComponent(target)}` } } };
    }
    if (serverId.startsWith('autoembed-')) {
      const parts = serverId.replace('autoembed-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://autoembed.co/tv/tmdb/${tId}-${sNum}-${eNum}` } } };
    }
    if (serverId.startsWith('vidsrcme-')) {
      const parts = serverId.replace('vidsrcme-', '').split('-');
      const tId = parts[0] || '131041';
      const sNum = parts[1] || '1';
      const eNum = parts[2] || '1';
      return { success: true, data: { details: { url: `https://vidsrc.me/embed/tv?tmdb=${tId}&season=${sNum}&episode=${eNum}` } } };
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
