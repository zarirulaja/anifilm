export interface ResolvedStream {
  url: string;
  isIframe: boolean;
  type?: 'direct' | 'iframe';
}

/**
 * Resolves a raw stream or embed URL into a direct playable stream or embed URL.
 * Attempts server-side extraction of Google Video / Blogger sources from wrapper hosts
 * when accessible, and falls back safely to the raw embed URL.
 */
export async function resolveStreamSource(rawUrl: string): Promise<ResolvedStream> {
  if (!rawUrl) {
    return { url: '', isIframe: true, type: 'iframe' };
  }

  // 1. Direct Blogger embed
  if (rawUrl.includes('blogger.com/video.g')) {
    return { url: rawUrl, isIframe: true, type: 'iframe' };
  }

  // 2. Direct video files
  if (
    rawUrl.includes('googlevideo.com/videoplayback') ||
    rawUrl.endsWith('.mp4') ||
    rawUrl.endsWith('.m3u8')
  ) {
    return { url: rawUrl, isIframe: false, type: 'direct' };
  }

  // 3. Unpack desustream.net (ondesuhd, ondesu, odstream)
  if (rawUrl.includes('desustream.net') || rawUrl.includes('desustream')) {
    try {
      const res = await fetch(rawUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Referer: 'https://otakudesu.blog/',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const html = await res.text();

        // Check for direct Google Video source
        const sourceMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i);
        if (sourceMatch && sourceMatch[1]) {
          return { url: sourceMatch[1], isIframe: false, type: 'direct' };
        }

        // Check for Blogger video iframe
        const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        if (iframeMatch && iframeMatch[1]) {
          return { url: iframeMatch[1], isIframe: true, type: 'iframe' };
        }

        // Check for video tag src
        const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
        if (videoMatch && videoMatch[1]) {
          return { url: videoMatch[1], isIframe: false, type: 'direct' };
        }

        // Check for Playerjs / JS file declaration
        const fileMatch = html.match(/(?:file|source|src):\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/i);
        if (fileMatch && fileMatch[1]) {
          return { url: fileMatch[1], isIframe: false, type: 'direct' };
        }
      }
    } catch (err) {
      console.warn('Failed to resolve desustream URL:', err);
    }

    // Return original raw URL as fallback
    return {
      url: rawUrl,
      isIframe: true,
      type: 'iframe',
    };
  }

  // Default: Return as iframe
  return { url: rawUrl, isIframe: true, type: 'iframe' };
}
