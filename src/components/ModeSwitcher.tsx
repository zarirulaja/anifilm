'use client';

import React from 'react';
import { Flame, Film } from 'lucide-react';
import { useMediaMode } from '@/context/MediaModeContext';

export default function ModeSwitcher() {
  const { mode, setMode } = useMediaMode();

  return (
    <div className="flex items-center p-1 bg-slate-950/90 rounded-2xl border border-slate-800/80 shadow-inner">
      <button
        onClick={() => setMode('anime')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
          mode === 'anime'
            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
        }`}
      >
        <Flame className={`w-3.5 h-3.5 ${mode === 'anime' ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
        <span>Anime</span>
      </button>

      <button
        onClick={() => setMode('movie')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
          mode === 'movie'
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
        }`}
      >
        <Film className={`w-3.5 h-3.5 ${mode === 'movie' ? 'text-indigo-300' : 'text-slate-400'}`} />
        <span>Film & Series</span>
      </button>
    </div>
  );
}
