'use client';

import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { WatchProgressItem } from '@/lib/anime/types';
import { formatDuration } from '@/lib/utils/time';

interface ContinueWatchingCardProps {
  item: WatchProgressItem;
}

export default function ContinueWatchingCard({ item }: ContinueWatchingCardProps) {
  const percentage = item.durationSeconds > 0
    ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
    : 0;

  return (
    <Link
      href={`/watch/${item.animeId}/${item.episodeId}`}
      className="group relative flex flex-col bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/20"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={item.poster}
          alt={item.animeTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
          }}
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Progress Bar Container at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="p-3.5 space-y-1">
        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-red-400 line-clamp-1 transition-colors">
          {item.animeTitle}
        </h4>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300 line-clamp-1">{item.episodeTitle}</span>
          <span className="text-[11px] font-mono text-red-400">{formatDuration(item.progressSeconds)}</span>
        </div>
      </div>
    </Link>
  );
}
