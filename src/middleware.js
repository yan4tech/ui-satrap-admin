import { NextResponse } from 'next/server';

const NO_STORE = 'no-store, no-cache, must-revalidate';

function withNoStore(response) {
  response.headers.set('Cache-Control', NO_STORE);
  response.headers.set('Pragma', 'no-cache');
  return response;
}

/**
 * Next.js trailingSlash + rewrites: strip trailing slash from /api/* before proxy.
 * Cache-Control prevents Chrome from caching old 301/308/404 API responses.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') && pathname.length > '/api/'.length && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/+$/, '');
    return withNoStore(NextResponse.rewrite(url));
  }

  if (pathname.startsWith('/api/')) {
    return withNoStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
