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
  return {
    id: item?.animeId || item?.id || '',
    title: item?.title || 'Untitled Anime',
    poster: item?.poster || '/placeholder.png',
    episodes: item?.episodes ? String(item.episodes) : undefined,
    score: item?.score ? String(item.score).replace('Rating :', '').trim() : undefined,
    releaseDay: item?.releaseDay || undefined,
    lastReleaseDate: item?.lastReleaseDate || undefined,
    status: item?.status ? String(item.status).replace('Status :', '').trim() : undefined,
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
  const ongoingRaw = raw?.data?.ongoing?.animeList || [];
  const completedRaw = raw?.data?.completed?.animeList || [];

  return {
    ongoing: ongoingRaw.map(normalizeAnimeSummary),
    completed: completedRaw.map(normalizeAnimeSummary),
  };
}

export function normalizePaginatedList(raw: any): PaginatedAnimeResult {
  const list = raw?.data?.animeList || [];
  return {
    animeList: list.map(normalizeAnimeSummary),
    pagination: normalizePagination(raw?.pagination),
  };
}

export function normalizeAnimeDetail(raw: any, idParam: string): AnimeDetail {
  const d = raw?.data?.details || {};
  const synopsisParagraphs = d?.synopsis?.paragraphList || (Array.isArray(d?.synopsis) ? d.synopsis : []);
  const rawGenreList = d?.genreList || raw?.data?.genreList || [];
  const genreList = rawGenreList.map((g: any) => ({
    title: g?.title || '',
    genreId: g?.genreId || '',
  }));

  const rawEpisodeList = d?.episodeList || raw?.data?.episodeList || [];
  const episodeList = rawEpisodeList.map((ep: any) => ({
    title: ep?.title ? (ep.title.toLowerCase().startsWith('episode') ? ep.title : `Episode ${ep.title}`) : 'Episode',
    episodeId: ep?.episodeId || '',
  }));

  const rawBatch = d?.batch || raw?.data?.batch;

  return {
    id: idParam,
    title: d?.title || 'Unknown Anime',
    japanese: d?.japanese || undefined,
    score: d?.score || undefined,
    producers: d?.producers || undefined,
    type: d?.type || undefined,
    status: d?.status || undefined,
    episodes: d?.episodes || undefined,
    duration: d?.duration || undefined,
    aired: d?.aired || undefined,
    studios: d?.studios || undefined,
    poster: d?.poster || '/placeholder.png',
    synopsis: Array.isArray(synopsisParagraphs) ? synopsisParagraphs : [],
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
    isIframe: true, // Wajik Otakudesu server URLs are iframe embeds
    serverId,
  };
}
