/**
 * Next.js middleware helpers — security headers and rate limiting for API routes.
 * Kept separate from security.ts so pure functions can be tested without Next.js.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRateLimit } from './security';

const RATE_LIMIT_MAX = 30;

export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

export function withRateLimit(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const { allowed, remaining, resetAt } = getRateLimit(ip);

  if (!allowed) {
    const res = NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please try again later.', timestamp: new Date().toISOString() },
      { status: 429 }
    );
    res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    res.headers.set('X-RateLimit-Remaining', '0');
    res.headers.set('X-RateLimit-Reset', String(resetAt));
    res.headers.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));
    return Promise.resolve(withSecurityHeaders(res));
  }

  return handler().then(res => {
    res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    res.headers.set('X-RateLimit-Reset', String(resetAt));
    return withSecurityHeaders(res);
  });
}
