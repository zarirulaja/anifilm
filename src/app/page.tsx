'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, CheckCircle, Clock, ChevronRight, AlertCircle, Film, Star } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import AnimeCard from '@/components/AnimeCard';
import MovieCard from '@/components/MovieCard';
import AnimeCardSkeleton from '@/components/AnimeCardSkeleton';
import ContinueWatchingCard from '@/components/ContinueWatchingCard';
import { AnimeSummary, WatchProgressItem } from '@/lib/anime/types';
import { MovieSummary } from '@/lib/movie/types';
import { useMediaMode } from '@/context/MediaModeContext';

export default function HomePage() {
  const { mode } = useMediaMode();

  // Anime state
  const [ongoingList, setOngoingList] = useState<AnimeSummary[]>([]);
  const [completedList, setCompletedList] = useState<AnimeSummary[]>([]);

  // Movie state
  const [popularMovies, setPopularMovies] = useState<MovieSummary[]>([]);
  const [popularSeries, setPopularSeries] = useState<MovieSummary[]>([]);

  // History & loading state
  const [continueWatchingList, setContinueWatchingList] = useState<WatchProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'anime') {
          const homeRes = await fetch('/api/anime/home');
          const homeData = await homeRes.json();
          if (homeData.success) {
            setOngoingList(homeData.data.ongoing || []);
            setCompletedList(homeData.data.completed || []);
          } else {
            setError(homeData.error || 'Gagal memuat data dari Wajik Anime API');
          }
        } else {
          const movieRes = await fetch('/api/movie/home');
          const movieData = await movieRes.json();
          if (movieData.success) {
            setPopularMovies(movieData.data.popularMovies || []);
            setPopularSeries(movieData.data.popularSeries || []);
          } else {
            setError(movieData.error || 'Gagal memuat data dari LK21 API');
          }
        }

        // Fetch watch history filtering by active mediaType
        const historyRes = await fetch('/api/history');
        const historyData = await historyRes.json();
        if (historyData.success) {
          const filtered = (historyData.data || []).filter(
            (item: any) => (item.mediaType || 'anime') === mode
          );
          setContinueWatchingList(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error('Home Page load error:', err);
        setError(
          mode === 'anime'
            ? 'Layanan Anime sedang tidak tersedia. Pastikan Wajik API berjalan di http://localhost:3001'
            : 'Layanan Film sedang tidak tersedia. Pastikan LK21 API berjalan di http://localhost:3002'
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mode]);

  const heroAnime = ongoingList.length > 0 ? ongoingList[0] : null;
  const heroMovie = popularMovies.length > 0 ? popularMovies[0] : null;

  return (
    <div className="space-y-12">
      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Mode Anime Layout */}
      {mode === 'anime' ? (
        <>
          {loading ? (
            <div className="w-full h-80 rounded-3xl skeleton" />
          ) : heroAnime ? (
            <HeroBanner anime={heroAnime} />
          ) : null}

          {/* Continue Watching Section */}
          {continueWatchingList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  <span>Lanjutkan Menonton Anime</span>
                </h2>
                <Link
                  href="/history"
                  className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <span>Lihat Semua Riwayat</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {continueWatchingList.map((item) => (
                  <ContinueWatchingCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Ongoing Anime Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Anime Ongoing Terbaru</span>
              </h2>
              <Link
                href="/ongoing"
                className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua Ongoing</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <AnimeCardSkeleton key={i} />)
                : ongoingList.slice(0, 12).map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
            </div>
          </section>

          {/* Latest Completed Anime Section */}
          {completedList.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Anime Tamat (Completed)</span>
                </h2>
                <Link
                  href="/completed"
                  className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <span>Lihat Semua Completed</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <AnimeCardSkeleton key={i} />)
                  : completedList.slice(0, 6).map((anime) => (
                      <AnimeCard key={anime.id} anime={anime} />
                    ))}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Mode Film / Series Layout */
        <>
          {loading ? (
            <div className="w-full h-80 rounded-3xl skeleton" />
          ) : heroMovie ? (
            <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl mb-12">
              <div className="absolute inset-0 z-0">
                <img
                  src={heroMovie.poster}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover filter blur-xl opacity-30 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
              </div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-10 items-center">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-md">
                      <Film className="w-3.5 h-3.5" />
                      FEATURED MOVIE
                    </span>
                    {heroMovie.rating && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        Rating: {heroMovie.rating}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {heroMovie.title}
                  </h1>

                  <p className="text-sm text-slate-300 line-clamp-2 max-w-2xl">
                    Tonton film bioskop terbaru dengan subtitle Indonesia kualitas HD di LayarKaca21.
                  </p>

                  <div className="pt-2">
                    <Link
                      href={`/movie/${heroMovie.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      <Film className="w-4 h-4" />
                      <span>Tonton Film</span>
                    </Link>
                  </div>
                </div>

                <div className="hidden md:block md:col-span-4 justify-self-end">
                  <div className="relative aspect-[3/4] w-48 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 rotate-2">
                    <img src={heroMovie.poster} alt={heroMovie.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Popular Movies Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-500" />
                <span>Film Populer (LayarKaca21)</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <AnimeCardSkeleton key={i} />)
                : popularMovies.slice(0, 12).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
            </div>
          </section>

          {/* Popular Series Section */}
          {popularSeries.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-violet-500" />
                  <span>Series & Drama Populer (NontonDrama)</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <AnimeCardSkeleton key={i} />)
                  : popularSeries.slice(0, 6).map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
