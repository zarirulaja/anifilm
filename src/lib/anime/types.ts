export interface AnimeSummary {
  id: string;
  title: string;
  poster: string;
  episodes?: string;
  score?: string;
  releaseDay?: string;
  lastReleaseDate?: string;
  status?: string;
}

export interface Pagination {
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
  totalPages: number;
}

export interface PaginatedAnimeResult {
  animeList: AnimeSummary[];
  pagination?: Pagination;
}

export interface GenreItem {
  title: string;
  genreId: string;
}

export interface BatchItem {
  title: string;
  batchId: string;
}

export interface EpisodeSummary {
  title: string;
  episodeId: string;
}

export interface AnimeDetail {
  id: string;
  title: string;
  japanese?: string;
  score?: string;
  producers?: string;
  type?: string;
  status?: string;
  episodes?: string;
  duration?: string;
  aired?: string;
  studios?: string;
  poster: string;
  banner?: string;
  trailerUrl?: string;
  synopsis: string[];
  genres: GenreItem[];
  episodeList: EpisodeSummary[];
  batch?: BatchItem;
}

export interface ServerOption {
  title: string;
  serverId: string;
}

export interface QualityGroup {
  quality: string;
  servers: ServerOption[];
}

export interface EpisodeDetail {
  id: string;
  title: string;
  animeId: string;
  releaseTime?: string;
  defaultStreamingUrl: string;
  hasPrevEpisode: boolean;
  prevEpisodeId: string | null;
  hasNextEpisode: boolean;
  nextEpisodeId: string | null;
  qualities: QualityGroup[];
}

export interface StreamSource {
  url: string;
  isIframe: boolean;
  serverId: string;
}

export interface WatchProgressItem {
  id: string;
  animeId: string;
  animeTitle: string;
  poster: string;
  episodeId: string;
  episodeTitle: string;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string;
  animeId: string;
  title: string;
  poster: string;
  status?: string | null;
  rating?: string | null;
  createdAt: string;
}
