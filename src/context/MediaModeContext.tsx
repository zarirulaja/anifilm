'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type MediaMode = 'anime' | 'movie';

interface MediaModeContextType {
  mode: MediaMode;
  setMode: (mode: MediaMode) => void;
  toggleMode: () => void;
}

const MediaModeContext = createContext<MediaModeContextType | undefined>(undefined);

export function MediaModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<MediaMode>('anime');

  useEffect(() => {
    const saved = localStorage.getItem('nonton_media_mode') as MediaMode;
    if (saved === 'anime' || saved === 'movie') {
      setModeState(saved);
    }
  }, []);

  const setMode = (newMode: MediaMode) => {
    setModeState(newMode);
    localStorage.setItem('nonton_media_mode', newMode);
  };

  const toggleMode = () => {
    const nextMode = mode === 'anime' ? 'movie' : 'anime';
    setMode(nextMode);
  };

  return (
    <MediaModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </MediaModeContext.Provider>
  );
}

export function useMediaMode() {
  const context = useContext(MediaModeContext);
  if (!context) {
    throw new Error('useMediaMode must be used within MediaModeProvider');
  }
  return context;
}
