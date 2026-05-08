/**
 * Unit tests for seed data integrity
 */

import {
  SAMPLE_DESTINATIONS,
  INTEREST_OPTIONS,
  TRAVEL_STYLES_META,
  TOKYO_SAMPLE_TRIP,
  SAMPLE_TRIPS,
  DEMO_CHAT_SUGGESTIONS,
} from '@/lib/seed-data';

describe('Seed Data', () => {
  describe('SAMPLE_DESTINATIONS', () => {
    it('should contain at least 10 destinations', () => {
      expect(SAMPLE_DESTINATIONS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have destinations as non-empty strings', () => {
      SAMPLE_DESTINATIONS.forEach(dest => {
        expect(dest.length).toBeGreaterThan(0);
        expect(typeof dest).toBe('string');
      });
    });

    it('should include Tokyo and Paris', () => {
      expect(SAMPLE_DESTINATIONS).toContain('Tokyo, Japan');
      expect(SAMPLE_DESTINATIONS).toContain('Paris, France');
    });
  });

  describe('INTEREST_OPTIONS', () => {
    it('should contain at least 10 interest categories', () => {
      expect(INTEREST_OPTIONS.length).toBeGreaterThanOrEqual(10);
    });

    it('should include core travel interests', () => {
      expect(INTEREST_OPTIONS).toContain('Food & Dining');
      expect(INTEREST_OPTIONS).toContain('History & Culture');
    });

    it('should have no duplicate entries', () => {
      const unique = new Set(INTEREST_OPTIONS);
      expect(unique.size).toBe(INTEREST_OPTIONS.length);
    });
  });

  describe('TRAVEL_STYLES_META', () => {
    it('should define all 7 travel styles', () => {
      const styles = Object.keys(TRAVEL_STYLES_META);
      expect(styles).toContain('adventure');
      expect(styles).toContain('luxury');
      expect(styles).toContain('budget');
      expect(styles).toContain('cultural');
      expect(styles).toContain('family');
      expect(styles).toContain('romantic');
      expect(styles).toContain('business');
    });

    it('should have label, icon, and color for each style', () => {
      Object.values(TRAVEL_STYLES_META).forEach(meta => {
        expect(meta.label).toBeTruthy();
        expect(meta.icon).toBeTruthy();
        expect(meta.color).toBeTruthy();
      });
    });
  });

  describe('TOKYO_SAMPLE_TRIP', () => {
    it('should have a valid trip structure', () => {
      expect(TOKYO_SAMPLE_TRIP.id).toBeTruthy();
      expect(TOKYO_SAMPLE_TRIP.intent).toBeDefined();
      expect(TOKYO_SAMPLE_TRIP.itinerary).toBeDefined();
    });

    it('should have Tokyo as the destination', () => {
      expect(TOKYO_SAMPLE_TRIP.intent.destination).toContain('Tokyo');
    });

    it('should have exactly 3 days in the itinerary', () => {
      expect(TOKYO_SAMPLE_TRIP.itinerary!.days).toHaveLength(3);
    });

    it('should have a positive total estimated cost', () => {
      expect(TOKYO_SAMPLE_TRIP.itinerary!.totalEstimatedCost).toBeGreaterThan(0);
    });

    it('should have a budget remaining within expected range', () => {
      const { totalEstimatedCost, budgetRemaining } = TOKYO_SAMPLE_TRIP.itinerary!;
      const budget = TOKYO_SAMPLE_TRIP.intent.budget;
      expect(totalEstimatedCost + budgetRemaining).toBe(budget);
    });

    it('should have all activities with valid confidence scores', () => {
      TOKYO_SAMPLE_TRIP.itinerary!.days.forEach(day => {
        day.activities.forEach(activity => {
          expect(activity.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(activity.confidenceScore).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should have activities with non-empty names and descriptions', () => {
      TOKYO_SAMPLE_TRIP.itinerary!.days.forEach(day => {
        day.activities.forEach(activity => {
          expect(activity.name.length).toBeGreaterThan(0);
          expect(activity.description.length).toBeGreaterThan(0);
          expect(activity.reasonIncluded.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have activities with valid coordinates', () => {
      TOKYO_SAMPLE_TRIP.itinerary!.days.forEach(day => {
        day.activities.forEach(activity => {
          const { lat, lng } = activity.location.coordinates;
          // Tokyo coordinates sanity check
          expect(lat).toBeGreaterThan(35);
          expect(lat).toBeLessThan(36);
          expect(lng).toBeGreaterThan(139);
          expect(lng).toBeLessThan(141);
        });
      });
    });

    it('should have an optimization score between 0 and 100', () => {
      const score = TOKYO_SAMPLE_TRIP.itinerary!.optimizationScore;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should have adaptation log entries', () => {
      expect(TOKYO_SAMPLE_TRIP.itinerary!.adaptationLog.length).toBeGreaterThan(0);
    });

    it('each adaptation log entry should have required fields', () => {
      TOKYO_SAMPLE_TRIP.itinerary!.adaptationLog.forEach(entry => {
        expect(entry.id).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(['minor', 'moderate', 'major']).toContain(entry.impact);
        expect(['weather', 'user-request', 'closure', 'delay', 'preference-change', 'budget']).toContain(entry.trigger);
      });
    });

    it('each day should have a theme and summary', () => {
      TOKYO_SAMPLE_TRIP.itinerary!.days.forEach(day => {
        expect(day.theme.length).toBeGreaterThan(0);
        expect(day.summary.length).toBeGreaterThan(0);
        expect(day.dayNumber).toBeGreaterThan(0);
      });
    });

    it('each day should have positive total cost and distance', () => {
      TOKYO_SAMPLE_TRIP.itinerary!.days.forEach(day => {
        expect(day.totalCost).toBeGreaterThanOrEqual(0);
        expect(day.totalDistance).toBeGreaterThanOrEqual(0);
        expect(day.totalTravelTime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('SAMPLE_TRIPS', () => {
    it('should contain at least 2 sample trips', () => {
      expect(SAMPLE_TRIPS.length).toBeGreaterThanOrEqual(2);
    });

    it('all trips should have valid status values', () => {
      const validStatuses = ['planning', 'confirmed', 'active', 'completed', 'cancelled'];
      SAMPLE_TRIPS.forEach(trip => {
        expect(validStatuses).toContain(trip.status);
      });
    });

    it('all trips should have unique IDs', () => {
      const ids = SAMPLE_TRIPS.map(t => t.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('DEMO_CHAT_SUGGESTIONS', () => {
    it('should have at least 5 suggestions', () => {
      expect(DEMO_CHAT_SUGGESTIONS.length).toBeGreaterThanOrEqual(5);
    });

    it('should be non-empty strings', () => {
      DEMO_CHAT_SUGGESTIONS.forEach(s => {
        expect(typeof s).toBe('string');
        expect(s.length).toBeGreaterThan(0);
      });
    });
  });
});
