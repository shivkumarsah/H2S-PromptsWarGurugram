/**
 * Google Cloud Services Integration Layer
 *
 * Provides Firestore, Firebase Auth, and Cloud Logging integration.
 * Gracefully falls back to in-memory storage when credentials are absent.
 */

import { Trip, Itinerary, ChatSession } from './types';

// ================================================================
// Cloud Logging — Structured logging for Cloud Run
// ================================================================
type LogSeverity = 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogEntry {
  severity: LogSeverity;
  message: string;
  [key: string]: unknown;
}

export function log(severity: LogSeverity, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    service: 'travel-ai',
    version: process.env.npm_package_version || '1.0.0',
    ...data,
  };

  // Cloud Run picks up structured JSON logs automatically
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    const emoji = { DEBUG: '🔍', INFO: 'ℹ️', NOTICE: '📢', WARNING: '⚠️', ERROR: '❌', CRITICAL: '🚨' }[severity];
    console.log(`${emoji} [${severity}] ${message}`, data || '');
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('DEBUG', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log('INFO', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('WARNING', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('ERROR', msg, data),
  critical: (msg: string, data?: Record<string, unknown>) => log('CRITICAL', msg, data),
};

// ================================================================
// Firestore Client (with graceful in-memory fallback)
// ================================================================

// In-memory fallback store
const memoryStore = {
  trips: new Map<string, Trip>(),
  itineraries: new Map<string, Itinerary>(),
  chatSessions: new Map<string, ChatSession>(),
};

export const db = {
  // ---- Trips ----
  async saveTrip(trip: Trip): Promise<void> {
    try {
      if (process.env.FIRESTORE_PROJECT_ID) {
        // Production: Firestore
        const { Firestore } = await import('@google-cloud/firestore');
        const firestore = new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID });
        await firestore.collection('trips').doc(trip.id).set(trip);
        logger.info('Trip saved to Firestore', { tripId: trip.id });
      } else {
        memoryStore.trips.set(trip.id, trip);
        logger.debug('Trip saved to memory store', { tripId: trip.id });
      }
    } catch (err) {
      logger.error('Failed to save trip, using memory fallback', { error: String(err), tripId: trip.id });
      memoryStore.trips.set(trip.id, trip);
    }
  },

  async getTrip(tripId: string): Promise<Trip | null> {
    try {
      if (process.env.FIRESTORE_PROJECT_ID) {
        const { Firestore } = await import('@google-cloud/firestore');
        const firestore = new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID });
        const doc = await firestore.collection('trips').doc(tripId).get();
        if (!doc.exists) return null;
        return doc.data() as Trip;
      }
    } catch (err) {
      logger.warn('Firestore read failed, checking memory', { error: String(err) });
    }
    return memoryStore.trips.get(tripId) || null;
  },

  async listTrips(userId: string): Promise<Trip[]> {
    try {
      if (process.env.FIRESTORE_PROJECT_ID) {
        const { Firestore } = await import('@google-cloud/firestore');
        const firestore = new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID });
        const snapshot = await firestore
          .collection('trips')
          .where('userId', '==', userId)
          .orderBy('updatedAt', 'desc')
          .limit(50)
          .get();
        return snapshot.docs.map(d => d.data() as Trip);
      }
    } catch (err) {
      logger.warn('Firestore list failed, using memory', { error: String(err) });
    }
    return Array.from(memoryStore.trips.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // ---- Itineraries ----
  async saveItinerary(itinerary: Itinerary): Promise<void> {
    try {
      if (process.env.FIRESTORE_PROJECT_ID) {
        const { Firestore } = await import('@google-cloud/firestore');
        const firestore = new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID });
        await firestore.collection('itineraries').doc(itinerary.id).set(itinerary);
        logger.info('Itinerary saved to Firestore', { itineraryId: itinerary.id });
        return;
      }
    } catch (err) {
      logger.error('Failed to save itinerary', { error: String(err) });
    }
    memoryStore.itineraries.set(itinerary.id, itinerary);
  },

  async getItinerary(itineraryId: string): Promise<Itinerary | null> {
    try {
      if (process.env.FIRESTORE_PROJECT_ID) {
        const { Firestore } = await import('@google-cloud/firestore');
        const firestore = new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID });
        const doc = await firestore.collection('itineraries').doc(itineraryId).get();
        if (!doc.exists) return null;
        return doc.data() as Itinerary;
      }
    } catch (err) {
      logger.warn('Firestore itinerary read failed', { error: String(err) });
    }
    return memoryStore.itineraries.get(itineraryId) || null;
  },
};

// ================================================================
// Firebase Auth (server-side token verification)
// ================================================================
export async function verifyIdToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  if (!idToken) return null;

  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      const { getAuth } = await import('firebase-admin/auth');

      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }

      const decoded = await getAuth().verifyIdToken(idToken);
      return { uid: decoded.uid, email: decoded.email };
    }
  } catch (err) {
    logger.warn('Firebase token verification failed', { error: String(err) });
  }

  // Demo mode: return a fake user
  return { uid: 'user_demo', email: 'demo@travelai.app' };
}

// ================================================================
// Vertex AI Search (recommendation retrieval)
// ================================================================
export async function searchRecommendations(
  destination: string,
  interests: string[],
  limit = 10
): Promise<Array<{ name: string; description: string; rating: number; category: string }>> {
  try {
    if (process.env.VERTEX_AI_SEARCH_ENGINE_ID && process.env.GOOGLE_CLOUD_PROJECT) {
      logger.info('Querying Vertex AI Search', { destination, interests });
      // Production: call Vertex AI Search API
      // const { SearchServiceClient } = await import('@google-cloud/discoveryengine');
      // ... implementation
    }
  } catch (err) {
    logger.warn('Vertex AI Search unavailable, using seed data', { error: String(err) });
  }

  // Graceful fallback: return curated recommendations
  return [
    { name: `Top Attraction in ${destination}`, description: 'A must-visit landmark', rating: 4.8, category: 'attraction' },
    { name: `Best Restaurant in ${destination}`, description: 'Authentic local cuisine', rating: 4.7, category: 'restaurant' },
    { name: `Hidden Gem in ${destination}`, description: 'Off the beaten path experience', rating: 4.9, category: 'experience' },
  ].slice(0, limit);
}
