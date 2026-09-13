'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Search, CheckCircle2 } from 'lucide-react';
import { EpisodeSummary } from '@/lib/anime/types';

interface EpisodeListProps {
  animeId: string;
  episodes: EpisodeSummary[];
  watchedEpisodeIds?: string[];
}

export default function EpisodeList({ animeId, episodes, watchedEpisodeIds = [] }: EpisodeListProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  const BATCH_SIZE = 50;

  // Generate episode batches if more than 50 episodes
  const totalBatches = Math.ceil(episodes.length / BATCH_SIZE);
  const batches = Array.from({ length: totalBatches }).map((_, idx) => {
    const start = idx * BATCH_SIZE + 1;
    const end = Math.min((idx + 1) * BATCH_SIZE, episodes.length);
    return { start, end, label: `${start}-${end}` };
  });

  const isFiltering = filterQuery.trim().length > 0;

  const displayEpisodes = isFiltering
    ? episodes.filter((ep) =>
        ep.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        ep.episodeId.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : episodes.slice(selectedBatchIndex * BATCH_SIZE, (selectedBatchIndex + 1) * BATCH_SIZE);

  return (
    <div className="space-y-6">
      {/* Search & Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Daftar Episode</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
            Total {episodes.length} Episode
          </span>
        </h3>

        {episodes.length > 10 && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari episode (cth: 1177)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-red-500/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>

      {/* Episode Batch Range Tabs (shown when total > 50 and not filtering) */}
      {!isFiltering && totalBatches > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {batches.map((batch, idx) => (
            <button
              key={batch.label}
              onClick={() => setSelectedBatchIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBatchIndex === idx
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Episode {batch.label}
            </button>
          ))}
        </div>
      )}

      {/* Episodes Grid */}
      {displayEpisodes.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/50">
          Episode tidak ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {displayEpisodes.map((ep) => {
            const isWatched = watchedEpisodeIds.includes(ep.episodeId);
            return (
              <Link
                key={ep.episodeId}
                href={`/watch/${animeId}/${ep.episodeId}`}
                className={`group relative flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  isWatched
                    ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300 hover:border-emerald-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Play className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-red-400 group-hover:fill-red-400 transition-colors" />
                  <span className="truncate">{ep.title}</span>
                </div>

                {isWatched && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
