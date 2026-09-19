import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(urlParam, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://otakudesu.blog/',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch upstream: ${res.statusText}`, {
        status: res.status,
      });
    }

    let html = await res.text();

    // Ensure relative paths (css, js, images) resolve properly to upstream origin
    try {
      const parsedUrl = new URL(urlParam);
      const origin = parsedUrl.origin;
      if (!html.includes('<base ')) {
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head><base href="${origin}/">`);
        } else if (html.includes('<HEAD>')) {
          html = html.replace('<HEAD>', `<HEAD><base href="${origin}/">`);
        }
      }
    } catch {
      // URL parsing failed, proceed with raw html
    }

    // Return HTML with stripped/overridden CSP frame-ancestors & X-Frame-Options
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors * 'self'",
      },
    });
  } catch (error: any) {
    console.error('Embed proxy error:', error);
    return new NextResponse('Failed to load proxy embed: ' + (error?.message || ''), {
      status: 500,
    });
  }
}
