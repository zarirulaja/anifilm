import { MovieSummary, MovieDetail } from './types';
import { TMDB_IMAGE_BASE } from './tmdb';

export function normalizeMovieSummary(item: any): MovieSummary {
  const id = String(item?.id || item?.movieId || item?.seriesId || item?._id || '');
  const isSeries = item?.media_type === 'tv' || item?.type === 'series' || !!item?.first_air_date || !!item?.name;

  let poster = item?.poster_path
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : item?.posterImg || item?.poster || item?.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80';

  const rating = item?.vote_average
    ? item.vote_average.toFixed(1)
    : item?.rating ? String(item.rating) : undefined;

  const releaseDate = item?.release_date || item?.first_air_date || item?.releaseDate || item?.year || undefined;

  return {
    id,
    title: item?.title || item?.name || 'Untitled',
    poster,
    rating,
    duration: item?.runtime ? `${item.runtime}m` : item?.duration || undefined,
    quality: 'HD Sub Indo',
    releaseDate,
    type: isSeries ? 'series' : 'movie',
  };
}

export function normalizeMovieList(raw: any): MovieSummary[] {
  const list = Array.isArray(raw)
    ? raw
    : raw?.results || raw?.data || raw?.movies || [];
  return list.map(normalizeMovieSummary);
}

export function normalizeMovieDetail(raw: any, idParam: string): MovieDetail {
  const d = raw?.data || raw || {};
  const isSeries = d?.media_type === 'tv' || !!d?.first_air_date || !!d?.name;

  const genres = Array.isArray(d?.genres)
    ? d.genres.map((g: any) => (typeof g === 'string' ? g : g?.name || ''))
    : [];

  const directors = Array.isArray(d?.credits?.crew)
    ? d.credits.crew.filter((c: any) => c.job === 'Director').map((dir: any) => dir?.name || '')
    : Array.isArray(d?.directors) ? d.directors : [];

  const casts = Array.isArray(d?.credits?.cast)
    ? d.credits.cast.slice(0, 8).map((c: any) => c?.name || '')
    : Array.isArray(d?.casts) ? d.casts : [];

  const poster = d?.poster_path
    ? `${TMDB_IMAGE_BASE}${d.poster_path}`
    : d?.posterImg || d?.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80';

  const rating = d?.vote_average ? d.vote_average.toFixed(1) : d?.rating ? String(d.rating) : '7.5';
  const duration = d?.runtime ? `${d.runtime} menit` : d?.episode_run_time?.[0] ? `${d.episode_run_time[0]} menit` : d?.duration || '120 menit';

  // Generate multi-server stream embed URLs with priority on Indonesian Subtitles
  const numId = idParam;
  const streamUrls = isSeries
    ? [
        { provider: 'Server MultiEmbed TV (Auto Sub Indo)', url: `https://multiembed.mov/?video_id=${numId}&tmdb=1&s=1&e=1` },
        { provider: 'Server VidSrc PM TV (Sub Indo HD)', url: `https://vidsrc.pm/embed/tv/${numId}/1/1?sub=id` },
        { provider: 'Server VidSrc IN TV (Sub Indo HD)', url: `https://vidsrc.in/embed/tv/${numId}/1/1?sub=id` },
        { provider: 'Server VidSrc TO TV (Fast HD)', url: `https://vidsrc.to/embed/tv/${numId}/1/1` },
        { provider: 'Server 2Embed TV', url: `https://www.2embed.cc/embedtv/${numId}&s=1&e=1` },
      ]
    : [
        { provider: 'Server MultiEmbed (Auto Sub Indo)', url: `https://multiembed.mov/?video_id=${numId}&tmdb=1` },
        { provider: 'Server VidSrc PM (Sub Indo HD)', url: `https://vidsrc.pm/embed/movie/${numId}?sub=id` },
        { provider: 'Server VidSrc IN (Sub Indo HD)', url: `https://vidsrc.in/embed/movie/${numId}?sub=id` },
        { provider: 'Server VidSrc TO (Fast HD)', url: `https://vidsrc.to/embed/movie/${numId}` },
        { provider: 'Server 2Embed HD', url: `https://www.2embed.cc/embed/${numId}` },
      ];

  // Also prioritize and include any extra custom streams from LK21 (hardsub)
  if (Array.isArray(d?.streamUrls)) {
    const lkStreams: any[] = [];
    d.streamUrls.forEach((s: any) => {
      if (s?.url && !streamUrls.some(existing => existing.url === s.url)) {
        lkStreams.push({ provider: s.provider ? `Server LK21 (${s.provider})` : 'Server LK21 Sub Indo', url: s.url });
      }
    });
    if (lkStreams.length > 0) {
      streamUrls.unshift(...lkStreams);
    }
  }

  return {
    id: idParam,
    title: d?.title || d?.name || 'Unknown Title',
    poster,
    synopsis: d?.overview || d?.synopsis || 'Deskripsi tidak tersedia.',
    rating,
    duration,
    quality: 'HD Sub Indo',
    releaseDate: d?.release_date || d?.first_air_date || d?.releaseDate || undefined,
    genres: genres.filter(Boolean),
    directors: directors.filter(Boolean),
    casts: casts.filter(Boolean),
    countries: Array.isArray(d?.production_countries)
      ? d.production_countries.map((c: any) => c.name)
      : Array.isArray(d?.countries) ? d.countries : ['International'],
    trailerUrl: d?.videos?.results?.[0]?.key ? `https://www.youtube.com/watch?v=${d.videos.results[0].key}` : undefined,
    streamUrls,
  };
}
