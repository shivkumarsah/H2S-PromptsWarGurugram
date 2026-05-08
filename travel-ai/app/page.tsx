'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTravelStore } from '@/lib/store';
import toast from 'react-hot-toast';

const FEATURED_DESTINATIONS = [
  { name: 'Tokyo', country: 'Japan', emoji: '🗼', temp: '22°C', tags: ['Culture', 'Food', 'Tech'] },
  { name: 'Bali', country: 'Indonesia', emoji: '🌴', temp: '30°C', tags: ['Beach', 'Spiritual', 'Adventure'] },
  { name: 'Paris', country: 'France', emoji: '🎨', temp: '18°C', tags: ['Romance', 'Art', 'Food'] }, // P3: fixed emoji
  { name: 'New York', country: 'USA', emoji: '🗽', temp: '20°C', tags: ['Urban', 'Culture', 'Shopping'] },
];

const QUICK_EXAMPLES = [
  "3-day family trip to Tokyo under $1500 with kid-friendly activities",
  "Romantic 5-day Paris getaway for 2, budget $3000, focus on art and wine",
  "Budget backpacking week in Bali, $800 total, love surfing and temples",
  "NYC luxury weekend for 2, $2000 budget, theater and fine dining",
];

export default function HomePage() {
  const router = useRouter();
  const { loadSampleData } = useTravelStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanTrip = async (query?: string) => {
    const tripInput = query || input;
    if (!tripInput.trim()) {
      toast.error('Please describe your dream trip first!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguageInput: tripInput }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        toast.success('✨ Trip created! Generating your personalized itinerary...');
        // P3: Only load sample data if API didn't return real data
        router.push(`/dashboard?newTrip=${data.data.id}`);
      }
    } catch {
      toast.error('Oops! Starting with demo mode...');
      // P3: lazy-load sample data only in catch (fallback)
      loadSampleData();
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    loadSampleData();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen hero-bg">
      {/* Ambient orbs — decorative, hidden from AT */}
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-orb hero-orb-3" aria-hidden="true" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6" aria-label="Main navigation">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg"
            aria-hidden="true"
          >
            {/* P2: decorative emoji hidden from screen readers */}
            <span aria-hidden="true">✈️</span>
          </div>
          <span className="text-xl font-bold gradient-text">TravelAI</span>
          <span className="tag text-xs" aria-label="Powered by Google Gemini">Powered by Gemini</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-sm" onClick={handleDemoMode} aria-label="View demo dashboard">
            View Demo
          </button>
          <button
            className="btn-primary text-sm px-5 py-2.5"
            onClick={handleDemoMode}
            aria-label="Open travel planning dashboard"
          >
            Open Dashboard →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 text-sm text-indigo-300 mb-8" role="status">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            Real-time AI adaptation powered by Google Gemini
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
            Plan your perfect trip
            <br />
            <span className="gradient-text">with AI intelligence</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Generate personalized day-by-day itineraries instantly. Adapts in real-time to weather,
            budget changes, and your preferences. Like having a local expert in your pocket.
          </p>

          {/* Main Input */}
          <section aria-label="Trip planning input" className="glass-strong rounded-2xl p-4 max-w-3xl mx-auto mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl" aria-hidden="true">✈️</span>
                <label htmlFor="trip-input" className="sr-only">
                  Describe your dream trip
                </label>
                <input
                  id="trip-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handlePlanTrip()}
                  placeholder="3-day family trip to Tokyo under $1500..."
                  className="input-field pl-12 pr-4 py-4 text-base rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  aria-describedby="trip-input-hint"
                  autoComplete="off"
                />
              </div>
              {/* P2: aria-disabled on loading button */}
              <button
                id="plan-trip-btn"
                onClick={() => handlePlanTrip()}
                disabled={isLoading}
                aria-disabled={isLoading}
                aria-busy={isLoading}
                className="btn-primary px-8 relative z-10 whitespace-nowrap"
                aria-label={isLoading ? 'Planning your trip, please wait' : 'Plan trip with AI'}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    {/* P2: Loading spinner with ARIA */}
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-label="Loading"
                      role="img"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Planning...
                  </span>
                ) : 'Plan Trip ✨'}
              </button>
            </div>

            {/* Quick examples */}
            <div className="mt-3 flex flex-wrap gap-2 justify-center" id="trip-input-hint">
              <span className="text-xs text-slate-500">Try:</span>
              {QUICK_EXAMPLES.slice(0, 2).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handlePlanTrip(ex)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  aria-label={`Use example: ${ex}`}
                >
                  &ldquo;{ex.substring(0, 45)}...&rdquo;
                </button>
              ))}
            </div>
          </section>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center mb-16" role="list" aria-label="Key features">
            {[
              { icon: '🌤️', text: 'Real-time weather adaptation' },
              { icon: '💰', text: 'Smart budget optimization' },
              { icon: '🗺️', text: 'Route-optimized itineraries' },
              { icon: '💬', text: 'Conversational planning' },
              { icon: '⚡', text: 'Instant generation' },
            ].map((f, i) => (
              <motion.div
                key={i}
                role="listitem"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-slate-300"
              >
                <span aria-hidden="true">{f.icon}</span>
                <span>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Destinations — P2: keyboard accessible */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          aria-label="Trending destinations"
        >
          <h2 className="text-2xl font-semibold text-left mb-6">
            <span className="gradient-text">Trending destinations</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
            {FEATURED_DESTINATIONS.map((dest, i) => (
              <motion.div
                key={i}
                role="listitem"
                whileHover={{ scale: 1.03, y: -4 }}
                onClick={() => handlePlanTrip(`Weekend trip to ${dest.name}, ${dest.country}`)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlanTrip(`Weekend trip to ${dest.name}, ${dest.country}`)}
                tabIndex={0}
                aria-label={`Plan a trip to ${dest.name}, ${dest.country} — ${dest.tags.join(', ')}`}
                className="glass-card p-5 text-left cursor-pointer group focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-xl"
              >
                <div className="text-3xl mb-3" aria-hidden="true">{dest.emoji}</div>
                <div className="font-semibold text-lg">{dest.name}</div>
                <div className="text-slate-400 text-sm mb-3">{dest.country} · {dest.temp}</div>
                <div className="flex flex-wrap gap-1" aria-label={`Tags: ${dest.tags.join(', ')}`}>
                  {dest.tags.map(tag => (
                    <span key={tag} className="tag text-xs">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Architecture Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 glass rounded-2xl p-6 text-center"
          aria-label="Google Cloud Architecture"
        >
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Google Cloud Architecture</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm" role="list" aria-label="Services used">
            {[
              { icon: '🔮', name: 'Gemini 1.5 Pro' },
              { icon: '☁️', name: 'Cloud Run' },
              { icon: '🔥', name: 'Firestore' },
              { icon: '📡', name: 'Pub/Sub' },
              { icon: '🗺️', name: 'Maps Platform' },
              { icon: '🔍', name: 'Vertex AI Search' },
              { icon: '📊', name: 'BigQuery' },
              { icon: '🔐', name: 'Firebase Auth' },
            ].map((svc, i) => (
              <span key={i} role="listitem" className="flex items-center gap-1.5 text-slate-400">
                <span aria-hidden="true">{svc.icon}</span>
                <span>{svc.name}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
