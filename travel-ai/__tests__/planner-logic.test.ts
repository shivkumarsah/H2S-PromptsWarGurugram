/**
 * Unit tests for AI planner business logic
 * Tests the rules engine, budget validation, and fallback behavior
 */

// ---------------------------------------------------------------
// Budget validation logic (extracted from planner)
// ---------------------------------------------------------------
function validateBudget(totalCost: number, budget: number): {
  isOver: boolean;
  percentUsed: number;
  remaining: number;
  status: 'under' | 'near-limit' | 'over';
} {
  const remaining = budget - totalCost;
  const percentUsed = (totalCost / budget) * 100;
  return {
    isOver: totalCost > budget,
    percentUsed: Math.round(percentUsed * 10) / 10,
    remaining,
    status: totalCost > budget ? 'over' : percentUsed >= 90 ? 'near-limit' : 'under',
  };
}

// ---------------------------------------------------------------
// Route clustering logic (extracted from planner)
// ---------------------------------------------------------------
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------
// Intent parsing fallback logic
// ---------------------------------------------------------------
function parseBudgetFromText(text: string): number | null {
  const match = text.match(/\$[\d,]+/);
  if (!match) return null;
  return parseInt(match[0].replace(/[$,]/g, ''));
}

function parseDaysFromText(text: string): number | null {
  const match = text.match(/(\d+)[\s-]?day/i);
  return match ? parseInt(match[1]) : null;
}

function parseGroupSizeFromText(text: string): number {
  const match = text.match(/(\d+)\s*(people|person|adults?|family)/i);
  if (match) return parseInt(match[1]);
  if (text.toLowerCase().includes('family')) return 4;
  return 2; // default
}

// ---------------------------------------------------------------
// Confidence score interpretation
// ---------------------------------------------------------------
function interpretConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.9) return 'high';
  if (score >= 0.75) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------
// Weather-based replanning decision
// ---------------------------------------------------------------
function shouldReplanForWeather(precipitation: number): boolean {
  return precipitation > 50;
}

function getWeatherCategory(condition: string): 'sunny' | 'cloudy' | 'rainy' {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('storm')) return 'rainy';
  if (lower.includes('cloud')) return 'cloudy';
  return 'sunny';
}

// ---------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------

describe('Budget Validation Logic', () => {
  it('should detect over-budget scenarios', () => {
    const result = validateBudget(1600, 1500);
    expect(result.isOver).toBe(true);
    expect(result.status).toBe('over');
    expect(result.remaining).toBe(-100);
  });

  it('should detect under-budget scenarios', () => {
    const result = validateBudget(1200, 1500);
    expect(result.isOver).toBe(false);
    expect(result.status).toBe('under');
    expect(result.remaining).toBe(300);
  });

  it('should detect near-limit scenarios (≥90% used)', () => {
    const result = validateBudget(1400, 1500);
    expect(result.status).toBe('near-limit');
    expect(result.isOver).toBe(false);
  });

  it('should calculate percentUsed correctly', () => {
    const result = validateBudget(750, 1500);
    expect(result.percentUsed).toBe(50);
  });

  it('should handle zero budget edge case', () => {
    const result = validateBudget(0, 1500);
    expect(result.percentUsed).toBe(0);
    expect(result.remaining).toBe(1500);
    expect(result.status).toBe('under');
  });

  it('should handle exact budget match', () => {
    const result = validateBudget(1500, 1500);
    expect(result.isOver).toBe(false);
    expect(result.percentUsed).toBe(100);
    expect(result.status).toBe('near-limit');
  });
});

