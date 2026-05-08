/**
 * Tests for Gemini client — demo/fallback mode behavior
 * P2: Validates that parseNaturalLanguageIntent returns fallback
 *     result without calling the Gemini SDK when no API key is set.
 */

// Ensure demo mode (no API key)
const originalEnv = process.env.GEMINI_API_KEY;
beforeAll(() => { delete process.env.GEMINI_API_KEY; });
afterAll(() => {
  if (originalEnv) process.env.GEMINI_API_KEY = originalEnv;
});

// Mock the Gemini SDK (should NOT be called in demo mode)
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockRejectedValue(new Error('Should not call Gemini in demo mode')),
    }),
  })),
}));

import { parseNaturalLanguageIntent } from '@/lib/gemini';

describe('Gemini Client — Demo Mode', () => {
  describe('parseNaturalLanguageIntent (fallback)', () => {
    it('should return a valid TripIntent without calling Gemini SDK', async () => {
      const result = await parseNaturalLanguageIntent('3-day trip to Tokyo under $1500');
      expect(result).toBeDefined();
      expect(result.destination).toBeTruthy();
    });

    it('should extract budget from natural language', async () => {
      const result = await parseNaturalLanguageIntent('Weekend trip under $800');
      expect(result.budget).toBe(800);
    });

    it('should extract Tokyo as destination', async () => {
      const result = await parseNaturalLanguageIntent('3-day trip to Tokyo');
      expect(result.destination?.toLowerCase()).toContain('tokyo');
    });

    it('should extract Paris as destination', async () => {
      const result = await parseNaturalLanguageIntent('Romantic trip to Paris');
      expect(result.destination?.toLowerCase()).toContain('paris');
    });

    it('should detect family travel style', async () => {
      const result = await parseNaturalLanguageIntent('Family trip to Bali with kids');
      expect(result.travelStyle).toContain('family');
    });

    it('should detect luxury travel style', async () => {
      const result = await parseNaturalLanguageIntent('Luxury honeymoon trip');
      expect(result.travelStyle).toContain('luxury');
    });

    it('should return moderate pace by default', async () => {
      const result = await parseNaturalLanguageIntent('Trip to Tokyo');
      expect(result.pace).toBe('moderate');
    });

    it('should detect relaxed pace', async () => {
      const result = await parseNaturalLanguageIntent('Relaxed 5-day trip to Kyoto');
      expect(result.pace).toBe('relaxed');
    });

    it('should extract food interests', async () => {
      const result = await parseNaturalLanguageIntent('Food lover trip to Tokyo with great dining');
      expect(result.interests).toContain('Food & Dining');
    });

    it('should extract cultural interests', async () => {
      const result = await parseNaturalLanguageIntent('Cultural tour with museums and history');
      expect(result.interests).toContain('History & Culture');
    });

    it('should always return naturalLanguageInput', async () => {
      const input = 'Any trip description';
      const result = await parseNaturalLanguageIntent(input);
      expect(result.naturalLanguageInput).toBe(input);
    });

    it('should handle empty string gracefully', async () => {
      const result = await parseNaturalLanguageIntent('');
      expect(result).toBeDefined();
      expect(result.destination).toBeTruthy();
    });

    it('should handle very long input gracefully', async () => {
      const longInput = 'trip '.repeat(100) + 'to Tokyo';
      const result = await parseNaturalLanguageIntent(longInput);
      expect(result).toBeDefined();
    });
  });
});
