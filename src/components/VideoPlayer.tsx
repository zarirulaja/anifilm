'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, ExternalLink, RotateCcw, ChevronRight, Subtitles, Clock, Volume2, Globe } from 'lucide-react';
import { formatDuration } from '@/lib/utils/time';
import { useToast } from '@/components/ui/Toast';

interface VideoPlayerProps {
  streamUrl: string;
  isIframe?: boolean;
  animeId: string;
  animeTitle: string;
  poster: string;
  episodeId: string;
  episodeTitle: string;
  initialProgress?: number;
  nextEpisodeId?: string | null;
  onEpisodeCompleted?: () => void;
}

export default function VideoPlayer({
  streamUrl,
  isIframe = true,
  animeId,
  animeTitle,
  poster,
  episodeId,
  episodeTitle,
  initialProgress = 0,
  nextEpisodeId,
  onEpisodeCompleted,
}: VideoPlayerProps) {
  const { showToast } = useToast();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(initialProgress > 10);
  const [isEnded, setIsEnded] = useState(false);

  // Auto-save progress every 5 seconds
  const lastSavedTimeRef = useRef<number>(0);

  const saveProgress = async (current: number, dur: number, completed: boolean = false) => {
    if (current <= 0 && !completed) return;
    try {
      await fetch('/api/history/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId,
          animeTitle,
          poster,
          episodeId,
          episodeTitle,
          progressSeconds: Math.floor(current),
          durationSeconds: Math.floor(dur || 1440),
          completed,
        }),
      });
    } catch (err) {
      console.error('Failed to save watch progress:', err);
    }
  };

  useEffect(() => {
    if (initialProgress > 10 && !isIframe && videoRef.current) {
      videoRef.current.currentTime = initialProgress;
    }
  }, [initialProgress, isIframe]);

  // Periodic progress saving for iframe mode
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTime - lastSavedTimeRef.current > 4) {
        lastSavedTimeRef.current = currentTime;
        saveProgress(currentTime, duration);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTime, duration, animeId, episodeId]);

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isIframe && videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play();
          else videoRef.current.pause();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isIframe]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const handleResumePlayback = () => {
    if (!isIframe && videoRef.current) {
      videoRef.current.currentTime = initialProgress;
      videoRef.current.play();
    }
    setShowResumePrompt(false);
    showToast(`Melanjutkan tayangan dari ${formatDuration(initialProgress)}`, 'info');
  };

  const isDesustreamOrBlocked = streamUrl ? (streamUrl.includes('desustream') || streamUrl.includes('desu.')) : false;

  return (
    <div className="space-y-4">
      {/* Desustream / Iframe Refused Alert Banner */}
      {isDesustreamOrBlocked && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/60 text-amber-400 shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-amber-300">Server Desustream Menolak Embedding (Iframe Blocked)</p>
              <p className="text-amber-200/80 text-xs">
                Penyedia video <code className="bg-amber-900/50 px-1 rounded">desustream.net</code> melarang pemutaran langsung di dalam website (X-Frame-Options). Silakan klik <strong>Buka di Tab Baru</strong> atau pilih server mirror lain di bawah.
              </p>
            </div>
          </div>
          {streamUrl && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors shrink-0 flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </a>
          )}
        </div>
      )}

      {/* Resume Banner if initialProgress exists */}
      {showResumePrompt && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-medium">
              Terakhir ditonton sampai posisi <strong>{formatDuration(initialProgress)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResumePlayback}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Resume Playback
            </button>
            <button
              onClick={() => setShowResumePrompt(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Main Video Player Container */}
      <div
        ref={playerContainerRef}
        className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl group"
      >
        {streamUrl ? (
          isIframe ? (
            <iframe
              src={streamUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="no-referrer"
              title={`${animeTitle} - ${episodeTitle}`}
            />
          ) : (
            <video
              ref={videoRef}
              src={streamUrl}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onEnded={() => {
                setIsEnded(true);
                saveProgress(duration, duration, true);
                if (onEpisodeCompleted) onEpisodeCompleted();
              }}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Play className="w-12 h-12 text-slate-700 animate-pulse" />
            <span className="text-sm">Memuat stream video...</span>
          </div>
        )}

        {/* Video Overlay Info Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">🇯🇵 Sub Indo</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {streamUrl && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg backdrop-blur-md transition-all hover:scale-105"
                title="Buka player ini di tab baru jika iframe memerlukan login atau ditolak browser"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </a>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-950/90 text-white hover:bg-slate-800 backdrop-blur-md border border-slate-800 transition-colors"
              title="Fullscreen (F)"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* End of Episode Completed Overlay */}
        {isEnded && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-4">
            <h3 className="text-2xl font-extrabold text-white">Episode Selesai</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Kamu telah menyelesaikan tayangan episode ini.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setIsEnded(false);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                Putar Ulang
              </button>

              {nextEpisodeId && (
                <a
                  href={`/watch/${animeId}/${nextEpisodeId}`}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/30"
                >
                  <span>Episode Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtitle & Audio Track Switching Instructions Panel */}
      <div className="space-y-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Cara Mengubah Voice ke Bahasa Jepang 🇯🇵</h4>
                <p className="text-slate-400 text-xs">Jika audio terputar dalam bahasa Inggris (Dubbed), ikuti 2 langkah mudah berikut:</p>
              </div>
            </div>

            {streamUrl && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/60 shadow-md transition-all hover:scale-105"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                <span>Buka di Tab Baru</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span>1. Pemutar Utama (Wajik API Sub Indo)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Video diputar langsung dalam bahasa Asli Jepang dengan Subtitle Indonesia. Klik tombol Play di tengah layar untuk memulai streaming.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span>2. Server Mirror & Resolusi</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Pilih variasi resolusi (1080p, 720p, 480p, 360p) atau server mirror (Filedon, Vidhide, Mega, Odcdn, Blogs) pada panel di bawah jika memerlukan opsi pemutar cadangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
