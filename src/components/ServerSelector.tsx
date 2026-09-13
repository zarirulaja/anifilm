'use client';

import React from 'react';
import { Server, Monitor } from 'lucide-react';
import { QualityGroup, ServerOption } from '@/lib/anime/types';

interface ServerSelectorProps {
  qualities: QualityGroup[];
  selectedServerId: string | null;
  onSelectServer: (server: ServerOption, quality: string) => void;
}

export default function ServerSelector({
  qualities,
  selectedServerId,
  onSelectServer,
}: ServerSelectorProps) {
  if (!qualities || qualities.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
        Pilihan server tambahan tidak tersedia. Menggunakan server default.
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
        <Server className="w-4 h-4 text-red-500" />
        <span>Pilihan Server & Kualitas Video</span>
      </div>

      <div className="space-y-3">
        {qualities.map((group) => (
          <div key={group.quality} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 sm:w-28 shrink-0">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              {group.quality || 'Standard'}
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {group.servers.map((srv) => {
                const isSelected = selectedServerId === srv.serverId;
                return (
                  <button
                    key={srv.serverId}
                    onClick={() => onSelectServer(srv, group.quality)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30 ring-2 ring-red-400'
                        : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {srv.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
