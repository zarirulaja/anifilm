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

  return {
    id: String(item?.animeId || item?.id || ''),
    title: item?.title || item?.name || 'Untitled Anime',
    poster: posterUrl,
    episodes: item?.episodes ? String(item.episodes) : undefined,
    score: item?.score ? String(item.score).replace('Rating :', '').trim() : item?.vote_average ? item.vote_average.toFixed(1) : undefined,
    releaseDay: item?.releaseDay || undefined,
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
    : (raw?.data?.ongoing?.animeList || []);

  const completedRaw = Array.isArray(raw?.data?.completed)
    ? raw.data.completed
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
  const episodeList = rawEpisodeList.map((ep: any) => ({
    title: ep?.title ? (String(ep.title).toLowerCase().startsWith('episode') ? ep.title : `Episode ${ep.title}`) : 'Episode',
    episodeId: ep?.episodeId || ep?.id || '',
  }));

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

export function normalizeEpisodeDetail(raw: any, epIdParam: string): EpisodeDetail {
  const d = raw?.data?.details || {};
  const serverContainer = d?.server || {};
  const qualityListRaw = serverContainer?.qualityList || [];

  const qualities: QualityGroup[] = qualityListRaw.map((qGroup: any) => {
    const rawQualityTitle = qGroup?.title || '';
    const cleanQuality = rawQualityTitle.replace('Mirror', '').trim();
    const servers = (qGroup?.serverList || []).map((srv: any) => ({
      title: srv?.title || 'Default Server',
      serverId: srv?.serverId || '',
    }));
    return {
      quality: cleanQuality,
      servers,
    };
  });

  return {
    id: epIdParam,
    title: d?.title || `Episode ${epIdParam}`,
    animeId: d?.animeId || '',
    releaseTime: d?.releaseTime || undefined,
    defaultStreamingUrl: d?.defaultStreamingUrl || '',
    hasPrevEpisode: Boolean(d?.hasPrevEpisode),
    prevEpisodeId: d?.prevEpisode?.episodeId || null,
    hasNextEpisode: Boolean(d?.hasNextEpisode),
    nextEpisodeId: d?.nextEpisode?.episodeId || null,
    qualities,
  };
}

export function normalizeServerStream(raw: any, serverId: string): StreamSource {
  const streamUrl = raw?.data?.details?.url || raw?.data?.url || '';
  return {
    url: streamUrl,
    isIframe: true,
    serverId,
  };
}
