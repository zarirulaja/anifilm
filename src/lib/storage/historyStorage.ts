import { WatchProgressItem } from '@/lib/anime/types';

const STORAGE_KEY = 'anifilm_watch_history';
const MAX_HISTORY_ITEMS = 100;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function dispatchHistoryUpdatedEvent() {
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('watch-history-updated'));
  }
}

/**
 * Get all watch history items stored on this device.
 * Optionally filter by mediaType ('anime' | 'movie').
 */
export function getWatchHistory(mediaType?: 'anime' | 'movie' | string): WatchProgressItem[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const items: WatchProgressItem[] = JSON.parse(raw);
    if (!Array.isArray(items)) return [];

    const sorted = items.sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    if (mediaType) {
      return sorted.filter((item) => (item.mediaType || 'anime') === mediaType);
    }

    return sorted;
  } catch (error) {
    console.error('[historyStorage] Failed to read watch history from localStorage:', error);
    return [];
  }
}

/**
 * Save or update watch progress for a specific episode or movie on this device.
 */
export function saveWatchProgress(
  input: Omit<WatchProgressItem, 'id' | 'updatedAt'> & { id?: string; mediaType?: 'anime' | 'movie' }
): WatchProgressItem {
  if (!isBrowser()) {
    return {
      ...input,
      id: input.id || `${input.animeId}_${input.episodeId}`,
      mediaType: input.mediaType || 'anime',
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const all = getWatchHistory();
    const existingIndex = all.findIndex(
      (item) => item.animeId === input.animeId && item.episodeId === input.episodeId
    );

    const now = new Date().toISOString();
    const resolvedItem: WatchProgressItem = {
      id: input.id || (existingIndex >= 0 ? all[existingIndex].id : `${input.animeId}_${input.episodeId}`),
      mediaType: input.mediaType || (existingIndex >= 0 ? all[existingIndex].mediaType : 'anime') || 'anime',
      animeId: input.animeId,
      animeTitle: input.animeTitle || (existingIndex >= 0 ? all[existingIndex].animeTitle : 'Media'),
      poster: input.poster || (existingIndex >= 0 ? all[existingIndex].poster : ''),
      episodeId: input.episodeId,
      episodeTitle: input.episodeTitle || (existingIndex >= 0 ? all[existingIndex].episodeTitle : 'Episode'),
      progressSeconds: Number(input.progressSeconds || 0),
      durationSeconds: Number(input.durationSeconds || 0),
      completed: Boolean(input.completed),
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = resolvedItem;
    } else {
      all.unshift(resolvedItem);
    }

    // Limit stored history length to prevent excessive localStorage usage
    const trimmed = all.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    dispatchHistoryUpdatedEvent();

    return resolvedItem;
  } catch (error) {
    console.error('[historyStorage] Failed to save watch progress to localStorage:', error);
    return {
      ...input,
      id: input.id || `${input.animeId}_${input.episodeId}`,
      mediaType: input.mediaType || 'anime',
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get watch progress for a specific anime/movie and episode on this device.
 * If episodeId is omitted, returns the latest watched episode for that anime.
 */
export function getWatchProgress(animeId: string, episodeId?: string): WatchProgressItem | null {
  if (!isBrowser() || !animeId) return null;

  const all = getWatchHistory();
  if (episodeId) {
    return all.find((item) => item.animeId === animeId && item.episodeId === episodeId) || null;
  }

  return all.find((item) => item.animeId === animeId) || null;
}

/**
 * Remove a single history item by id on this device.
 */
export function removeWatchHistoryItem(id: string): void {
  if (!isBrowser() || !id) return;

  try {
    const all = getWatchHistory();
    const filtered = all.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    dispatchHistoryUpdatedEvent();
  } catch (error) {
    console.error('[historyStorage] Failed to remove watch history item:', error);
  }
}

/**
 * Clear all watch history items on this device.
 * Optionally filter by mediaType ('anime' | 'movie').
 */
export function clearWatchHistory(mediaType?: 'anime' | 'movie' | string): void {
  if (!isBrowser()) return;

  try {
    if (!mediaType) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      const all = getWatchHistory();
      const remaining = all.filter((item) => (item.mediaType || 'anime') !== mediaType);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }
    dispatchHistoryUpdatedEvent();
  } catch (error) {
    console.error('[historyStorage] Failed to clear watch history:', error);
  }
}
