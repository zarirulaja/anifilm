const OTAKUDESU_BASE = 'https://otakudesu.cloud';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
};

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

  if (/b[le|lu|u]+ck/i.test(cleanId) || /blue.*lock/i.test(cleanId)) {
    return '131041';
  }
  if (/jujutsu.*kaisen/i.test(cleanId)) {
    return '95479';
  }
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

// --- Native Otakudesu Direct Scraper ---

export async function fetchWajikHome() {
  try {
    const res = await fetch(`${OTAKUDESU_BASE}/`, { headers: FETCH_HEADERS, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Otakudesu home status ${res.status}`);
    const html = await res.text();

    const ongoingList: any[] = [];
    const completedList: any[] = [];

    const liMatches = html.match(/<li[\s\S]*?<\/li>/gi) || [];
    for (const li of liMatches) {
      const linkMatch = li.match(/href="https:\/\/otakudesu\.[a-z]+\/anime\/([^\/"]+)\/?"[^>]*>([^<]+)/i);
      const imgMatch = li.match(/src="([^"]+\.(jpg|png|jpeg|webp))"/i);
      const epMatch = li.match(/<div class="epz"[^>]*>([^<]+)/i);
      const dayMatch = li.match(/<div class="epztii"[^>]*>([^<]+)/i);

      if (linkMatch) {
        const slug = linkMatch[1];
        const rawTitle = linkMatch[2].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/Subtitle Indonesia.*/i, '').trim();
        const poster = imgMatch ? imgMatch[1] : '';
        const epText = epMatch ? epMatch[1].trim() : 'Sub Indo';
        const dayText = dayMatch ? dayMatch[1].trim() : 'Update';

        if (li.includes('newzti') || epMatch) {
          if (!ongoingList.some(a => a.animeId === slug)) {
            ongoingList.push({
              id: slug,
              animeId: slug,
              title: rawTitle,
              poster,
              episodes: epText,
              releaseDay: dayText,
              status: 'Ongoing',
            });
          }
        } else {
          if (!completedList.some(a => a.animeId === slug)) {
            completedList.push({
              id: slug,
              animeId: slug,
              title: rawTitle,
              poster,
              episodes: epText,
              status: 'Completed',
            });
          }
        }
      }
    }

    if (ongoingList.length > 0) {
      return {
        success: true,
        data: {
          ongoing: ongoingList.slice(0, 15),
          completed: completedList.slice(0, 15),
        }
      };
    }

    throw new Error('Empty ongoing list');
  } catch (e) {
    console.error('Otakudesu home scraper fallback:', e);
    return await fetchTMDBAnimeFallback(1);
  }
}

export async function fetchWajikOngoing(page: number = 1) {
  try {
    const url = page > 1 ? `${OTAKUDESU_BASE}/ongoing-anime/page/${page}/` : `${OTAKUDESU_BASE}/ongoing-anime/`;
    const res = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();

    const animeList: any[] = [];
    const liMatches = html.match(/<li[\s\S]*?<\/li>/gi) || [];
    for (const li of liMatches) {
      const linkMatch = li.match(/href="https:\/\/otakudesu\.[a-z]+\/anime\/([^\/"]+)\/?"[^>]*>([^<]+)/i);
      const imgMatch = li.match(/src="([^"]+\.(jpg|png|jpeg|webp))"/i);
      const epMatch = li.match(/<div class="epz"[^>]*>([^<]+)/i);

      if (linkMatch) {
        const slug = linkMatch[1];
        const rawTitle = linkMatch[2].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/Subtitle Indonesia.*/i, '').trim();
        const poster = imgMatch ? imgMatch[1] : '';
        const epText = epMatch ? epMatch[1].trim() : 'Sub Indo';

        if (!animeList.some(a => a.animeId === slug)) {
          animeList.push({
            id: slug,
            animeId: slug,
            title: rawTitle,
            poster,
            episodes: epText,
            status: 'Ongoing',
          });
        }
      }
    }

    if (animeList.length > 0) {
      return {
        success: true,
        data: { animeList },
        pagination: { currentPage: page, hasNextPage: page < 10, totalPages: 10 }
      };
    }
    throw new Error('Empty ongoing list');
  } catch {
    return await fetchTMDBAnimeFallback(page);
  }
}

export async function fetchWajikCompleted(page: number = 1) {
  try {
    const url = page > 1 ? `${OTAKUDESU_BASE}/complete-anime/page/${page}/` : `${OTAKUDESU_BASE}/complete-anime/`;
    const res = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();

    const animeList: any[] = [];
    const liMatches = html.match(/<li[\s\S]*?<\/li>/gi) || [];
    for (const li of liMatches) {
      const linkMatch = li.match(/href="https:\/\/otakudesu\.[a-z]+\/anime\/([^\/"]+)\/?"[^>]*>([^<]+)/i);
      const imgMatch = li.match(/src="([^"]+\.(jpg|png|jpeg|webp))"/i);
      const epMatch = li.match(/<div class="epz"[^>]*>([^<]+)/i);

      if (linkMatch) {
        const slug = linkMatch[1];
        const rawTitle = linkMatch[2].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/Subtitle Indonesia.*/i, '').trim();
        const poster = imgMatch ? imgMatch[1] : '';
        const epText = epMatch ? epMatch[1].trim() : 'Completed';

        if (!animeList.some(a => a.animeId === slug)) {
          animeList.push({
            id: slug,
            animeId: slug,
            title: rawTitle,
            poster,
            episodes: epText,
            status: 'Completed',
          });
        }
      }
    }

    if (animeList.length > 0) {
      return {
        success: true,
        data: { animeList },
        pagination: { currentPage: page, hasNextPage: page < 10, totalPages: 10 }
      };
    }
    throw new Error('Empty completed list');
  } catch {
    return await fetchTMDBAnimeFallback(page);
  }
}

export async function fetchWajikSearch(query: string) {
  try {
    const url = `${OTAKUDESU_BASE}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`Search status ${res.status}`);
    const html = await res.text();

    const animeList: any[] = [];
    const liMatches = html.match(/<li[\s\S]*?<\/li>/gi) || [];
    for (const li of liMatches) {
      const linkMatch = li.match(/href="https:\/\/otakudesu\.[a-z]+\/anime\/([^\/"]+)\/?"[^>]*>([^<]+)/i);
      const imgMatch = li.match(/src="([^"]+\.(jpg|png|jpeg|webp))"/i);
      if (linkMatch) {
        const slug = linkMatch[1];
        const rawTitle = linkMatch[2].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/Subtitle Indonesia.*/i, '').trim();
        const poster = imgMatch ? imgMatch[1] : '';
        if (!animeList.some(a => a.animeId === slug)) {
          animeList.push({
            id: slug,
            animeId: slug,
            title: rawTitle,
            poster,
            status: 'Anime Sub Indo',
          });
        }
      }
    }

    if (animeList.length > 0) {
      return { success: true, data: { animeList } };
    }
    throw new Error('Empty search');
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
    const cleanId = animeId.replace(/^\//, '').replace(/\/$/, '');
    const url = `${OTAKUDESU_BASE}/anime/${cleanId}/`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`Anime detail status ${res.status}`);
    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/<div class="j2xtda">[^<]*<h1>([^<]+)/i);
    const title = titleMatch ? titleMatch[1].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/Subtitle Indonesia.*/i, '').trim() : animeId;

    const posterMatch = html.match(/<img[^>]+src="(https:\/\/[^"]+\.(jpg|png|jpeg|webp))"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    const synopsisMatch = html.match(/<div class="sinopc">([\s\S]*?)<\/div>/i);
    const synopsisText = synopsisMatch ? synopsisMatch[1].replace(/<[^>]+>/g, '').trim() : 'Deskripsi tayangan anime.';

    const epMatches: any[] = [];
    const epRegex = /href="https:\/\/otakudesu\.[a-z]+\/episode\/([^\/"]+)\/?"[^>]*>([^<]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = epRegex.exec(html)) !== null) {
      if (!epMatches.some(e => e.episodeId === m![1])) {
        epMatches.push({
          episodeId: m[1],
          title: m[2].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').trim(),
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
    throw new Error('No episodes scraped');
  } catch (e) {
    console.error(`Otakudesu detail scrape error for ${animeId}, fallback to TMDB:`, e);
    return await fetchTMDBAnimeSlugDetail(animeId);
  }
}

export async function fetchWajikEpisodeDetail(episodeId: string) {
  try {
    const cleanId = episodeId.replace(/^\//, '').replace(/\/$/, '');
    const url = `${OTAKUDESU_BASE}/episode/${cleanId}/`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`Episode status ${res.status}`);
    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/&#8211;/g, '-').replace(/&amp;/g, '&').trim() : episodeId;

    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
    const streamUrl = iframeMatch ? iframeMatch[1] : '';

    // Extract prev & next episode links
    const prevMatch = html.match(/href="https:\/\/otakudesu\.[a-z]+\/episode\/([^\/"]+)\/?"[^>]*rel="prev"/i) ||
                      html.match(/<a[^>]+href="https:\/\/otakudesu\.[a-z]+\/episode\/([^\/"]+)\/?"[^>]*>[\s\S]*?Prev/i);
    const nextMatch = html.match(/href="https:\/\/otakudesu\.[a-z]+\/episode\/([^\/"]+)\/?"[^>]*rel="next"/i) ||
                      html.match(/<a[^>]+href="https:\/\/otakudesu\.[a-z]+\/episode\/([^\/"]+)\/?"[^>]*>[\s\S]*?Next/i);

    const prevEpId = prevMatch ? prevMatch[1] : null;
    const nextEpId = nextMatch ? nextMatch[1] : null;

    if (streamUrl) {
      return {
        success: true,
        data: {
          details: {
            id: cleanId,
            title,
            animeId: cleanId.replace(/-episode-.*/, ''),
            defaultStreamingUrl: streamUrl,
            hasPrevEpisode: Boolean(prevEpId),
            prevEpisode: prevEpId ? { episodeId: prevEpId } : null,
            hasNextEpisode: Boolean(nextEpId),
            nextEpisode: nextEpId ? { episodeId: nextEpId } : null,
            server: {
              qualityList: [
                {
                  title: 'HD 720p Sub Indo (Otakudesu Direct)',
                  serverList: [
                    { title: 'Server Otakudesu (Sub Indo Hardsub)', serverId: `otakudesu-${cleanId}` },
                  ]
                }
              ]
            }
          }
        }
      };
    }
    throw new Error('No stream iframe found');
  } catch (e) {
    console.error(`Episode scrape error for ${episodeId}, fallback to TMDB:`, e);
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
    if (serverId.startsWith('otakudesu-')) {
      const epId = serverId.replace('otakudesu-', '');
      const detail = await fetchWajikEpisodeDetail(epId);
      return { success: true, data: { details: { url: detail.data?.details?.defaultStreamingUrl } } };
    }
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
    const parts = serverId.replace('autoembed-', '').split('-');
    const tId = parts[0] || '131041';
    const eNum = parts[2] || '1';
    return { success: true, data: { details: { url: `https://autoembed.co/tv/tmdb/${tId}-1-${eNum}` } } };
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
  return await fetchTMDBAnimeFallback(page);
}
