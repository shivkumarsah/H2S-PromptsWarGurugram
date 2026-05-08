/**
 * Pure utility functions for security — no Next.js dependencies.
 * Can be tested in Node.js without jsdom.
 */

// ================================================================
// Rate limiting store (in-memory; use Redis in production)
// ================================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

export function getRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

// ================================================================
// Input sanitization
// ================================================================
export function sanitizeString(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeNumber(input: unknown, min: number, max: number, defaultVal: number): number {
  if (input === null || input === undefined) return defaultVal;
  const n = Number(input);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

// ================================================================
// Request validators
// ================================================================
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreateTripRequest(body: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (body.budget !== undefined) {
    const budget = Number(body.budget);
    if (isNaN(budget) || budget < 0) errors.push('Budget must be a positive number');
    if (budget > 1_000_000) errors.push('Budget exceeds maximum allowed value');
  }

  if (body.groupSize !== undefined) {
    const size = Number(body.groupSize);
    if (isNaN(size) || size < 1 || size > 100) errors.push('Group size must be between 1 and 100');
  }

  if (body.startDate && body.endDate) {
    const start = new Date(body.startDate as string);
    const end = new Date(body.endDate as string);
    if (isNaN(start.getTime())) errors.push('Invalid startDate');
    if (isNaN(end.getTime())) errors.push('Invalid endDate');
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
      errors.push('startDate must be before endDate');
    }
  }

  if (body.naturalLanguageInput) {
    const nl = sanitizeString(body.naturalLanguageInput, 500);
    if (nl.length === 0) errors.push('naturalLanguageInput cannot be empty after sanitization');
  }

  if (body.destination) {
    const dest = sanitizeString(body.destination, 200);
    if (dest.length === 0) errors.push('destination cannot be empty');
  }

  return { valid: errors.length === 0, errors };
}

export function validateChatRequest(body: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!body.message || typeof body.message !== 'string') {
    errors.push('message is required and must be a string');
  } else {
    const msg = sanitizeString(body.message, 1000);
    if (msg.length === 0) errors.push('message cannot be empty after sanitization');
  }

  if (!body.tripId || typeof body.tripId !== 'string') {
    errors.push('tripId is required');
  }

  return { valid: errors.length === 0, errors };
}
