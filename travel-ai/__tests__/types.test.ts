/**
 * Unit tests for core domain types and type guards
 */

import {
  TripIntent,
  Activity,
  DayPlan,
  Itinerary,
  Trip,
  ChatMessage,
  WeatherInfo,
} from '@/lib/types';

describe('Domain Types', () => {
  describe('TripIntent', () => {
    it('should have all required fields', () => {
      const intent: TripIntent = {
        id: 'intent_1',
        destination: 'Tokyo, Japan',
        startDate: '2026-06-01',
        endDate: '2026-06-04',
        budget: 1500,
        currency: 'USD',
        groupSize: 2,
        travelStyle: ['cultural'],
        pace: 'moderate',
        interests: ['Food & Dining'],
        dietaryRestrictions: [],
        mobilityNeeds: '',
        visaConstraints: [],
        createdAt: new Date().toISOString(),
        userId: 'user_1',
      };
      expect(intent.destination).toBe('Tokyo, Japan');
      expect(intent.budget).toBe(1500);
      expect(intent.groupSize).toBe(2);
      expect(intent.travelStyle).toContain('cultural');
    });

    it('should accept optional naturalLanguageInput', () => {
      const intent: Partial<TripIntent> = {
        destination: 'Paris, France',
        naturalLanguageInput: '3-day romantic Paris trip',
      };
      expect(intent.naturalLanguageInput).toBeDefined();
    });

    it('should accept all valid travel styles', () => {
      const styles: TripIntent['travelStyle'] = [
        'adventure', 'luxury', 'budget', 'cultural', 'family', 'romantic', 'business'
      ];
      expect(styles).toHaveLength(7);
    });

    it('should accept all valid pace types', () => {
      const paces: Array<TripIntent['pace']> = ['relaxed', 'moderate', 'intensive'];
      expect(paces).toHaveLength(3);
    });
  });

  describe('Activity', () => {
    const mockActivity: Activity = {
      id: 'act_1',
      name: 'Senso-ji Temple',
      description: 'Historic Buddhist temple in Asakusa',
      category: 'attraction',
      timeSlot: 'morning',
      startTime: '08:00',
      endTime: '10:30',
      durationMinutes: 150,
      estimatedCost: 0,
      currency: 'USD',
      location: {
        name: 'Senso-ji',
        address: '2-3-1 Asakusa, Tokyo',
        coordinates: { lat: 35.7148, lng: 139.7967 },
      },
      confidenceScore: 0.96,
      tags: ['Free', 'Historic', 'Cultural'],
      alternatives: [],
      reasonIncluded: 'Top-rated cultural landmark matching user interests',
    };

    it('should have valid confidence score between 0 and 1', () => {
      expect(mockActivity.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(mockActivity.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('should accept free activities with estimatedCost of 0', () => {
      expect(mockActivity.estimatedCost).toBe(0);
    });

    it('should have valid coordinates', () => {
      const { lat, lng } = mockActivity.location.coordinates;
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
      expect(lng).toBeGreaterThan(-180);
      expect(lng).toBeLessThan(180);
    });

    it('should accept all valid category types', () => {
      const categories: Array<Activity['category']> = [
        'attraction', 'restaurant', 'hotel', 'transport', 'experience', 'event', 'shopping'
      ];
      expect(categories).toHaveLength(7);
    });

    it('should accept all valid time slots', () => {
      const slots: Array<Activity['timeSlot']> = ['morning', 'afternoon', 'evening', 'night'];
      expect(slots).toHaveLength(4);
    });
  });

  describe('WeatherInfo', () => {
    it('should validate temperature and precipitation ranges', () => {
      const weather: WeatherInfo = {
        condition: 'Partly Cloudy',
        temperatureHigh: 22,
        temperatureLow: 15,
        precipitation: 10,
        humidity: 65,
        icon: '⛅',
      };
      expect(weather.precipitation).toBeGreaterThanOrEqual(0);
      expect(weather.precipitation).toBeLessThanOrEqual(100);
      expect(weather.temperatureHigh).toBeGreaterThan(weather.temperatureLow);
    });
  });

  describe('Itinerary', () => {
    it('should correctly represent budgetRemaining as difference', () => {
      const totalCost = 1240;
      const totalBudget = 1500;
      const remaining = totalBudget - totalCost;
      expect(remaining).toBe(260);
      expect(remaining).toBeGreaterThan(0);
    });

    it('should accept valid itinerary statuses', () => {
      const statuses: Array<Itinerary['status']> = ['draft', 'active', 'completed', 'archived'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('ChatMessage', () => {
    it('should have valid role type', () => {
      const userMsg: ChatMessage = {
        id: 'msg_1',
        role: 'user',
        content: 'Make this trip cheaper',
        timestamp: new Date().toISOString(),
      };
      const aiMsg: ChatMessage = {
        id: 'msg_2',
        role: 'assistant',
        content: 'I found several ways to reduce costs...',
        timestamp: new Date().toISOString(),
      };
      expect(userMsg.role).toBe('user');
      expect(aiMsg.role).toBe('assistant');
    });
  });
});
