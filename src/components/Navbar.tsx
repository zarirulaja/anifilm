'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Play, Search, Heart, History, Flame, CheckCircle, Menu, X, Film } from 'lucide-react';
import ModeSwitcher from '@/components/ModeSwitcher';
import { useMediaMode } from '@/context/MediaModeContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useMediaMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/', icon: Play },
    { name: mode === 'anime' ? 'Ongoing' : 'Popular Film', href: mode === 'anime' ? '/ongoing' : '/movies', icon: Flame },
    { name: mode === 'anime' ? 'Completed' : 'Series', href: mode === 'anime' ? '/completed' : '/series', icon: CheckCircle },
    { name: 'Favorites', href: '/favorites', icon: Heart },
    { name: 'History', href: '/history', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 ${
              mode === 'anime'
                ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-red-600/30'
                : 'bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-500 shadow-indigo-600/30'
            }`}>
              {mode === 'anime' ? (
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              ) : (
                <Film className="w-5 h-5 text-white ml-0.5" />
              )}
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-red-400 transition-colors hidden sm:inline">
              Nonton<span className={mode === 'anime' ? 'text-red-500' : 'text-indigo-400'}>
                {mode === 'anime' ? 'Anime' : 'Movie'}
              </span>
            </span>
          </Link>

          {/* Mode Switcher Pills */}
          <div className="flex items-center">
            <ModeSwitcher />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? mode === 'anime'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (mode === 'anime' ? 'text-red-400' : 'text-indigo-400') : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Input */}
          <div className="hidden md:flex items-center max-w-xs w-full">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder={mode === 'anime' ? 'Cari anime...' : 'Cari film & series...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 text-xs text-slate-200 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-red-500/50 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-4 pt-4 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder={mode === 'anime' ? 'Cari anime...' : 'Cari film & series...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-200 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-red-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? mode === 'anime' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
