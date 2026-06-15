import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side audio proxy to bypass browser CORS restrictions.
 * The browser fetches from the same origin (/api/proxy-audio?url=...),
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
    const upstream = await fetch(url, {
      headers: {
        // Forward range headers if present (for partial content / seeking)
        ...(request.headers.get('range') ? { Range: request.headers.get('range')! } : {}),
      },
      // No cache — we want fresh content for download
      cache: 'no-store',
    });

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const contentLength = upstream.headers.get('content-length');

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    if (upstream.status === 206) {
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) responseHeaders['Content-Range'] = contentRange;
    }

    // Stream the body directly back to the browser
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[proxy-audio] Error fetching URL:', url, error.message);
    return NextResponse.json(
      { error: `Proxy failed: ${error.message}` },
      { status: 500 }
    );
  }
}
