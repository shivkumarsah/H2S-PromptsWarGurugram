// ============================================================
// Core Domain Types — TravelAI
// ============================================================

export type TravelStyle = 'adventure' | 'luxury' | 'budget' | 'cultural' | 'family' | 'romantic' | 'business';
export type PaceType = 'relaxed' | 'moderate' | 'intensive';
export type MealType = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free' | 'none';
export type TransportMode = 'walking' | 'taxi' | 'public-transit' | 'rental-car' | 'bike' | 'mixed';

export interface TripIntent {
  id: string;
  destination: string;
  startDate: string;         // ISO date string
  endDate: string;
  budget: number;            // USD total
  currency: string;
  groupSize: number;
  travelStyle: TravelStyle[];
  pace: PaceType;
  interests: string[];
  dietaryRestrictions: MealType[];
  mobilityNeeds: string;
  visaConstraints: string[];
  naturalLanguageInput?: string;
  createdAt: string;
  userId: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'experience' | 'event' | 'shopping';
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  startTime: string;        // HH:MM
  endTime: string;
  durationMinutes: number;
  estimatedCost: number;
  currency: string;
  location: {
    name: string;
    address: string;
    coordinates: Coordinates;
    placeId?: string;
  };
  distanceFromPrevious?: number;  // km
  travelTimeFromPrevious?: number; // minutes
  transportMode?: TransportMode;
  rating?: number;
  imageUrl?: string;
  bookingUrl?: string;
  openingHours?: string;
  confidenceScore: number;   // 0–1
  tags: string[];
  alternatives: AlternativeActivity[];
  reasonIncluded: string;
  isCompleted?: boolean;
  isSkipped?: boolean;
}

export interface AlternativeActivity {
  id: string;
  name: string;
  description: string;
  estimatedCost: number;
  durationMinutes: number;
  reasonAlternative: string;
  confidenceScore: number;
}

export interface DayPlan {
  date: string;              // ISO date
  dayNumber: number;
  theme: string;
  summary: string;
  activities: Activity[];
  totalCost: number;
  totalDistance: number;    // km
  totalTravelTime: number;  // minutes
  weatherForecast?: WeatherInfo;
  notes: string;
}

export interface WeatherInfo {
  condition: string;
  temperatureHigh: number;
  temperatureLow: number;
  precipitation: number;    // percentage
  humidity: number;
  icon: string;
  advisory?: string;
}

export interface Itinerary {
  id: string;
  tripId: string;
  version: number;
  days: DayPlan[];
  totalEstimatedCost: number;
  budgetRemaining: number;
  coverImageUrl?: string;
  highlights: string[];
  generatedAt: string;
  lastUpdatedAt: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  adaptationLog: AdaptationEvent[];
  optimizationScore: number; // 0–100
}

export interface AdaptationEvent {
  id: string;
  timestamp: string;
  trigger: 'weather' | 'user-request' | 'closure' | 'delay' | 'preference-change' | 'budget';
  description: string;
  changesApplied: string[];
  impact: 'minor' | 'moderate' | 'major';
}

export interface Trip {
  id: string;
  userId: string;
  intent: TripIntent;
  itinerary?: Itinerary;
  status: 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  coverImage?: string;
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  itineraryUpdate?: Partial<Itinerary>;
  suggestedActions?: string[];
}

export interface ChatSession {
  id: string;
  tripId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// API Request / Response Types
// ============================================================

export interface CreateTripRequest {
  naturalLanguageInput?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  groupSize?: number;
  travelStyle?: TravelStyle[];
  pace?: PaceType;
  interests?: string[];
  dietaryRestrictions?: MealType[];
}

export interface GenerateItineraryRequest {
  tripId: string;
  regenerate?: boolean;
  constraints?: string[];
}

export interface UpdateItineraryRequest {
  tripId: string;
  itineraryId: string;
  instruction: string;   // natural language change
  context?: string;
}

export interface ChatRequest {
  tripId: string;
  sessionId: string;
  message: string;
  currentItinerary?: Itinerary;
}

export interface RecommendationsRequest {
  destination: string;
  interests: string[];
  budget: number;
  dates: { start: string; end: string };
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
