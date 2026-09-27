import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min32chars!!'
);

// Routes that are publicly accessible (no session required)
const PUBLIC_PATHS = ['/login'];

// Prefixes that are always public (API auth, static assets, Next internals)
const PUBLIC_PREFIXES = [
  '/api/auth',   // login / register / logout endpoints
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Verify session JWT from cookie
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let valid = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    // Not authenticated → redirect to login, preserving intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
