import { NextRequest, NextResponse } from 'next/server';
import { CreateTripRequest, Trip, TripIntent, ApiResponse } from '@/lib/types';
import { parseNaturalLanguageIntent } from '@/lib/gemini';
import { sanitizeString, sanitizeNumber, validateCreateTripRequest } from '@/lib/security';
import { tripsDb } from '@/lib/firestore';
import { logger } from '@/lib/google-services';
import { SAMPLE_TRIPS } from '@/lib/seed-data';

// Seed sample data into the store on first load
tripsDb.seed(SAMPLE_TRIPS);

// ================================================================
// Pub/Sub: publish trip-created event (fire and forget)
// ================================================================
async function publishTripCreatedEvent(trip: Trip) {
  if (!process.env.PUBSUB_TOPIC || !process.env.GOOGLE_CLOUD_PROJECT) return;
  try {
    const { PubSub } = await import('@google-cloud/pubsub');
    const pubsub = new PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
    const topic = pubsub.topic(process.env.PUBSUB_TOPIC);
    const data = Buffer.from(JSON.stringify({
      tripId: trip.id,
      destination: trip.intent.destination,
      userId: trip.userId,
      createdAt: trip.createdAt,
    }));
    await topic.publishMessage({ data });
    logger.info('Published trip-created event to Pub/Sub', { tripId: trip.id });
  } catch (err) {
    // Non-critical: log but don't fail the request
    logger.warn('Pub/Sub publish failed (non-critical)', { error: String(err) });
  }
}

// ================================================================
// GET /api/trips
// ================================================================
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'user_demo';

  try {
    const trips = await tripsDb.list(userId);
    return NextResponse.json<ApiResponse<Trip[]>>({
      success: true,
      data: trips,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to list trips', { error: String(error) });
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to retrieve trips',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ================================================================
// POST /api/trips
// ================================================================
export async function POST(req: NextRequest) {
  try {
    const body: CreateTripRequest = await req.json();

    // Validate input
    const validation = validateCreateTripRequest(body as Record<string, unknown>);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: validation.errors.join('; '),
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Sanitize free-text fields
    const sanitizedNL = body.naturalLanguageInput
      ? sanitizeString(body.naturalLanguageInput, 500)
      : undefined;
    const sanitizedDest = body.destination
      ? sanitizeString(body.destination, 200)
      : undefined;

    // Parse natural language if provided
    let intentData: Partial<TripIntent> = {};
    if (sanitizedNL) {
      intentData = await parseNaturalLanguageIntent(sanitizedNL);
    }

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
        destination: sanitizedDest || intentData.destination || 'Tokyo, Japan',
        startDate,
        endDate,
        budget: sanitizeNumber(body.budget || intentData.budget, 0, 1_000_000, 1500),
        currency: 'USD',
        groupSize: sanitizeNumber(body.groupSize || intentData.groupSize, 1, 100, 2),
        travelStyle: body.travelStyle || intentData.travelStyle || ['cultural'],
        pace: body.pace || intentData.pace || 'moderate',
        interests: body.interests || intentData.interests || [],
        dietaryRestrictions: body.dietaryRestrictions || [],
        mobilityNeeds: '',
        visaConstraints: [],
        naturalLanguageInput: sanitizedNL,
        createdAt: new Date().toISOString(),
        userId: 'user_demo',
      },
    };

    // Persist to Firestore (or memory fallback)
    await tripsDb.save(trip);

    // Publish event to Pub/Sub (fire and forget)
    publishTripCreatedEvent(trip).catch(() => {});

    logger.info('Trip created', { tripId, destination: trip.intent.destination });

    return NextResponse.json<ApiResponse<Trip>>({
      success: true,
      data: trip,
      message: 'Trip created successfully. Ready to generate itinerary.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    logger.error('Create trip error', { error: String(error) });
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to create trip',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Export for use in other route handlers
export { tripsDb as tripStore };
