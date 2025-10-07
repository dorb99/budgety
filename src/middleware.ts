import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/budgets') || pathname.startsWith('/summary')) {
    try {
      const session = await getIronSession<SessionData>(request, NextResponse, sessionOptions);
      
      if (!session.isLoggedIn || !session.userId) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
