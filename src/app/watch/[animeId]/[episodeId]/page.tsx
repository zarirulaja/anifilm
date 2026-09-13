'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Film, Server, AlertCircle } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import ServerSelector from '@/components/ServerSelector';
import { EpisodeDetail, ServerOption } from '@/lib/anime/types';

export default function WatchPage({
  params,
}: {
  params: { animeId: string; episodeId: string };
}) {
  const { animeId, episodeId } = params;

  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEpisode() {
      setLoading(true);
      setError(null);
      try {
        // Fetch episode detail
        const res = await fetch(`/api/anime/episode/${episodeId}`);
        const json = await res.json();
        if (json.success) {
          const epData: EpisodeDetail = json.data;
          setEpisode(epData);
          setActiveStreamUrl(epData.defaultStreamingUrl);

          // Fetch saved progress for this episode
          const progRes = await fetch(`/api/history/progress?animeId=${animeId}&episodeId=${episodeId}`);
          const progJson = await progRes.json();
          if (progJson.success && progJson.data) {
            setInitialProgress(progJson.data.progressSeconds || 0);
          }
        } else {
          setError(json.error || 'Detail episode tidak ditemukan');
        }
      } catch (err) {
        console.error('Watch page error:', err);
        setError('Gagal memuat streaming episode.');
      } finally {
        setLoading(false);
      }
    }

    if (episodeId) loadEpisode();
  }, [animeId, episodeId]);

  const handleSelectServer = async (server: ServerOption, quality: string) => {
    setSelectedServerId(server.serverId);
    setStreamLoading(true);
    try {
      const res = await fetch(`/api/anime/server/${server.serverId}`);
      const json = await res.json();
      if (json.success && json.data?.url) {
        setActiveStreamUrl(json.data.url);
      } else {
        setError('Gagal mengambil URL video dari server yang dipilih');
      }
    } catch (err) {
      console.error('Server switch error:', err);
    } finally {
      setStreamLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="w-full aspect-video rounded-3xl skeleton" />
        <div className="h-20 w-full rounded-2xl skeleton" />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="p-8 rounded-3xl bg-red-950/80 border border-red-500/40 text-red-200 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold">{error || 'Episode tidak ditemukan'}</h2>
        <Link href={`/anime/${animeId}`} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm">
          Kembali ke Detail Anime
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <Link
            href={`/anime/${animeId}`}
            className="text-xs font-semibold text-red-400 hover:underline flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Detail Anime</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {episode.title}
          </h1>
        </div>

        {/* Prev / Next Episode Buttons */}
        <div className="flex items-center gap-3">
          {episode.hasPrevEpisode && episode.prevEpisodeId ? (
            <Link
              href={`/watch/${animeId}/${episode.prevEpisodeId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Episode Prev</span>
            </Link>
          ) : (
            <button disabled className="px-4 py-2 rounded-xl bg-slate-950 text-slate-600 text-xs font-semibold border border-slate-900 opacity-50">
              Prev Episode
            </button>
          )}

          {episode.hasNextEpisode && episode.nextEpisodeId ? (
            <Link
              href={`/watch/${animeId}/${episode.nextEpisodeId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <span>Episode Next</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <button disabled className="px-4 py-2 rounded-xl bg-slate-950 text-slate-600 text-xs font-semibold border border-slate-900 opacity-50">
              Next Episode
            </button>
          )}
        </div>
      </div>

      {/* Video Player Component */}
      <div className="relative">
        {streamLoading && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <div className="flex items-center gap-3 text-red-400 font-semibold text-sm">
              <Film className="w-6 h-6 animate-spin" />
              <span>Memuat stream server...</span>
            </div>
          </div>
        )}

        <VideoPlayer
          streamUrl={activeStreamUrl}
          isIframe={true}
          animeId={animeId}
          animeTitle={episode.title}
          poster=""
          episodeId={episodeId}
          episodeTitle={episode.title}
          initialProgress={initialProgress}
          nextEpisodeId={episode.nextEpisodeId}
        />
      </div>

      {/* Server & Quality Selector Panel */}
      <ServerSelector
        qualities={episode.qualities}
        selectedServerId={selectedServerId}
        onSelectServer={handleSelectServer}
      />
    </div>
  );
}
