'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Info, Star, Flame } from 'lucide-react';
import { AnimeSummary } from '@/lib/anime/types';

interface HeroBannerProps {
  anime: AnimeSummary;
}

export default function HeroBanner({ anime }: HeroBannerProps) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl mb-12">
      {/* Background Poster & Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover object-center filter blur-xl opacity-30 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-10 items-center">
        
        {/* Left Side: Text Info */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white shadow-md">
              <Flame className="w-3.5 h-3.5 fill-white" />
              HOT RELEASE
            </span>

            {anime.score && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-slate-950 shadow-md">
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                Score: {anime.score}
              </span>
            )}

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/50">
              Subtitle Indonesia
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            {anime.title}
          </h1>

          <p className="text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
            Nikmati tayangan kualitas terbaik dengan subtitle Indonesia terbaru untuk anime {anime.title}. {anime.episodes ? `Tersedia hingga Episode ${anime.episodes}.` : ''}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-4 flex-wrap">
            <Link
              href={`/anime/${anime.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 hover:scale-105 transition-all duration-300"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Now
            </Link>

            <Link
              href={`/anime/${anime.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700/60 transition-all duration-300"
            >
              <Info className="w-4 h-4 text-slate-400" />
              Detail Info
            </Link>
          </div>
        </div>

        {/* Right Side: Poster Preview */}
        <div className="hidden md:block md:col-span-4 justify-self-end">
          <div className="relative aspect-[3/4] w-48 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 rotate-2 hover:rotate-0 transition-transform duration-500">
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
