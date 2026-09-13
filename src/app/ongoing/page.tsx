'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Flame, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import AnimeCardSkeleton from '@/components/AnimeCardSkeleton';
import { AnimeSummary, Pagination } from '@/lib/anime/types';

function OngoingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = Number(searchParams.get('page') || '1');

  const [animeList, setAnimeList] = useState<AnimeSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOngoing() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/anime/ongoing?page=${pageParam}`);
        const json = await res.json();
        if (json.success) {
          setAnimeList(json.data.animeList || []);
          setPagination(json.data.pagination);
        } else {
          setError(json.error || 'Gagal memuat data ongoing anime');
        }
      } catch (err) {
        console.error('Ongoing page error:', err);
        setError('Gagal menghubungkan ke Wajik API.');
      } finally {
        setLoading(false);
      }
    }

    fetchOngoing();
  }, [pageParam]);

  const handlePageChange = (newPage: number) => {
    router.push(`/ongoing?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            <span>Anime Ongoing Terbaru</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar serial anime yang sedang tayang secara berkala di Otakudesu.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Anime Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 18 }).map((_, i) => <AnimeCardSkeleton key={i} />)
          : animeList.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
      </div>

      {/* Pagination Navigation */}
      {pagination && (
        <div className="flex items-center justify-center gap-3 pt-8">
          <button
            disabled={!pagination.hasPrevPage || loading}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-4 py-2 rounded-xl bg-slate-950 text-xs font-bold text-slate-400 border border-slate-800">
            Halaman {pagination.currentPage} / {pagination.totalPages}
          </span>

          <button
            disabled={!pagination.hasNextPage || loading}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function OngoingPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    }>
      <OngoingContent />
    </Suspense>
  );
}
