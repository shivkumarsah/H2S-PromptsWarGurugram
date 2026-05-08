/**
 * Security middleware unit tests
 * Tests pure utility functions: sanitization, validation, rate limiting
 */

import {
  sanitizeString,
  sanitizeNumber,
  validateCreateTripRequest,
  validateChatRequest,
  getRateLimit,
} from '@/lib/security';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should strip XSS script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should strip javascript: URIs', () => {
      const malicious = 'javascript:alert(1)';
      expect(sanitizeString(malicious)).not.toContain('javascript:');
    });

    it('should strip inline event handlers', () => {
      const malicious = 'click me onclick=alert(1)';
      expect(sanitizeString(malicious)).not.toMatch(/onclick=/i);
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should enforce maxLength', () => {
      const long = 'a'.repeat(5000);
      expect(sanitizeString(long, 100)).toHaveLength(100);
    });

    it('should return empty string for non-string inputs', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString({})).toBe('');
    });

    it('should preserve safe content', () => {
      const safe = '3-day trip to Tokyo under $1500';
      expect(sanitizeString(safe)).toBe(safe);
    });
  });

  describe('sanitizeNumber', () => {
    it('should clamp values to min/max range', () => {
      expect(sanitizeNumber(5000, 0, 1000, 500)).toBe(1000);
      expect(sanitizeNumber(-100, 0, 1000, 500)).toBe(0);
    });

    it('should return default for NaN inputs', () => {
      expect(sanitizeNumber('abc', 0, 1000, 500)).toBe(500);
      expect(sanitizeNumber(null, 0, 1000, 500)).toBe(500);
    });

    it('should accept valid values within range', () => {
      expect(sanitizeNumber(750, 0, 1000, 500)).toBe(750);
    });

    it('should handle string numbers', () => {
      expect(sanitizeNumber('500', 0, 1000, 0)).toBe(500);
    });
  });
});

describe('Request Validation', () => {
  describe('validateCreateTripRequest', () => {
    it('should pass valid request', () => {
      const result = validateCreateTripRequest({
        destination: 'Tokyo, Japan',
        budget: 1500,
        groupSize: 2,
        startDate: '2026-06-01',
        endDate: '2026-06-04',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative budget', () => {
      const result = validateCreateTripRequest({ budget: -500 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('budget'))).toBe(true);
    });

    it('should reject group size of 0', () => {
      const result = validateCreateTripRequest({ groupSize: 0 });
      expect(result.valid).toBe(false);
    });

    it('should reject group size > 100', () => {
      const result = validateCreateTripRequest({ groupSize: 101 });
      expect(result.valid).toBe(false);
    });

    it('should reject startDate after endDate', () => {
      const result = validateCreateTripRequest({
        startDate: '2026-06-10',
        endDate: '2026-06-01',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('date'))).toBe(true);
    });

    it('should reject invalid date formats', () => {
      const result = validateCreateTripRequest({
        startDate: 'not-a-date',
        endDate: '2026-06-04',
      });
      expect(result.valid).toBe(false);
    });

    it('should accept requests without optional fields', () => {
      const result = validateCreateTripRequest({});
      expect(result.valid).toBe(true);
    });

    it('should reject extremely large budgets', () => {
      const result = validateCreateTripRequest({ budget: 2_000_000 });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateChatRequest', () => {
    it('should pass valid request', () => {
      const result = validateChatRequest({
        tripId: 'trip_123',
        message: 'Make this trip cheaper',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject missing message', () => {
      const result = validateChatRequest({ tripId: 'trip_123' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('message'))).toBe(true);
    });

    it('should reject missing tripId', () => {
      const result = validateChatRequest({ message: 'Hello' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('tripid'))).toBe(true);
    });

    it('should reject non-string message', () => {
      const result = validateChatRequest({ tripId: 'trip_123', message: 123 });
      expect(result.valid).toBe(false);
    });
  });
});

describe('Rate Limiting', () => {
  const TEST_IP = '192.0.2.1';
  const UNIQUE_IP = `192.0.2.${Date.now() % 254}`;

  it('should allow first request', () => {
    const result = getRateLimit(UNIQUE_IP);
    expect(result.allowed).toBe(true);
  });

  it('should decrement remaining on each request', () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 254)}`;
    const r1 = getRateLimit(ip);
    const r2 = getRateLimit(ip);
    expect(r2.remaining).toBeLessThan(r1.remaining);
  });

  it('should return allowed:false after limit exceeded', () => {
    const ip = `172.16.0.${Math.floor(Math.random() * 254)}`;
    // Exhaust limit (30 requests)
    for (let i = 0; i < 30; i++) {
      getRateLimit(ip);
    }
    const result = getRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should provide resetAt timestamp in the future', () => {
    const ip = `172.17.0.${Math.floor(Math.random() * 254)}`;
    const result = getRateLimit(ip);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('should treat different IPs independently', () => {
    const ip1 = '10.1.1.1';
    const ip2 = '10.1.1.2';
    // Exhaust ip1
    for (let i = 0; i < 30; i++) getRateLimit(ip1);
    const blocked = getRateLimit(ip1);
    const allowed = getRateLimit(ip2);
    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });
});
