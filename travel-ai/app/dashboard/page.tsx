'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTravelStore } from '@/lib/store';
import Sidebar from '@/components/dashboard/Sidebar';
import TripCard from '@/components/dashboard/TripCard';
import ItineraryView from '@/components/itinerary/ItineraryView';
import ChatAssistant from '@/components/chat/ChatAssistant';
import MapView from '@/components/map/MapView';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import toast from 'react-hot-toast';

function DashboardContent() {
  const searchParams = useSearchParams();
  const {
    trips, activeTrip, setActiveTrip, loadSampleData, isGenerating,
    setIsGenerating, setItinerary, sidebarOpen, mapView, toggleMapView
  } = useTravelStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'overview'>('itinerary');

  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');

  const generateForNewTrip = async (tripId: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setItinerary(tripId, data.data);
        toast.success('✨ Your personalized itinerary is ready!');
      }
    } catch (err) {
      toast.error('Using sample itinerary for demo');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (trips.length === 0) {
      loadSampleData();
    }
    const newTripId = searchParams.get('newTrip');
    if (newTripId) {
      generateForNewTrip(newTripId);
    }
  }, []);

  const handleTranslate = async (lang: string) => {
    setTargetLanguage(lang);
    if (!activeTrip?.itinerary || lang === 'en') return;

    setIsTranslating(true);
    const toastId = toast.loading('Translating itinerary...');
    try {
      const res = await fetch('/api/itinerary/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: activeTrip.id, targetLanguage: lang }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setItinerary(activeTrip.id, data.data);
        toast.success('Translation complete!', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error('Translation failed (demo mode limit)', { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar
        onNewTrip={() => setShowOnboarding(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            {activeTrip ? (
              <div>
                <h1 className="text-xl font-bold">
                  {activeTrip.intent.destination}
                </h1>
                <p className="text-sm text-slate-400">
                  {new Date(activeTrip.intent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(activeTrip.intent.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  {activeTrip.intent.groupSize} {activeTrip.intent.groupSize === 1 ? 'traveler' : 'travelers'}
                  {' · '}
                  Budget: ${activeTrip.intent.budget.toLocaleString()}
                </p>
              </div>
            ) : (
              <h1 className="text-xl font-bold">My Trips</h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTrip?.itinerary && (
              <>
                <div className="flex items-center glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'itinerary' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                  >
                    📋 Itinerary
                  </button>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                  >
                    📊 Overview
                  </button>
                </div>
                <button
                  onClick={toggleMapView}
                  className={`btn-secondary text-sm px-4 py-2 flex items-center gap-2 ${mapView ? 'border-indigo-500/40 text-indigo-300' : ''}`}
                >
                  🗺️ {mapView ? 'List View' : 'Map View'}
                </button>
                <select
                  value={targetLanguage}
                  onChange={(e) => handleTranslate(e.target.value)}
                  disabled={isTranslating}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500/50"
                  aria-label="Translate itinerary"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="ja">日本語</option>
                  <option value="fr">Français</option>
                </select>
              </>
            )}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
            >
              💬 AI Planner
              {chatOpen ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> : null}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto">
            {isGenerating ? (
              <GeneratingState />
            ) : activeTrip ? (
              mapView ? (
                <MapView trip={activeTrip} />
              ) : (
                <ItineraryView trip={activeTrip} tab={activeTab} />
              )
            ) : (
              <TripGrid onNewTrip={() => setShowOnboarding(true)} />
            )}
          </div>

          {/* Chat Panel */}
          <AnimatePresence>
            {chatOpen && activeTrip && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="border-l border-white/5 flex-shrink-0 overflow-hidden"
              >
                <ChatAssistant trip={activeTrip} onClose={() => setChatOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onClose={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function TripGrid({ onNewTrip }: { onNewTrip: () => void }) {
  const { trips, setActiveTrip } = useTravelStore();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Trips</h2>
        <button onClick={onNewTrip} className="btn-primary text-sm px-5 py-2.5">
          + Plan New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <EmptyState onNewTrip={onNewTrip} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <TripCard trip={trip} onClick={() => setActiveTrip(trip)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneratingState() {
  const steps = [
    { icon: '🧭', text: 'Analyzing your preferences...', delay: 0 },
    { icon: '🌤️', text: 'Checking weather forecasts...', delay: 0.8 },
    { icon: '📍', text: 'Optimizing route clusters...', delay: 1.6 },
    { icon: '💰', text: 'Validating budget constraints...', delay: 2.4 },
    { icon: '✨', text: 'Finalizing your perfect itinerary...', delay: 3.2 },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center text-3xl"
      >
        ✈️
      </motion.div>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Crafting your perfect trip</h2>
        <p className="text-slate-400">Gemini is optimizing your personalized itinerary</p>
      </div>
      <div className="space-y-3 w-full max-w-md">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: step.delay }}
            className="flex items-center gap-3 glass rounded-xl px-4 py-3"
          >
            <span className="text-xl">{step.icon}</span>
            <span className="text-sm text-slate-300">{step.text}</span>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: step.delay + 0.3, duration: 0.5 }}
              className="ml-auto h-1 rounded-full bg-indigo-500/40"
              style={{ maxWidth: '60px' }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onNewTrip }: { onNewTrip: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-6">
      <div className="text-6xl animate-float">🌍</div>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">No trips planned yet</h3>
        <p className="text-slate-400 mb-6">Tell AI where you want to go and watch the magic happen</p>
        <button onClick={onNewTrip} className="btn-primary px-8">
          Plan my first trip ✈️
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-slate-400">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
