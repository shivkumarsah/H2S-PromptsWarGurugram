/**
 * Google Cloud Firestore — singleton client with in-memory fallback.
 * Fixed: P1 — use singleton pattern, initialized once, not per-request.
 */

import { Trip, Itinerary } from './types';
import { logger } from './google-services';
import type { Firestore, QueryDocumentSnapshot } from '@google-cloud/firestore';

// ================================================================
// Singleton Firestore instance
// ================================================================
let _firestore: Firestore | null = null;

function getFirestore() {
  if (_firestore) return _firestore;
  if (!process.env.FIRESTORE_PROJECT_ID) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Firestore } = require('@google-cloud/firestore');
    _firestore = new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID });
    logger.info('Firestore singleton initialized', { project: process.env.FIRESTORE_PROJECT_ID });
    return _firestore;
  } catch (err) {
    logger.warn('Firestore not available, using memory store', { error: String(err) });
    return null;
  }
}

// ================================================================
// In-memory fallback
// ================================================================
const memStore = {
  trips: new Map<string, Trip>(),
  itineraries: new Map<string, Itinerary>(),
};

// ================================================================
// Trips DB operations
// ================================================================
export const tripsDb = {
  async save(trip: Trip): Promise<void> {
    const fs = getFirestore();
    if (fs) {
      try {
        await fs.collection('trips').doc(trip.id).set(trip);
        logger.info('Trip saved to Firestore', { tripId: trip.id });
        return;
      } catch (err) {
        logger.error('Firestore write failed', { error: String(err) });
      }
    }
    memStore.trips.set(trip.id, trip);
  },

  async get(id: string): Promise<Trip | null> {
    const fs = getFirestore();
    if (fs) {
      try {
        const doc = await fs.collection('trips').doc(id).get();
        if (doc.exists) return doc.data() as Trip;
      } catch (err) {
        logger.warn('Firestore read failed', { error: String(err) });
      }
    }
    return memStore.trips.get(id) || null;
  },

  async list(userId: string): Promise<Trip[]> {
    const fs = getFirestore();
    if (fs) {
      try {
        const snap = await fs
          .collection('trips')
          .where('userId', '==', userId)
          .orderBy('updatedAt', 'desc')
          .limit(50)
          .get();
        return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as Trip);
      } catch (err) {
        logger.warn('Firestore list failed', { error: String(err) });
      }
    }
    return Array.from(memStore.trips.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Allow seeding from in-memory store (for sample data)
  seed(trips: Trip[]) {
    trips.forEach(t => memStore.trips.set(t.id, t));
  },
};

// ================================================================
// Itineraries DB operations
// ================================================================
export const itinerariesDb = {
  async save(itinerary: Itinerary): Promise<void> {
    const fs = getFirestore();
    if (fs) {
      try {
        await fs.collection('itineraries').doc(itinerary.id).set(itinerary);
        return;
      } catch (err) {
        logger.error('Firestore itinerary write failed', { error: String(err) });
      }
    }
    memStore.itineraries.set(itinerary.id, itinerary);
  },

  async get(id: string): Promise<Itinerary | null> {
    const fs = getFirestore();
    if (fs) {
      try {
        const doc = await fs.collection('itineraries').doc(id).get();
        if (doc.exists) return doc.data() as Itinerary;
      } catch (err) {
        logger.warn('Firestore itinerary read failed', { error: String(err) });
      }
    }
    return memStore.itineraries.get(id) || null;
  },
};
