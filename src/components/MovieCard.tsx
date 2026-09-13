'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Film, Tv } from 'lucide-react';
import { MovieSummary } from '@/lib/movie/types';

interface MovieCardProps {
  movie: MovieSummary;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group relative flex flex-col bg-surface-card rounded-2xl overflow-hidden border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/20"
    >
      {/* Poster Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-600/90 text-white shadow-md backdrop-blur-md">
            {movie.type === 'series' ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
            {movie.type === 'series' ? 'SERIES' : 'FILM'}
          </span>

          {movie.rating && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-md">
              <Star className="w-3 h-3 fill-slate-950" />
              {movie.rating}
            </span>
          )}
        </div>

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Quality / Duration Badge at Bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-slate-300 font-medium">
          {movie.quality && (
            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-indigo-300 font-bold">
              {movie.quality}
            </span>
          )}
          {movie.duration && (
            <span className="text-slate-400">{movie.duration}</span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-slate-900/60">
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 line-clamp-2 transition-colors leading-snug">
          {movie.title}
        </h3>
      </div>
    </Link>
  );
}
