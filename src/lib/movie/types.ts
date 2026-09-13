export interface MovieSummary {
  id: string;
  title: string;
  poster: string;
  rating?: string;
  duration?: string;
  quality?: string;
  releaseDate?: string;
  type: 'movie' | 'series';
}

export interface StreamSourceItem {
  provider: string;
  url: string;
}

export interface MovieDetail {
  id: string;
  title: string;
  poster: string;
  synopsis: string;
  rating?: string;
  duration?: string;
  quality?: string;
  releaseDate?: string;
  genres: string[];
  directors?: string[];
  casts?: string[];
  countries?: string[];
  trailerUrl?: string;
  streamUrls: StreamSourceItem[];
}

export interface SeriesEpisodeItem {
  episodeNumber: number;
  episodeId: string;
  title: string;
}

export interface SeriesSeasonGroup {
  seasonNumber: number;
  episodes: SeriesEpisodeItem[];
}

export interface SeriesDetail {
  id: string;
  title: string;
  poster: string;
  synopsis: string;
  rating?: string;
  seasons: SeriesSeasonGroup[];
}
