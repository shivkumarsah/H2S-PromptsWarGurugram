/* eslint-disable */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTravelStore } from '@/lib/store';
import { INTEREST_OPTIONS, TRAVEL_STYLES_META, SAMPLE_DESTINATIONS } from '@/lib/seed-data';
import { TravelStyle, PaceType } from '@/lib/types';
import toast from 'react-hot-toast';

interface OnboardingWizardProps {
  onClose: () => void;
}

type Step = 'nl-input' | 'destination' | 'dates' | 'preferences' | 'interests' | 'review';
const STEPS: Step[] = ['nl-input', 'destination', 'dates', 'preferences', 'interests', 'review'];
const STEP_LABELS = ['Quick Start', 'Destination', 'Dates & Budget', 'Preferences', 'Interests', 'Review'];

export default function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const { draftIntent, updateDraftIntent, resetDraftIntent, addTrip, setActiveTrip, setIsGenerating } = useTravelStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [nlInput, setNlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = STEPS[stepIndex];

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex(i => i + 1);
  };
  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  };

  const handleNLParse = async () => {
    if (!nlInput.trim()) {
      setStepIndex(1);
      return;
    }
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguageInput: nlInput }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        updateDraftIntent(data.data.intent);
        toast.success('✨ AI parsed your trip request!');
        setStepIndex(5); // Jump to review
      }
    } catch {
      setStepIndex(1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftIntent),
      });
      const data = await res.json();
      if (data.success && data.data) {
        addTrip(data.data);
        setActiveTrip(data.data);
        resetDraftIntent();
        onClose();
        toast.success('Trip created! Generating your itinerary...');

        // Generate itinerary
        setIsGenerating(true);
        const itinRes = await fetch('/api/itinerary/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId: data.data.id }),
        });
        const itinData = await itinRes.json();
        if (itinData.success && itinData.data) {
          const { setItinerary } = useTravelStore.getState();
          setItinerary(data.data.id, itinData.data);
          toast.success('✨ Your personalized itinerary is ready!');
        }
        setIsGenerating(false);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-strong rounded-2xl w-full max-w-2xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">
                ✈️
              </div>
              <span className="font-bold gradient-text">Plan a New Trip</span>
            </div>
            <button onClick={onClose} className="btn-ghost p-2 text-slate-400">✕</button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${
                  i <= stepIndex ? 'bg-indigo-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400">{STEP_LABELS[stepIndex]}</p>
        </div>

        {/* Step content */}
        <div className="px-8 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 'nl-input' && (
                <NLInputStep
                  value={nlInput}
                  onChange={setNlInput}
                  onParse={handleNLParse}
                  onSkip={() => setStepIndex(1)}
                />
              )}
              {currentStep === 'destination' && (
                <DestinationStep />
              )}
              {currentStep === 'dates' && (
                <DatesStep />
              )}
              {currentStep === 'preferences' && (
                <PreferencesStep />
              )}
              {currentStep === 'interests' && (
                <InterestsStep />
              )}
              {currentStep === 'review' && (
                <ReviewStep />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-white/5">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            className={`btn-secondary text-sm px-5 ${stepIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            ← Back
          </button>
          {currentStep !== 'review' ? (
            <button onClick={handleNext} className="btn-primary text-sm px-6 relative z-10">
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary text-sm px-8 relative z-10"
            >
              {isSubmitting ? '✨ Creating...' : '🚀 Create Trip & Generate Itinerary'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ----------------------------------------------------------------
// Step components
// ----------------------------------------------------------------

function NLInputStep({ value, onChange, onParse, onSkip }: {
  value: string; onChange: (v: string) => void; onParse: () => void; onSkip: () => void;
}) {
  const examples = [
    "3-day family trip to Tokyo under $1500 with kid-friendly activities",
    "Romantic 5-day Paris getaway for 2, budget $3000, love art and wine",
    "Budget backpacking week in Bali, $800, surfing and temples",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Describe your dream trip ✈️</h2>
        <p className="text-slate-400">Tell me in your own words — AI will parse the details automatically.</p>
      </div>

      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 3-day family trip to Tokyo under $1500 with kid-friendly activities..."
          className="input-field resize-none"
          rows={4}
          style={{ resize: 'none' }}
        />
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-3">Try these examples:</p>
        <div className="space-y-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex)}
              className="w-full text-left glass rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onParse} disabled={!value.trim()} className="btn-primary flex-1 relative z-10 text-sm">
          ✨ Parse with AI
        </button>
        <button onClick={onSkip} className="btn-secondary text-sm px-5">
          Fill manually →
        </button>
      </div>
    </div>
  );
}

function DestinationStep() {
  const { draftIntent, updateDraftIntent } = useTravelStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Where are you going? 🌍</h2>
      </div>
      <input
        type="text"
        value={draftIntent.destination || ''}
        onChange={(e) => updateDraftIntent({ destination: e.target.value })}
        placeholder="Tokyo, Japan"
        className="input-field"
      />
      <div>
        <p className="text-xs text-slate-500 mb-3">Popular destinations:</p>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_DESTINATIONS.slice(0, 9).map((dest) => (
            <button
              key={dest}
              onClick={() => updateDraftIntent({ destination: dest })}
              className={`glass rounded-xl py-2.5 text-sm text-center transition-all ${
                draftIntent.destination === dest
                  ? 'border border-indigo-500/50 text-indigo-300 bg-indigo-500/10'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {dest.split(',')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DatesStep() {
  const { draftIntent, updateDraftIntent } = useTravelStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">When & how much? 📅</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Start Date</label>
          <input
            type="date"
            value={draftIntent.startDate || ''}
            onChange={(e) => updateDraftIntent({ startDate: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-2 block">End Date</label>
          <input
            type="date"
            value={draftIntent.endDate || ''}
            onChange={(e) => updateDraftIntent({ endDate: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Total Budget (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              value={draftIntent.budget || ''}
              onChange={(e) => updateDraftIntent({ budget: parseInt(e.target.value) })}
              placeholder="1500"
              className="input-field pl-8"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Group Size</label>
          <input
            type="number"
            value={draftIntent.groupSize || 2}
            onChange={(e) => updateDraftIntent({ groupSize: parseInt(e.target.value) })}
            min={1}
            max={20}
            className="input-field"
          />
        </div>
      </div>

      {/* Budget quick select */}
      <div>
        <p className="text-xs text-slate-500 mb-3">Budget presets (per person):</p>
        <div className="flex gap-2">
          {[
            { label: '💰 Budget', amount: 800 },
            { label: '🏨 Mid-Range', amount: 2000 },
            { label: '✨ Luxury', amount: 5000 },
          ].map(({ label, amount }) => (
            <button
              key={amount}
              onClick={() => updateDraftIntent({ budget: amount * (draftIntent.groupSize || 2) })}
              className="flex-1 btn-secondary text-xs py-2"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreferencesStep() {
  const { draftIntent, updateDraftIntent } = useTravelStore();

  const toggleStyle = (style: TravelStyle) => {
    const current = draftIntent.travelStyle || [];
    const updated = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style];
    updateDraftIntent({ travelStyle: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your travel style 🎯</h2>
        <p className="text-slate-400">Select all that apply.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(TRAVEL_STYLES_META).map(([key, meta]) => {
          const selected = draftIntent.travelStyle?.includes(key as TravelStyle);
          return (
            <button
              key={key}
              onClick={() => toggleStyle(key as TravelStyle)}
              className={`glass rounded-xl p-4 text-left transition-all ${
                selected
                  ? 'border border-indigo-500/50 bg-indigo-500/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <span className="text-2xl">{meta.icon}</span>
              <p className="font-medium mt-2">{meta.label}</p>
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-3 block">Travel Pace</label>
        <div className="flex gap-3">
          {(['relaxed', 'moderate', 'intensive'] as PaceType[]).map((pace) => (
            <button
              key={pace}
              onClick={() => updateDraftIntent({ pace })}
              className={`flex-1 glass rounded-xl py-3 text-sm capitalize transition-all ${
                draftIntent.pace === pace
                  ? 'border border-indigo-500/50 text-indigo-300 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {pace === 'relaxed' ? '😌' : pace === 'moderate' ? '⚡' : '🚀'} {pace}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InterestsStep() {
  const { draftIntent, updateDraftIntent } = useTravelStore();

  const toggleInterest = (interest: string) => {
    const current = draftIntent.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    updateDraftIntent({ interests: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What do you love? 💫</h2>
        <p className="text-slate-400">Select your interests — AI will prioritize these.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => {
          const selected = draftIntent.interests?.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selected
                  ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                  : 'glass text-slate-300 hover:bg-white/5'
              }`}
            >
              {selected ? '✓ ' : ''}{interest}
            </button>
          );
        })}
      </div>

      {draftIntent.interests && draftIntent.interests.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-2">Selected interests ({draftIntent.interests.length})</p>
          <div className="flex flex-wrap gap-2">
            {draftIntent.interests.map(i => (
              <span key={i} className="tag">{i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewStep() {
  const { draftIntent } = useTravelStore();

  const days = draftIntent.startDate && draftIntent.endDate
    ? Math.ceil((new Date(draftIntent.endDate).getTime() - new Date(draftIntent.startDate).getTime()) / 86400000)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ready to generate! 🚀</h2>
        <p className="text-slate-400">Gemini will craft your perfect itinerary based on these preferences.</p>
      </div>

      <div className="glass-card p-5 space-y-4">
        {[
          { label: 'Destination', value: draftIntent.destination || 'Not set', icon: '📍' },
          { label: 'Dates', value: days > 0 ? `${days} days (${draftIntent.startDate} → ${draftIntent.endDate})` : 'Not set', icon: '📅' },
          { label: 'Budget', value: draftIntent.budget ? `$${draftIntent.budget.toLocaleString()}` : 'Not set', icon: '💰' },
          { label: 'Group', value: `${draftIntent.groupSize || 2} travelers`, icon: '👥' },
          { label: 'Style', value: draftIntent.travelStyle?.join(', ') || 'Not set', icon: '🎯' },
          { label: 'Pace', value: draftIntent.pace || 'Moderate', icon: '⚡' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-lg w-8">{icon}</span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-medium capitalize">{value}</p>
            </div>
          </div>
        ))}

        {draftIntent.interests && draftIntent.interests.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-lg w-8">💫</span>
            <div>
              <p className="text-xs text-slate-500">Interests</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {draftIntent.interests.map(i => <span key={i} className="tag text-xs">{i}</span>)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-400/8 border border-emerald-400/15">
        <span className="text-xl">🤖</span>
        <p className="text-sm text-emerald-300">
          Gemini will optimize your route, budget allocation, and activity scheduling in real-time.
        </p>
      </div>
    </div>
  );
}