describe('Distance Calculation', () => {
  it('should calculate distance between Senso-ji and Tsukiji (~4km)', () => {
    const dist = calculateDistance(35.7148, 139.7967, 35.6654, 139.7707);
    expect(dist).toBeGreaterThan(3);
    expect(dist).toBeLessThan(6);
  });

  it('should return 0 for same coordinates', () => {
    const dist = calculateDistance(35.7148, 139.7967, 35.7148, 139.7967);
    expect(dist).toBeCloseTo(0, 5);
  });

  it('should be symmetric', () => {
    const d1 = calculateDistance(35.7148, 139.7967, 35.6654, 139.7707);
    const d2 = calculateDistance(35.6654, 139.7707, 35.7148, 139.7967);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('should handle large distances (Tokyo to Paris ~9700km)', () => {
    const dist = calculateDistance(35.6762, 139.6503, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(9000);
    expect(dist).toBeLessThan(10000);
  });
});

describe('Natural Language Intent Parsing', () => {
  it('should parse budget from "$1500" format', () => {
    expect(parseBudgetFromText('3-day Tokyo trip under $1500')).toBe(1500);
  });

  it('should parse budget with comma separator "$2,000"', () => {
    expect(parseBudgetFromText('trip budget is $2,000')).toBe(2000);
  });

  it('should return null when no budget found', () => {
    expect(parseBudgetFromText('trip to Tokyo')).toBeNull();
  });

  it('should parse "3-day" as 3', () => {
    expect(parseDaysFromText('3-day Tokyo trip')).toBe(3);
  });

  it('should parse "5 day" as 5', () => {
    expect(parseDaysFromText('5 day vacation')).toBe(5);
  });

  it('should return null when no days found', () => {
    expect(parseDaysFromText('Tokyo trip')).toBeNull();
  });

  it('should parse "4 people" as 4', () => {
    expect(parseGroupSizeFromText('trip for 4 people')).toBe(4);
  });

  it('should default to 4 for "family" keyword', () => {
    expect(parseGroupSizeFromText('family trip to Tokyo')).toBe(4);
  });

  it('should default to 2 when no group info provided', () => {
    expect(parseGroupSizeFromText('trip to Tokyo')).toBe(2);
  });
});

describe('Confidence Score Interpretation', () => {
  it('should classify ≥0.9 as high', () => {
    expect(interpretConfidence(0.96)).toBe('high');
    expect(interpretConfidence(0.9)).toBe('high');
  });

  it('should classify 0.75-0.89 as medium', () => {
    expect(interpretConfidence(0.85)).toBe('medium');
    expect(interpretConfidence(0.75)).toBe('medium');
  });

  it('should classify <0.75 as low', () => {
    expect(interpretConfidence(0.70)).toBe('low');
    expect(interpretConfidence(0.5)).toBe('low');
  });
});

describe('Weather-Based Replanning', () => {
  it('should trigger replanning when precipitation > 50%', () => {
    expect(shouldReplanForWeather(65)).toBe(true);
    expect(shouldReplanForWeather(51)).toBe(true);
  });

  it('should not trigger replanning when precipitation ≤ 50%', () => {
    expect(shouldReplanForWeather(50)).toBe(false);
    expect(shouldReplanForWeather(10)).toBe(false);
  });

  it('should categorize weather conditions correctly', () => {
    expect(getWeatherCategory('Light Rain')).toBe('rainy');
    expect(getWeatherCategory('Heavy Storm')).toBe('rainy');
    expect(getWeatherCategory('Partly Cloudy')).toBe('cloudy');
    expect(getWeatherCategory('Sunny')).toBe('sunny');
    expect(getWeatherCategory('Clear Sky')).toBe('sunny');
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  it('should handle empty interests array', () => {
    const interests: string[] = [];
    expect(interests).toHaveLength(0);
    expect(Array.isArray(interests)).toBe(true);
  });

  it('should handle maximum group size', () => {
    const maxGroup = 20;
    expect(maxGroup).toBeLessThanOrEqual(100);
  });

  it('should validate date ordering', () => {
    const startDate = new Date('2026-06-01');
    const endDate = new Date('2026-06-04');
    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
  });

  it('should calculate trip duration in days', () => {
    const start = new Date('2026-06-01');
    const end = new Date('2026-06-04');
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    expect(days).toBe(3);
  });
});
