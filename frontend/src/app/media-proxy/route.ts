import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side audio proxy to bypass browser CORS restrictions.
 * 
 * IMPORTANT: This route must NOT be under /api/ because Nginx on the production
 * server routes /api/* to Laravel (port 8000). This /media-proxy path is handled
 * by the catch-all Nginx rule which proxies to Next.js (port 3000).
 *
 * The browser fetches from the same origin (/media-proxy?url=...),
 * and this route fetches the actual media server-side where CORS does not apply.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Only allow http/https URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid URL scheme' }, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get('range');
    const upstream = await fetch(url, {
      headers: {
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
      cache: 'no-store',
    });

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const contentLength = upstream.headers.get('content-length');

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    };
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (upstream.status === 206) {
      const cr = upstream.headers.get('content-range');
      if (cr) responseHeaders['Content-Range'] = cr;
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[media-proxy] Error fetching URL:', url, error.message);
    return NextResponse.json({ error: `Proxy failed: ${error.message}` }, { status: 500 });
  }
}
