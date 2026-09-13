import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const urlStr = request.nextUrl.searchParams.get('url');
    if (!urlStr) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Fetch the target stream URL with appropriate headers
    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://tv12.lk21official.cc/',
      },
    });

    const body = await res.arrayBuffer();
    const headers = new Headers();

    // Copy original headers EXCEPT frame restriction headers
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

    // Explicitly allow embedding from any origin
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
