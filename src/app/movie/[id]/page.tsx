'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, Star, Heart, Calendar, Clock, AlertCircle, Play, Server, ExternalLink, ShieldAlert } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import { MovieDetail } from '@/lib/movie/types';
import { useToast } from '@/components/ui/Toast';

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const movieId = params.id;
  const { showToast } = useToast();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMovieData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/movie/${movieId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const mData: MovieDetail = json.data;
          setMovie(mData);
          if (mData.streamUrls && mData.streamUrls.length > 0) {
            setActiveStreamUrl(mData.streamUrls[0].url);
            setSelectedProvider(mData.streamUrls[0].provider);
          }
        } else {
          setError(json.error || 'Detail film tidak ditemukan');
        }

        // Check favorite
        const favRes = await fetch('/api/favorites');
        const favJson = await favRes.json();
        if (favJson.success && Array.isArray(favJson.data)) {
          const exists = favJson.data.some((f: any) => f.animeId === movieId);
          setIsFavorite(exists);
        }
      } catch (err) {
        console.error('Movie detail error:', err);
        setError('Gagal memuat detail film.');
      } finally {
        setLoading(false);
      }
    }

    if (movieId) loadMovieData();
  }, [movieId]);

  const toggleFavorite = async () => {
    if (!movie) return;
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?animeId=${movieId}`, { method: 'DELETE' });
        setIsFavorite(false);
        showToast(`Dihapus dari Favorit: ${movie.title}`, 'info');
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaType: 'movie',
            animeId: movie.id,
            title: movie.title,
            poster: movie.poster,
            status: movie.quality || 'Movie',
            rating: movie.rating,
          }),
        });
        setIsFavorite(true);
        showToast(`Ditambahkan ke Favorit: ${movie.title}`, 'success');
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
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="p-8 rounded-3xl bg-red-950/80 border border-red-500/40 text-red-200 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold">{error || 'Film tidak ditemukan'}</h2>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Movie Details Header */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover filter blur-2xl scale-125" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80">
              <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="md:col-span-8 lg:col-span-9 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {movie.rating && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    {movie.rating}
                  </span>
                )}
                {movie.quality && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                    {movie.quality}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {movie.title}
              </h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Durasi</span>
                <span className="font-semibold text-slate-200">{movie.duration || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tahun / Rilis</span>
                <span className="font-semibold text-slate-200">{movie.releaseDate || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sutradara</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {movie.directors?.join(', ') || '-'}
                </span>
              </div>
            </div>

            {movie.genres.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {movie.genres.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-slate-800/80 text-xs font-medium text-slate-300 border border-slate-700/50"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
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

      {/* Video Player Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <span>Pemutar Film Stream</span>
          </h2>

          {activeStreamUrl && (
            <a
              href={activeStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Player di Tab Baru</span>
            </a>
          )}
        </div>

        {/* Informational Banner for Iframe Embedding Restrictions */}
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <p>
            Jika pemutar video menampilkan <strong>&quot;videonode.de refused to connect&quot;</strong> (kebijakan keamanan browser terhadap domain external), klik tombol <strong>Buka Player di Tab Baru</strong> atau pilih Server lain di bawah.
          </p>
        </div>

        <VideoPlayer
          streamUrl={activeStreamUrl}
          isIframe={true}
          animeId={movie.id}
          animeTitle={movie.title}
          poster={movie.poster}
          episodeId="full-movie"
          episodeTitle="Full Movie"
        />

        {/* Stream Server Selector */}
        {movie.streamUrls.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Pilih Server Stream:</span>
            </span>

            {movie.streamUrls.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveStreamUrl(s.url);
                  setSelectedProvider(s.provider);
                  showToast(`Mengalihkan ke server: ${s.provider}`, 'info');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedProvider === s.provider
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {s.provider}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Synopsis Section */}
      {movie.synopsis && (
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white">Sinopsis Film</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{movie.synopsis}</p>
        </div>
      )}
    </div>
  );
}
