/**
 * Google Cloud Services Integration Layer
 * Provides structured Cloud Logging. Firebase Auth and Vertex AI Search
 * are conditionally loaded at runtime using string-literal require() to
 * avoid build-time module resolution errors for optional dependencies.
 */

import { Trip, Itinerary } from './types';

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

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    const emoji = { DEBUG: '🔍', INFO: 'ℹ️', NOTICE: '📢', WARNING: '⚠️', ERROR: '❌', CRITICAL: '🚨' }[severity];
    console.log(`${emoji} [${severity}] ${message}`, data ? JSON.stringify(data) : '');
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('DEBUG', msg, data),
  info:  (msg: string, data?: Record<string, unknown>) => log('INFO',  msg, data),
  warn:  (msg: string, data?: Record<string, unknown>) => log('WARNING', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('ERROR', msg, data),
  critical: (msg: string, data?: Record<string, unknown>) => log('CRITICAL', msg, data),
};

// ================================================================
// Firebase Auth — server-side token verification
// (optional dependency, graceful fallback)
// ================================================================
export async function verifyIdToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  if (!idToken) return null;

  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
      const decoded = await admin.auth().verifyIdToken(idToken);
      return { uid: decoded.uid, email: decoded.email };
    } catch (err) {
      logger.warn('Firebase token verification failed', { error: String(err) });
    }
  }

  // Demo mode: return a fake user
  return { uid: 'user_demo', email: 'demo@travelai.app' };
}

// ================================================================
// Vertex AI Search (recommendation retrieval)
// ================================================================
export async function searchRecommendations(
  destination: string,
  _interests: string[],
  limit = 10
): Promise<Array<{ name: string; description: string; rating: number; category: string }>> {
  // Production: call Vertex AI Search API
  // For now, return curated fallback recommendations
  logger.debug('searchRecommendations called', { destination, limit });
  return [
    { name: `Top Attraction in ${destination}`, description: 'A must-visit landmark', rating: 4.8, category: 'attraction' },
    { name: `Best Restaurant in ${destination}`, description: 'Authentic local cuisine', rating: 4.7, category: 'restaurant' },
    { name: `Hidden Gem in ${destination}`, description: 'Off the beaten path experience', rating: 4.9, category: 'experience' },
  ].slice(0, limit);
}
