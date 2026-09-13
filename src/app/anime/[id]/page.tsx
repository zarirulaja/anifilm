'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Star, Heart, Calendar, Clock, Film, Tv, AlertCircle } from 'lucide-react';
import EpisodeList from '@/components/EpisodeList';
import { AnimeDetail } from '@/lib/anime/types';
import { useToast } from '@/components/ui/Toast';

export default function AnimeDetailPage({ params }: { params: { id: string } }) {
  const animeId = params.id;
  const { showToast } = useToast();

  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchedEpisodeIds, setWatchedEpisodeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch detail from API
        const res = await fetch(`/api/anime/${animeId}`);
        const json = await res.json();
        if (json.success) {
          setAnime(json.data);
        } else {
          setError(json.error || 'Detail anime tidak ditemukan');
        }

        // Check if favorite in SQLite DB
        const favRes = await fetch('/api/favorites');
        const favJson = await favRes.json();
        if (favJson.success && Array.isArray(favJson.data)) {
          const exists = favJson.data.some((f: any) => f.animeId === animeId);
          setIsFavorite(exists);
        }

        // Check watched episodes from history DB
        const histRes = await fetch('/api/history');
        const histJson = await histRes.json();
        if (histJson.success && Array.isArray(histJson.data)) {
          const watchedIds = histJson.data
            .filter((item: any) => item.animeId === animeId)
            .map((item: any) => item.episodeId);
          setWatchedEpisodeIds(watchedIds);
        }
      } catch (err) {
        console.error('Anime detail load error:', err);
        setError('Gagal memuat detail anime.');
      } finally {
        setLoading(false);
      }
    }

    if (animeId) loadData();
  }, [animeId]);

  const toggleFavorite = async () => {
    if (!anime) return;
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?animeId=${animeId}`, { method: 'DELETE' });
        setIsFavorite(false);
        showToast(`Dihapus dari Favorit: ${anime.title}`, 'info');
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeId: anime.id,
            title: anime.title,
            poster: anime.poster,
            status: anime.status,
            rating: anime.score,
          }),
        });
        setIsFavorite(true);
        showToast(`Ditambahkan ke Favorit: ${anime.title}`, 'success');
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      showToast('Gagal mengubah status favorit', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="w-full h-80 rounded-3xl skeleton" />
        <div className="h-10 w-1/3 skeleton rounded-xl" />
        <div className="h-40 w-full skeleton rounded-2xl" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="p-8 rounded-3xl bg-red-950/80 border border-red-500/40 text-red-200 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold">{error || 'Anime tidak ditemukan'}</h2>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  const firstEpisodeId = anime.episodeList?.[0]?.episodeId;

  return (
    <div className="space-y-10">
      {/* Header Poster & Details Hero */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        {/* Backdrop image */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover filter blur-2xl scale-125" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Poster Image */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80">
              <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Metadata */}
          <div className="md:col-span-8 lg:col-span-9 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {anime.score && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    {anime.score}
                  </span>
                )}

                {anime.status && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white">
                    {anime.status}
                  </span>
                )}

                {anime.type && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {anime.type}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {anime.title}
              </h1>

              {anime.japanese && (
                <p className="text-xs text-slate-400 font-mono">{anime.japanese}</p>
              )}
            </div>

            {/* Quick Metadata Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Studio</span>
                <span className="font-semibold text-slate-200">{anime.studios || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Durasi</span>
                <span className="font-semibold text-slate-200">{anime.duration || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Rilis</span>
                <span className="font-semibold text-slate-200">{anime.aired || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Produser</span>
                <span className="font-semibold text-slate-200 truncate block">{anime.producers || '-'}</span>
              </div>
            </div>

            {/* Genres */}
            {anime.genres.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {anime.genres.map((g) => (
                  <span
                    key={g.genreId}
                    className="px-3 py-1 rounded-xl bg-slate-800/80 text-xs font-medium text-slate-300 border border-slate-700/50"
                  >
                    {g.title}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
              {firstEpisodeId ? (
                <Link
                  href={`/watch/${anime.id}/${firstEpisodeId}`}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Nonton Sekarang</span>
                </Link>
              ) : (
                <button disabled className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-500 font-bold text-sm">
                  Episode Belum Tersedia
                </button>
              )}

              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                  isFavorite
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
                <span>{isFavorite ? 'Dalam Favorit' : 'Tambah Favorit'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis Section */}
      {anime.synopsis.length > 0 && (
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white">Sinopsis</h2>
          <div className="text-sm text-slate-300 leading-relaxed space-y-3">
            {anime.synopsis.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Episode List Component */}
      <EpisodeList
        animeId={anime.id}
        episodes={anime.episodeList}
        watchedEpisodeIds={watchedEpisodeIds}
      />
    </div>
  );
}
