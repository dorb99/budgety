import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    // Rate limiting
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimitKey = `${clientIp}-${userId}`;
    
    const rateLimit = rateLimitMap.get(rateLimitKey);
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
          return NextResponse.json(
            { error: 'Too many attempts. Please try again later.' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        rateLimitMap.delete(rateLimitKey);
      }
    } else {
      rateLimitMap.set(rateLimitKey, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
    }

    // Validate auth code
    const authCode = process.env.AUTH_CODE;
    if (authCode !== code || (userId !== 'owner' && userId !== 'partner')) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getIronSession<SessionData>(request, NextResponse, sessionOptions);
    session.userId = userId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
