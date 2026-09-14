import {
  AnimeSummary,
  AnimeDetail,
  EpisodeDetail,
  PaginatedAnimeResult,
  QualityGroup,
  Pagination,
  StreamSource,
  ServerOption,
} from './types';

export function normalizeAnimeSummary(item: any): AnimeSummary {
  let posterUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
  if (typeof item?.poster === 'string' && item.poster && !item.poster.includes('undefined')) {
    posterUrl = item.poster;
  } else if (typeof item?.poster_path === 'string' && item.poster_path && item.poster_path !== 'undefined') {
    posterUrl = item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  }

  // Handle Oploverz seriesName format: "One Piece\t\t\t\tOne Piece Episode..."
  let seriesTitle = '';
  if (typeof item?.seriesName === 'string' && item.seriesName.trim()) {
    seriesTitle = item.seriesName.split('\t')[0].trim();
  }

  // Extract display title
  let displayTitle = seriesTitle || item?.title || item?.name || 'Untitled Anime';
  displayTitle = displayTitle
    .replace(/\s+Episode\s+\d+.*$/i, '')
    .replace(/\s+Subtitle\s+Indonesia.*$/i, '')
    .replace(/\s+Sub\s+Indo.*$/i, '')
    .trim();

  let rawId = item?.animeId || item?.slug || '';

  // If no explicit animeId/slug, derive slug from seriesTitle if available
  if (!rawId && seriesTitle) {
    rawId = seriesTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Extract from href or otakudesuUrl if rawId is still empty or looks like an episode slug
  if (!rawId || rawId.includes('-episode-') || rawId.includes('-ep-')) {
    const urlStr = item?.href || item?.otakudesuUrl || '';
    if (typeof urlStr === 'string' && urlStr.trim()) {
      const parts = urlStr.replace(/\/$/, '').split('/');
      const lastPart = parts[parts.length - 1] || '';
      if (lastPart) {
        rawId = lastPart;
      }
    }
  }

  // Clean episode indicators from rawId if it extracted an episode URL
  if (rawId && (rawId.includes('-episode-') || rawId.includes('-ep-') || rawId.includes('-op-'))) {
    rawId = rawId
      .replace(/-subtitle-indonesia.*/gi, '')
      .replace(/-(sub|dub)-indo.*/gi, '')
      .replace(/-(ep|episode|op)[-_]?\d+.*/gi, '')
      .replace(/-episode.*/gi, '')
      .trim();
  }

  if (!rawId && displayTitle) {
    rawId = displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (!rawId) {
    rawId = 'anime-item';
  }

  return {
    id: String(rawId),
    title: displayTitle || 'Untitled Anime',
    poster: posterUrl,
    episodes: item?.episodes ? String(item.episodes) : item?.episode ? String(item.episode) : item?.latestEpisode ? `Ep ${item.latestEpisode}` : undefined,
    score: item?.score ? String(item.score).replace('Rating :', '').trim() : item?.vote_average ? item.vote_average.toFixed(1) : undefined,
    releaseDay: item?.releaseDay || item?.releaseDate || item?.releaseTime || undefined,
    lastReleaseDate: item?.lastReleaseDate || undefined,
    status: item?.status ? String(item.status).replace('Status :', '').trim() : 'Ongoing',
  };
}

export function normalizePagination(rawPagination: any): Pagination | undefined {
  if (!rawPagination) return undefined;
  return {
    currentPage: Number(rawPagination.currentPage || 1),
    hasPrevPage: Boolean(rawPagination.hasPrevPage),
    hasNextPage: Boolean(rawPagination.hasNextPage),
    prevPage: rawPagination.prevPage ? Number(rawPagination.prevPage) : null,
    nextPage: rawPagination.nextPage ? Number(rawPagination.nextPage) : null,
    totalPages: Number(rawPagination.totalPages || 1),
  };
}

export function normalizeHomeResponse(raw: any): {
  ongoing: AnimeSummary[];
  completed: AnimeSummary[];
} {
  let ongoingRaw: any[] = [];
  let completedRaw: any[] = [];

  if (Array.isArray(raw?.data?.ongoing?.animeList) && raw.data.ongoing.animeList.length > 0) {
    ongoingRaw = raw.data.ongoing.animeList;
  } else if (Array.isArray(raw?.data?.latestRelease?.animeList) && raw.data.latestRelease.animeList.length > 0) {
    ongoingRaw = raw.data.latestRelease.animeList;
  } else if (Array.isArray(raw?.data?.ongoing)) {
    ongoingRaw = raw.data.ongoing;
  }

  if (Array.isArray(raw?.data?.completed?.animeList) && raw.data.completed.animeList.length > 0) {
    completedRaw = raw.data.completed.animeList;
  } else if (Array.isArray(raw?.data?.popularToday?.animeList) && raw.data.popularToday.animeList.length > 0) {
    completedRaw = raw.data.popularToday.animeList;
  } else if (Array.isArray(raw?.data?.completed)) {
    completedRaw = raw.data.completed;
  }

  return {
    ongoing: ongoingRaw.map(normalizeAnimeSummary),
    completed: completedRaw.map(normalizeAnimeSummary),
  };
}


export function normalizePaginatedList(raw: any): PaginatedAnimeResult {
  const list = Array.isArray(raw?.data?.animeList)
    ? raw.data.animeList
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return {
    animeList: list.map(normalizeAnimeSummary),
    pagination: normalizePagination(raw?.pagination),
  };
}

export function normalizeAnimeDetail(raw: any, idParam: string): AnimeDetail {
  const d = raw?.data?.details || raw?.data || {};
  const synopsisParagraphs = d?.synopsis?.paragraphList || (Array.isArray(d?.synopsis) ? d.synopsis : [d?.synopsis || d?.overview || 'Deskripsi anime.']);
  const rawGenreList = d?.genreList || raw?.data?.genreList || d?.genres || [];
  const genreList = rawGenreList.map((g: any) => ({
    title: typeof g === 'string' ? g : g?.title || g?.name || '',
    genreId: typeof g === 'string' ? g : g?.genreId || g?.id || '',
  }));

  const rawEpisodeList = d?.episodeList || raw?.data?.episodeList || d?.episodes || [];
  const episodeList = rawEpisodeList.map((ep: any, index: number) => {
    let epId = ep?.episodeId || ep?.slug || ep?.id || '';
    if (!epId && typeof ep?.href === 'string' && ep.href.trim()) {
      const parts = ep.href.replace(/\/$/, '').split('/');
      epId = parts[parts.length - 1] || '';
    }
    if (!epId && typeof ep?.otakudesuUrl === 'string' && ep.otakudesuUrl.trim()) {
      const parts = ep.otakudesuUrl.replace(/\/$/, '').split('/');
      epId = parts[parts.length - 1] || '';
    }
    if (!epId) {
      const epNum = ep?.episode || index + 1;
      epId = `${idParam}-ep-${epNum}`;
    }

    const title = ep?.title
      ? (String(ep.title).toLowerCase().startsWith('episode') ? ep.title : `Episode ${ep.title}`)
      : `Episode ${index + 1}`;

    return {
      title,
      episodeId: String(epId),
    };
  });

  const rawBatch = d?.batch || raw?.data?.batch;

  return {
    id: idParam,
    title: d?.title || d?.name || 'Unknown Anime',
    japanese: d?.japanese || d?.japaneseTitle || undefined,
    score: d?.score || (d?.vote_average ? d.vote_average.toFixed(1) : undefined),
    producers: d?.producers || undefined,
    type: d?.type || 'TV',
    status: d?.status || 'Ongoing',
    episodes: d?.episodes ? String(d.episodes) : undefined,
    duration: d?.duration || undefined,
    aired: d?.aired || undefined,
    studios: d?.studios || undefined,
    poster: d?.poster || (d?.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : '/placeholder.png'),
    synopsis: Array.isArray(synopsisParagraphs) ? synopsisParagraphs : [String(synopsisParagraphs)],
    genres: genreList,
    episodeList,
    batch: rawBatch
      ? {
          title: rawBatch.title || '',
          batchId: rawBatch.batchId || '',
        }
      : undefined,
  };
}

const POPULAR_TMDB_MAP: Record<string, string> = {
  'one-piece': '37854',
  'blue-lock': '131041',
  'jujutsu-kaisen': '95479',
  'naruto': '31910',
  'attack-on-titan': '1429',
  'demon-slayer': '85937',
  'solo-leveling': '127532',
  'chainsaw-man': '114410',
  'frieren': '209867',
  'my-hero-academia': '65930',
  'bleach': '30984',
  'dragon-ball': '12971',
};

function getTmdbId(slug: string): string {
  const lower = slug.toLowerCase();
  for (const [key, val] of Object.entries(POPULAR_TMDB_MAP)) {
    if (lower.includes(key)) return val;
  }
  return '37854';
}

function convertToEmbedUrl(url: string): string {
  if (!url) return url;
  if (url.includes('filedon.co/view/') || url.includes('filedon.co/f/')) {
    return url.replace(/\/view\/|\/f\//, '/embed/');
  }
  if (url.includes('vikingfile.com/f/') || url.includes('vik1ngfile.site/f/')) {
    return url.replace(/\/f\//, '/e/');
  }
  return url;
}

export function normalizeEpisodeDetail(raw: any, epIdParam: string): EpisodeDetail {
  const d = raw?.data?.details || raw?.data || {};
  const rawDefaultStream = d?.defaultStreamingUrl || d?.streamingUrl || d?.url || '';
  const defaultStream = convertToEmbedUrl(rawDefaultStream);

  const serverContainer = d?.server || {};
  const qualityListRaw = serverContainer?.qualityList || [];

  const qualityMap = new Map<string, { quality: string; servers: ServerOption[] }>();

  const formatQualityLabel = (rawQ: string): string => {
    let q = (rawQ || '').replace(/Mirror/i, '').trim();
    if (q === '1080p') return '1080p Full HD';
    if (q === '720p') return '720p HD';
    if (q === '480p') return '480p SD';
    if (q === '360p') return '360p Low Data';
    return q || '720p HD';
  };

  // 1. Process serverContainer.qualityList (Otakudesu style)
  if (Array.isArray(qualityListRaw) && qualityListRaw.length > 0) {
    qualityListRaw.forEach((qGroup: any) => {
      const qLabel = formatQualityLabel(qGroup?.title || '');
      const existing = qualityMap.get(qLabel) || { quality: qLabel, servers: [] };

      (qGroup?.serverList || []).forEach((srv: any, idx: number) => {
        const srvTitle = srv?.title || `Server ${idx + 1}`;
        const rawSrvId = srv?.serverId || srv?.url || defaultStream;
        const srvId = convertToEmbedUrl(rawSrvId);
        if (srvId && !existing.servers.some((s) => s.serverId === srvId)) {
          existing.servers.push({
            title: `Server ${existing.servers.length + 1} (${srvTitle})`,
            serverId: srvId,
          });
        }
      });

      if (existing.servers.length > 0) {
        qualityMap.set(qLabel, existing);
      }
    });
  }

  // 2. Process d.download (Oploverz style)
  if (Array.isArray(d?.download) && d.download.length > 0) {
    d.download.forEach((downloadGroup: any) => {
      const formatTitle = (downloadGroup?.title || '').toUpperCase();
      if (Array.isArray(downloadGroup?.qualityList)) {
        downloadGroup.qualityList.forEach((qGroup: any) => {
          if (!Array.isArray(qGroup?.urlList) || qGroup.urlList.length === 0) return;

          const qLabel = formatQualityLabel(qGroup?.title || '');
          const existing = qualityMap.get(qLabel) || { quality: qLabel, servers: [] };

          qGroup.urlList.forEach((srv: any) => {
            const srvTitle = srv?.title || 'Mirror';
            const rawSrvId = srv?.url || defaultStream;
            const srvId = convertToEmbedUrl(rawSrvId);
            if (srvId && !existing.servers.some((s) => s.serverId === srvId)) {
              existing.servers.push({
                title: `${srvTitle} (${formatTitle})`,
                serverId: srvId,
              });
            }
          });

          if (existing.servers.length > 0) {
            qualityMap.set(qLabel, existing);
          }
        });
      }
    });
  }

  // Ensure defaultStream is included as Primary Stream for each quality group
  if (defaultStream) {
    const defaultQualities = ['1080p Full HD', '720p HD', '480p SD', '360p Low Data'];
    defaultQualities.forEach((qLabel) => {
      if (!qualityMap.has(qLabel)) {
        qualityMap.set(qLabel, {
          quality: qLabel,
          servers: [{ title: 'Server Utama (Akira Player)', serverId: defaultStream }],
        });
      } else {
        const group = qualityMap.get(qLabel)!;
        if (!group.servers.some((s) => s.serverId === defaultStream)) {
          group.servers.unshift({ title: 'Server Utama (Akira Player)', serverId: defaultStream });
        }
      }
    });
  }

  // Sort qualities in descending order: 1080p, 720p, 480p, 360p
  const qualityOrder = ['1080p Full HD', '720p HD', '480p SD', '360p Low Data'];
  const qualities: QualityGroup[] = Array.from(qualityMap.values()).sort((a, b) => {
    const idxA = qualityOrder.indexOf(a.quality);
    const idxB = qualityOrder.indexOf(b.quality);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.quality.localeCompare(b.quality);
  });


  return {
    id: epIdParam,
    title: d?.title || `Episode ${epIdParam}`,
    animeId: d?.animeId || d?.seriesSlug || '',
    releaseTime: d?.releaseTime || d?.releasedOn || undefined,
    defaultStreamingUrl: defaultStream || qualities[0]?.servers[0]?.serverId || '',
    hasPrevEpisode: Boolean(d?.hasPrevEpisode || d?.prevEpisode),
    prevEpisodeId: d?.prevEpisode?.episodeId || d?.prevEpisode?.slug || null,
    hasNextEpisode: Boolean(d?.hasNextEpisode || d?.nextEpisode),
    nextEpisodeId: d?.nextEpisode?.episodeId || d?.nextEpisode?.slug || null,
    qualities,
  };
}

export function normalizeServerStream(raw: any, serverId: string): StreamSource {
  const streamUrl = raw?.data?.details?.url || raw?.data?.url || serverId || '';
  return {
    url: streamUrl,
    isIframe: true,
    serverId,
  };
}
