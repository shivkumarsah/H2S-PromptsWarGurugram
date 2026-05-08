import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = !getApps().length && process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  ? initializeApp(firebaseConfig)
  : getApps().length > 0 ? getApp() : null;

export const auth = app ? getAuth(app) : null;
