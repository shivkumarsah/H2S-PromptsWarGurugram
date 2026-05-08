'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import toast from 'react-hot-toast';

export default function GoogleSignIn() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(!!auth);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    if (!auth) {
      toast.error('Firebase Auth not configured for demo');
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast.success('Signed out');
    } catch (error) {
      console.error(error);
    }
  };

  if (isInitializing) {
    return <div className="text-xs text-slate-500 animate-pulse">Loading auth...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
        {user.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{user.displayName || user.email}</p>
        </div>
        <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg transition-colors">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors text-sm font-medium"
      aria-label="Sign in with Google"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Sign in with Google
    </button>
  );
}
