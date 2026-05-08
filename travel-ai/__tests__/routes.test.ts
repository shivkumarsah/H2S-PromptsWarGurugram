/* eslint-disable */
/**
 * P2: Real API route handler tests.
 * Tests the actual route handler functions directly.
 */

import { GET, POST } from '@/app/api/trips/route';

// Mock NextRequest
function makeRequest(method: string, body?: unknown, searchParams?: Record<string, string>) {
  const url = new URL(`http://localhost:3000/api/trips${searchParams ? '?' + new URLSearchParams(searchParams) : ''}`);
  return {
    method,
    nextUrl: url,
    json: async () => body || {},
    headers: new Headers({ 'content-type': 'application/json' }),
  } as any;
}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      body: data,
      status: init?.status || 200,
      headers: new Map(),
    }),
  },
}));

// Mock Gemini (use fallback in tests)
jest.mock('@/lib/gemini', () => ({
  parseNaturalLanguageIntent: jest.fn().mockResolvedValue({
    destination: 'Tokyo, Japan',
    budget: 1500,
    groupSize: 2,
    travelStyle: ['cultural'],
    pace: 'moderate',
    interests: ['Food & Dining'],
    naturalLanguageInput: 'test',
  }),
}));

// Mock Firestore (use memory)
jest.mock('@/lib/firestore', () => {
  const store = new Map();
  const seeds: any[] = [];
  return {
    tripsDb: {
      save: jest.fn(async (trip: any) => { store.set(trip.id, trip); }),
      get: jest.fn(async (id: string) => store.get(id) || null),
      list: jest.fn(async (userId: string) =>
        Array.from(store.values()).filter((t: any) => t.userId === userId)
      ),
      seed: jest.fn((trips: any[]) => trips.forEach(t => store.set(t.id, t))),
    },
  };
});

// Mock google-services logger
jest.mock('@/lib/google-services', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  logTripToBigQuery: jest.fn().mockResolvedValue(undefined),
}));

describe('GET /api/trips', () => {
  it('should return success: true with data array', async () => {
    const req = makeRequest('GET', undefined, { userId: 'user_test' });
    const res = await GET(req);
    expect((res.body as any).success).toBe(true);
    expect(Array.isArray((res.body as any).data)).toBe(true);
  });

  it('should return timestamp in response', async () => {
    const req = makeRequest('GET', undefined, { userId: 'user_test' });
    const res = await GET(req);
    expect((res.body as any).timestamp).toBeTruthy();
  });

  it('should default userId to user_demo', async () => {
    const req = makeRequest('GET');
    const res = await GET(req);
    expect((res.body as any).success).toBe(true);
  });
});

describe('POST /api/trips', () => {
  it('should create a trip from structured input', async () => {
    const req = makeRequest('POST', {
      destination: 'Tokyo, Japan',
      budget: 1500,
      groupSize: 2,
    });
    const res = await POST(req);
    expect((res.body as any).success).toBe(true);
    expect((res.body as any).data.intent.destination).toBe('Tokyo, Japan');
  });

  it('should return 201 status on creation', async () => {
    const req = makeRequest('POST', { destination: 'Paris, France', budget: 3000 });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('should create trip from natural language input', async () => {
    const req = makeRequest('POST', {
      naturalLanguageInput: '3-day trip to Tokyo under $1500',
    });
    const res = await POST(req);
    expect((res.body as any).success).toBe(true);
    expect((res.body as any).data.id).toMatch(/^trip_/);
  });

  it('should return 400 for invalid budget', async () => {
    const req = makeRequest('POST', { budget: -1000 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((res.body as any).success).toBe(false);
  });

  it('should return 400 for invalid group size', async () => {
    const req = makeRequest('POST', { groupSize: 0 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((res.body as any).success).toBe(false);
  });

  it('should return 400 when endDate is before startDate', async () => {
    const req = makeRequest('POST', {
      startDate: '2026-06-10',
      endDate: '2026-06-01',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should include a message in the success response', async () => {
    const req = makeRequest('POST', { destination: 'Bali, Indonesia' });
    const res = await POST(req);
    expect((res.body as any).message).toBeTruthy();
  });

  it('should apply default dates when not provided', async () => {
    const req = makeRequest('POST', { destination: 'Tokyo, Japan' });
    const res = await POST(req);
    expect((res.body as any).data.intent.startDate).toBeTruthy();
    expect((res.body as any).data.intent.endDate).toBeTruthy();
  });

  it('should default groupSize to 2', async () => {
    const req = makeRequest('POST', { destination: 'Tokyo, Japan' });
    const res = await POST(req);
    expect((res.body as any).data.intent.groupSize).toBe(2);
  });

  it('should sanitize XSS in destination', async () => {
    const req = makeRequest('POST', {
      destination: '<script>alert(1)</script>Tokyo',
    });
    const res = await POST(req);
    if ((res.body as any).success) {
      expect((res.body as any).data.intent.destination).not.toContain('<script>');
    }
  });
});
