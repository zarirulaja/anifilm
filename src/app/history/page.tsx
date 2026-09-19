'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Trash2, Play, AlertTriangle, Clock } from 'lucide-react';
import { WatchProgressItem } from '@/lib/anime/types';
import { formatDuration, formatRelativeTime } from '@/lib/utils/time';
import { useToast } from '@/components/ui/Toast';
import { useMediaMode } from '@/context/MediaModeContext';
import { getWatchHistory, removeWatchHistoryItem, clearWatchHistory } from '@/lib/storage/historyStorage';

export default function WatchHistoryPage() {
  const { mode } = useMediaMode();
  const { showToast } = useToast();
  const [historyList, setHistoryList] = useState<WatchProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    try {
      const filtered = getWatchHistory(mode);
      setHistoryList(filtered);
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const handleUpdate = () => fetchHistory();
    window.addEventListener('watch-history-updated', handleUpdate);
    return () => window.removeEventListener('watch-history-updated', handleUpdate);
  }, [mode]);

  const removeHistoryItem = (id: string) => {
    try {
      removeWatchHistoryItem(id);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      showToast('Item riwayat berhasil dihapus dari perangkat ini', 'info');
    } catch (err) {
      console.error('Remove history error:', err);
      showToast('Gagal menghapus item riwayat', 'error');
    }
  };

  const clearAllHistory = () => {
    try {
      clearWatchHistory(mode);
      setHistoryList([]);
      setShowClearModal(false);
      showToast('Seluruh riwayat tontonan pada perangkat ini telah dibersihkan', 'info');
    } catch (err) {
      console.error('Clear history error:', err);
      showToast('Gagal membersihkan riwayat', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <History className={`w-6 h-6 ${mode === 'anime' ? 'text-red-500' : 'text-indigo-400'}`} />
            <span>Riwayat Tontonan ({mode === 'anime' ? 'Anime' : 'Film & Series'})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar tayangan {mode === 'anime' ? 'anime' : 'film'} yang pernah kamu tonton.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800/50 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Riwayat</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 w-full rounded-2xl skeleton" />
          ))}
        </div>
      ) : historyList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center gap-3">
          <History className="w-12 h-12 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300">
            Belum ada riwayat tontonan {mode === 'anime' ? 'anime' : 'film'}
          </h3>
          <Link
            href="/"
            className={`mt-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs transition-colors ${
              mode === 'anime' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            Mulai Nonton
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {historyList.map((item) => {
            const percentage = item.durationSeconds > 0
              ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
              : 0;

            const itemHref = mode === 'anime'
              ? `/watch/${item.animeId}/${item.episodeId}`
              : `/movie/${item.animeId}`;

            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 gap-4 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className="relative aspect-video w-28 sm:w-36 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                    <img
                      src={item.poster}
                      alt={item.animeTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                      <div className={`h-full ${mode === 'anime' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <Link
                      href={mode === 'anime' ? `/anime/${item.animeId}` : `/movie/${item.animeId}`}
                      className="text-base font-bold text-white hover:text-red-400 line-clamp-1 transition-colors"
                    >
                      {item.animeTitle}
                    </Link>
                    <p className="text-xs text-slate-300 font-medium">{item.episodeTitle}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-400" />
                        {formatDuration(item.progressSeconds)} / {formatDuration(item.durationSeconds)} ({percentage}%)
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(item.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Link
                    href={itemHref}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-colors ${
                      mode === 'anime' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Lanjutkan</span>
                  </Link>

                  <button
                    onClick={() => removeHistoryItem(item.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Hapus item ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Konfirmasi Hapus Riwayat</h3>
            </div>
            <p className="text-sm text-slate-300">
              Apakah kamu yakin ingin menghapus seluruh riwayat tontonan?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={clearAllHistory}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
