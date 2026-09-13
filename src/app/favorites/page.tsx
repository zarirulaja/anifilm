'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, Play, Film } from 'lucide-react';
import { FavoriteItem } from '@/lib/anime/types';
import { useToast } from '@/components/ui/Toast';
import { useMediaMode } from '@/context/MediaModeContext';

export default function FavoritesPage() {
  const { mode } = useMediaMode();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      const json = await res.json();
      if (json.success) {
        const allFavs: FavoriteItem[] = json.data || [];
        const filtered = allFavs.filter((item: any) => (item.mediaType || 'anime') === mode);
        setFavorites(filtered);
      }
    } catch (err) {
      console.error('Fetch favorites error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [mode]);

  const removeFavorite = async (animeId: string, title: string) => {
    try {
      const res = await fetch(`/api/favorites?animeId=${animeId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setFavorites((prev) => prev.filter((item) => item.animeId !== animeId));
        showToast(`Dihapus dari favorit: ${title}`, 'info');
      }
    } catch (err) {
      console.error('Remove favorite error:', err);
      showToast('Gagal menghapus favorit', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Heart className={`w-6 h-6 ${mode === 'anime' ? 'text-rose-500 fill-rose-500' : 'text-indigo-400 fill-indigo-400'}`} />
            <span>Favorit Saya ({mode === 'anime' ? 'Anime' : 'Film & Series'})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar koleksi {mode === 'anime' ? 'anime' : 'film'} pilihan kamu tersimpan lokal di SQLite.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full rounded-2xl skeleton" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center gap-3">
          <Heart className="w-12 h-12 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300">
            Belum ada {mode === 'anime' ? 'anime' : 'film'} favorit
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Klik tombol ⭐ Add to Favorites untuk menyimpannya di sini.
          </p>
          <Link
            href="/"
            className={`mt-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs transition-colors ${
              mode === 'anime' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            Jelajahi Konten
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 transition-all duration-300"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <button
                  onClick={() => removeFavorite(item.animeId, item.title)}
                  className="absolute top-2 right-2 p-2 rounded-xl bg-slate-950/80 text-rose-400 hover:bg-rose-600 hover:text-white backdrop-blur-md border border-slate-800 transition-colors shadow-md z-10"
                  title="Hapus dari Favorit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  href={mode === 'anime' ? `/anime/${item.animeId}` : `/movie/${item.animeId}`}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform ${
                    mode === 'anime' ? 'bg-red-600 shadow-red-600/50' : 'bg-indigo-600 shadow-indigo-600/50'
                  }`}>
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </Link>
              </div>

              <div className="p-3.5 bg-slate-900/60">
                <Link
                  href={mode === 'anime' ? `/anime/${item.animeId}` : `/movie/${item.animeId}`}
                  className="text-sm font-semibold text-slate-100 hover:text-red-400 line-clamp-2 transition-colors"
                >
                  {item.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
