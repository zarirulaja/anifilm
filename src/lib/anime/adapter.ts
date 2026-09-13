import {
  AnimeSummary,
  AnimeDetail,
  EpisodeDetail,
  PaginatedAnimeResult,
  QualityGroup,
  Pagination,
  StreamSource,
} from './types';

export function normalizeAnimeSummary(item: any): AnimeSummary {
  let posterUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
  if (typeof item?.poster === 'string' && item.poster && !item.poster.includes('undefined')) {
    posterUrl = item.poster;
  } else if (typeof item?.poster_path === 'string' && item.poster_path && item.poster_path !== 'undefined') {
    posterUrl = item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  }

  let rawId = item?.animeId || item?.slug || item?.id || '';
  if (!rawId && typeof item?.href === 'string' && item.href.trim()) {
    const parts = item.href.replace(/\/$/, '').split('/');
    rawId = parts[parts.length - 1] || '';
  }
  if (!rawId && typeof item?.otakudesuUrl === 'string' && item.otakudesuUrl.trim()) {
    const parts = item.otakudesuUrl.replace(/\/$/, '').split('/');
    rawId = parts[parts.length - 1] || '';
  }
  if (!rawId && typeof item?.seriesName === 'string' && item.seriesName.trim()) {
    rawId = item.seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (!rawId && typeof item?.title === 'string' && item.title.trim()) {
    rawId = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (!rawId) {
    rawId = 'anime-item';
  }

  return {
    id: String(rawId),
    title: item?.title || item?.seriesName || item?.name || 'Untitled Anime',
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
  const ongoingRaw = Array.isArray(raw?.data?.ongoing)
    ? raw.data.ongoing
    : Array.isArray(raw?.data?.latestRelease?.animeList)
    ? raw.data.latestRelease.animeList
    : (raw?.data?.ongoing?.animeList || []);

  const completedRaw = Array.isArray(raw?.data?.completed)
    ? raw.data.completed
    : Array.isArray(raw?.data?.popularToday?.animeList)
    ? raw.data.popularToday.animeList
    : (raw?.data?.completed?.animeList || []);

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

export function normalizeEpisodeDetail(raw: any, epIdParam: string): EpisodeDetail {
  const d = raw?.data?.details || raw?.data || {};
  const defaultStream = d?.defaultStreamingUrl || d?.streamingUrl || d?.url || '';

  const serverContainer = d?.server || {};
  const qualityListRaw = serverContainer?.qualityList || [];

  let qualities: QualityGroup[] = qualityListRaw.map((qGroup: any) => {
    const rawQualityTitle = qGroup?.title || '';
    const cleanQuality = rawQualityTitle.replace('Mirror', '').trim();
    const servers = (qGroup?.serverList || []).map((srv: any) => ({
      title: srv?.title || 'Default Server',
      serverId: srv?.serverId || srv?.url || defaultStream,
    }));
    return {
      quality: cleanQuality,
      servers,
    };
  });

  if (qualities.length === 0 || !qualities.some((q) => q.servers && q.servers.length > 0)) {
    const tmdbId = getTmdbId(epIdParam);
    const epMatch = epIdParam.match(/(?:ep|episode|op)[-_]?(\d+)/i);
    const epNum = epMatch ? epMatch[1] : '1';

    const serverList = [
      {
        title: 'Server 1 (Wajik API Sub Indo 🇯🇵)',
        serverId: defaultStream || `https://vidsrc.me/embed/anime?tmdb=${tmdbId}&season=1&episode=${epNum}`,
      },
      {
        title: 'Server 2 (VidSrc Anime - Audio Asli 🇯🇵)',
        serverId: `https://vidsrc.me/embed/anime?tmdb=${tmdbId}&season=1&episode=${epNum}`,
      },
      {
        title: 'Server 3 (VidSrc.pm Anime - Audio Asli 🇯🇵)',
        serverId: `https://vidsrc.pm/embed/anime/${tmdbId}/1/${epNum}`,
      },
      {
        title: 'Server 4 (2Embed Skin HD)',
        serverId: `https://2embed.skin/embedtv/${tmdbId}&s=1&e=${epNum}`,
      },
      {
        title: 'Server 5 (AutoEmbed HD)',
        serverId: `https://autoembed.co/tv/tmdb/${tmdbId}-1-${epNum}`,
      },
    ];

    qualities = [
      {
        quality: 'HD 1080p / 720p (Multi Server Sub Indo & Original)',
        servers: serverList,
      },
    ];
  } else {
    const firstGroup = qualities[0];
    if (firstGroup && firstGroup.servers.length > 0 && defaultStream) {
      if (!firstGroup.servers.some((s) => s.title.includes('Wajik') || s.title.includes('Server 1'))) {
        firstGroup.servers.unshift({
          title: 'Server 1 (Wajik API Sub Indo 🇯🇵)',
          serverId: defaultStream,
        });
      }
    }
  }

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
