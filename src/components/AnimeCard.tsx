'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Calendar } from 'lucide-react';
import { AnimeSummary } from '@/lib/anime/types';

interface AnimeCardProps {
  anime: AnimeSummary;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group relative flex flex-col bg-surface-card rounded-2xl overflow-hidden border border-slate-800/80 hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/20"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        <img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Badges Header */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2">
          {/* Sub Indo Badge */}
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider bg-red-600/90 text-white shadow-md backdrop-blur-md">
            SUB INDO
          </span>

          {/* Score Badge */}
          {anime.score && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-md">
              <Star className="w-3 h-3 fill-slate-950" />
              {anime.score}
            </span>
          )}
        </div>

        {/* Hover Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-600/50 scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Info inside Poster */}
        <div className="absolute bottom-3 left-3 right-3 space-y-1">
          {anime.episodes && (
            <div className="text-[11px] font-medium text-red-400 flex items-center gap-1">
              <span>Episode {anime.episodes}</span>
            </div>
          )}

          {anime.lastReleaseDate && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{anime.lastReleaseDate} {anime.releaseDay ? `(${anime.releaseDay})` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Footer */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-slate-900/60">
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-red-400 line-clamp-2 transition-colors leading-snug">
          {anime.title}
        </h3>
      </div>
    </Link>
  );
}
