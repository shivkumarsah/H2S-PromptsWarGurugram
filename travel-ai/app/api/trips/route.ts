import { NextRequest, NextResponse } from 'next/server';
import { CreateTripRequest, Trip, TripIntent, ApiResponse } from '@/lib/types';
import { parseNaturalLanguageIntent } from '@/lib/gemini';
import { SAMPLE_TRIPS } from '@/lib/seed-data';

// In-memory store (replace with Firestore in production)
const tripStore = new Map<string, Trip>(SAMPLE_TRIPS.map(t => [t.id, t]));

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'user_demo';
  
  const trips = Array.from(tripStore.values())
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json<ApiResponse<Trip[]>>({
    success: true,
    data: trips,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateTripRequest = await req.json();

    // Parse natural language if provided
    let intentData: Partial<TripIntent> = {};
    if (body.naturalLanguageInput) {
      intentData = await parseNaturalLanguageIntent(body.naturalLanguageInput);
    }

    // Merge structured fields (override NL parsing)
    const startDate = body.startDate || intentData.startDate || 
      new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const endDate = body.endDate || intentData.endDate || 
      new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const intentId = `intent_${Date.now()}`;

    const trip: Trip = {
      id: tripId,
      userId: 'user_demo',
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      intent: {
        id: intentId,
        destination: body.destination || intentData.destination || 'Tokyo, Japan',
        startDate,
        endDate,
        budget: body.budget || intentData.budget || 1500,
        currency: 'USD',
        groupSize: body.groupSize || intentData.groupSize || 2,
        travelStyle: body.travelStyle || intentData.travelStyle || ['cultural'],
        pace: body.pace || intentData.pace || 'moderate',
        interests: body.interests || intentData.interests || [],
        dietaryRestrictions: body.dietaryRestrictions || [],
        mobilityNeeds: '',
        visaConstraints: [],
        naturalLanguageInput: body.naturalLanguageInput,
        createdAt: new Date().toISOString(),
        userId: 'user_demo',
      },
    };

    tripStore.set(tripId, trip);

    return NextResponse.json<ApiResponse<Trip>>({
      success: true,
      data: trip,
      message: 'Trip created successfully. Ready to generate itinerary.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to create trip',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Export for use in other route handlers
export { tripStore };
