'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, AlertCircle, Film } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import MovieCard from '@/components/MovieCard';
import AnimeCardSkeleton from '@/components/AnimeCardSkeleton';
import { AnimeSummary } from '@/lib/anime/types';
import { MovieSummary } from '@/lib/movie/types';
import { useMediaMode } from '@/context/MediaModeContext';

function SearchContent() {
  const { mode } = useMediaMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [animeResults, setAnimeResults] = useState<AnimeSummary[]>([]);
  const [movieResults, setMovieResults] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery.trim()) {
      executeSearch(initialQuery.trim());
    } else {
      setAnimeResults([]);
      setMovieResults([]);
      setHasSearched(false);
    }
  }, [initialQuery, mode]);

  const executeSearch = async (q: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      if (mode === 'anime') {
        const res = await fetch(`/api/anime/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success) {
          setAnimeResults(json.data.animeList || []);
        } else {
          setError(json.error || 'Gagal mencari anime');
        }
      } else {
        const res = await fetch(`/api/movie/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success) {
          setMovieResults(json.data.movies || []);
        } else {
          setError(json.error || 'Gagal mencari film');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Gagal terhubung ke API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const totalCount = mode === 'anime' ? animeResults.length : movieResults.length;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Pencarian {mode === 'anime' ? 'Anime' : 'Film & Series'}
        </h1>
        <p className="text-sm text-slate-400">
          Temukan tayangan favoritmu dengan cepat di database {mode === 'anime' ? 'Otakudesu' : 'LayarKaca21'}.
        </p>

        <form onSubmit={handleSearchFormSubmit} className="relative w-full">
          <input
            type="text"
            placeholder={
              mode === 'anime'
                ? 'Ketik judul anime (contoh: One Piece, Naruto)...'
                : 'Ketik judul film/series (contoh: Avatar, Avengers)...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 text-base text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-28 py-3.5 border border-slate-800 focus:outline-none focus:border-red-500 shadow-xl"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-colors ${
              mode === 'anime' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            Cari
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {hasSearched && !loading && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-200">
            Hasil Pencarian untuk <span className={mode === 'anime' ? 'text-red-400' : 'text-indigo-400'}>&quot;{initialQuery}&quot;</span>
          </h2>
          <span className="text-xs text-slate-400">{totalCount} hasil ditemukan</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : mode === 'anime' ? (
        animeResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {animeResults.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : hasSearched ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center gap-3">
            <Film className="w-12 h-12 text-slate-700" />
            <h3 className="text-base font-bold text-slate-300">Anime tidak ditemukan</h3>
          </div>
        ) : null
      ) : movieResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movieResults.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : hasSearched ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center gap-3">
          <Film className="w-12 h-12 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300">Film tidak ditemukan</h3>
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
