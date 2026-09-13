'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import AnimeCardSkeleton from '@/components/AnimeCardSkeleton';
import { MovieSummary } from '@/lib/movie/types';

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/movie/popular?page=${page}`);
        const json = await res.json();
        if (json.success) {
          setMovies(json.data.movies || []);
        } else {
          setError(json.error || 'Gagal memuat film populer');
        }
      } catch (err) {
        console.error('Popular movies fetch error:', err);
        setError('Gagal terhubung ke API LK21.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [page]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <Film className="w-7 h-7 text-indigo-500" />
            <span>Film Populer (LayarKaca21)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kumpulan film bioskop populer dengan subtitle Indonesia
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 18 }).map((_, i) => <AnimeCardSkeleton key={i} />)
          : movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>

      {/* Empty State */}
      {!loading && movies.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center gap-3">
          <Film className="w-12 h-12 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300">Tidak ada film yang ditemukan</h3>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <span className="text-xs font-bold text-slate-400 px-2">Halaman {page}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || movies.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
