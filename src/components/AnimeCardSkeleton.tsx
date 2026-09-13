import React from 'react';

export default function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col bg-slate-900/60 rounded-2xl overflow-hidden border border-slate-800/50">
      <div className="relative aspect-[3/4] w-full skeleton" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
      </div>
    </div>
  );
}
