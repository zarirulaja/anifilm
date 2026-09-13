import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const urlStr = request.nextUrl.searchParams.get('url');
    if (!urlStr) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    const targetUrl = new URL(urlStr);

    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': targetUrl.origin + '/',
      },
    });

    const contentType = res.headers.get('content-type') || '';

    let body: ArrayBuffer | string;
    if (contentType.includes('text/html')) {
      let text = await res.text();
      const baseTag = `<base href="${targetUrl.origin}/">`;
      if (text.includes('<head>')) {
        text = text.replace('<head>', `<head>${baseTag}`);
      } else if (text.includes('<HEAD>')) {
        text = text.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        text = baseTag + text;
      }
      body = text;
    } else {
      body = await res.arrayBuffer();
    }

    const headers = new Headers();

    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'x-frame-options' &&
        lowerKey !== 'content-security-policy' &&
        lowerKey !== 'frame-options'
      ) {
        headers.set(key, value);
      }
    });

    headers.set('Access-Control-Allow-Origin', '*');
    headers.delete('X-Frame-Options');
    headers.delete('Content-Security-Policy');

    return new NextResponse(body, {
      status: res.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy stream error:', error);
    return new NextResponse('Gagal memuat proxy stream', { status: 500 });
  }
}
