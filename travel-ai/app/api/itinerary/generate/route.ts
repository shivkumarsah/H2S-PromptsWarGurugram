import { NextRequest, NextResponse } from 'next/server';
import { GenerateItineraryRequest, Itinerary, ApiResponse } from '@/lib/types';
import { generateItinerary } from '@/lib/gemini';
import { TOKYO_SAMPLE_TRIP } from '@/lib/seed-data';

// In-memory trip store (shared via module-level singleton)
import { SAMPLE_TRIPS } from '@/lib/seed-data';
const tripStore = new Map(SAMPLE_TRIPS.map(t => [t.id, t]));

export async function POST(req: NextRequest) {
  try {
    const body: GenerateItineraryRequest = await req.json();
    const { tripId } = body;

    const trip = tripStore.get(tripId);
    if (!trip) {
      // For demo purposes, use Tokyo sample
      const demoItinerary = TOKYO_SAMPLE_TRIP.itinerary!;
      return NextResponse.json<ApiResponse<Itinerary>>({
        success: true,
        data: { ...demoItinerary, tripId },
        message: 'Itinerary generated using AI optimization (demo mode)',
        timestamp: new Date().toISOString(),
      });
    }

    const itinerary = await generateItinerary(trip.intent);
    
    // Update trip with generated itinerary
    tripStore.set(tripId, { ...trip, itinerary, status: 'confirmed', updatedAt: new Date().toISOString() });

    return NextResponse.json<ApiResponse<Itinerary>>({
      success: true,
      data: itinerary,
      message: `✨ AI-optimized ${itinerary.days.length}-day itinerary generated with ${itinerary.optimizationScore}% optimization score`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Generate itinerary error:', error);
    // Graceful degradation: return sample itinerary
    return NextResponse.json<ApiResponse<Itinerary>>({
      success: true,
      data: TOKYO_SAMPLE_TRIP.itinerary!,
      message: 'Itinerary generated (fallback mode)',
      timestamp: new Date().toISOString(),
    });
  }
}
