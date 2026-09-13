import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/60 bg-slate-950/80 mt-20 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="font-bold text-lg text-white">
              Nonton<span className="text-red-500">Anime</span>
            </span>
          </div>

          <p className="text-sm text-slate-500 text-center sm:text-left">
            Personal Anime Streaming Dashboard — Powered by Wajik Anime API & Otakudesu.
          </p>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-red-400 transition-colors">Home</Link>
            <Link href="/ongoing" className="hover:text-red-400 transition-colors">Ongoing</Link>
            <Link href="/completed" className="hover:text-red-400 transition-colors">Completed</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
