/* eslint-disable */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trip, Activity, DayPlan } from '@/lib/types';
import ActivityCard from './ActivityCard';

interface ItineraryViewProps {
  trip: Trip;
  tab: 'itinerary' | 'overview';
}

/* eslint-disable @typescript-eslint/no-unused-expressions */
export default function ItineraryView({ trip, tab }: ItineraryViewProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  const itinerary = trip.itinerary;
  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">📋</div>
        <p className="text-slate-400">No itinerary generated yet</p>
      </div>
    );
  }

  const toggleExpanded = (id: string) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (tab === 'overview') {
    return <OverviewTab trip={trip} />;
  }

  return (
    <div className="flex h-full">
      {/* Day selector */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 p-4 overflow-y-auto">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Days</p>
        <div className="space-y-2">
          {itinerary.days.map((day, i) => (
            <motion.button
              key={day.date}
              whileHover={{ x: 2 }}
              onClick={() => setActiveDay(i)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                activeDay === i
                  ? 'bg-indigo-500/15 border border-indigo-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  activeDay === i ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {day.dayNumber}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{day.theme?.split('—')[0]?.trim() || `Day ${day.dayNumber}`}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {day.weatherForecast && (
                      <span className="text-xs">{day.weatherForecast.icon} {day.weatherForecast.temperatureHigh}°C</span>
                    )}
                    <span className="text-xs text-slate-500">${day.totalCost}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Adaptation log */}
        {itinerary.adaptationLog.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">AI Adaptations</p>
            <div className="space-y-2">
              {itinerary.adaptationLog.map((event) => (
                <div key={event.id} className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">
                      {event.trigger === 'weather' ? '🌤️' :
                       event.trigger === 'budget' ? '💰' :
                       event.trigger === 'user-request' ? '💬' : '⚡'}
                    </span>
                    <span className={`text-xs font-medium ${
                      event.impact === 'major' ? 'text-rose-400' :
                      event.impact === 'moderate' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {event.impact} update
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Day detail */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <DayView
            key={activeDay}
            day={itinerary.days[activeDay]}
            expandedActivities={expandedActivities}
            onToggle={toggleExpanded}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

function DayView({ day, expandedActivities, onToggle }: {
  day: DayPlan;
  expandedActivities: Set<string>;
  onToggle: (id: string) => void;
}) {
  const timeSlots = ['morning', 'afternoon', 'evening', 'night'] as const;
  const slotEmoji = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Day header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-slate-500">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              {day.weatherForecast && (
                <span className={`weather-badge ${
                  day.weatherForecast.condition.toLowerCase().includes('rain') ? 'rain' :
                  day.weatherForecast.condition.toLowerCase().includes('sun') ? 'sunny' : ''
                }`}>
                  <span>{day.weatherForecast.icon}</span>
                  <span>{day.weatherForecast.condition}</span>
                  <span>{day.weatherForecast.temperatureHigh}°C / {day.weatherForecast.temperatureLow}°C</span>
                  {day.weatherForecast.precipitation > 30 && (
                    <span>💧 {day.weatherForecast.precipitation}%</span>
                  )}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold">{day.theme}</h2>
            <p className="text-slate-400 mt-1 max-w-2xl">{day.summary}</p>
          </div>

          {/* Day stats */}
          <div className="flex gap-4">
            {[
              { label: 'Est. Cost', value: `$${day.totalCost}`, icon: '💰' },
              { label: 'Distance', value: `${day.totalDistance} km`, icon: '📍' },
              { label: 'Transit', value: `${day.totalTravelTime} min`, icon: '🚇' },
            ].map(stat => (
              <div key={stat.label} className="glass rounded-xl px-4 py-3 text-center">
                <div className="text-lg">{stat.icon}</div>
                <div className="text-base font-bold">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather advisory */}
        {day.weatherForecast?.advisory && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-300">Weather Advisory</p>
              <p className="text-sm text-amber-200/70">{day.weatherForecast.advisory}</p>
            </div>
          </div>
        )}
      </div>

      {/* Activities by time slot */}
      <div className="space-y-8">
        {timeSlots.map(slot => {
          const activities = day.activities.filter(a => a.timeSlot === slot);
          if (activities.length === 0) return null;

          return (
            <div key={slot}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{slotEmoji[slot]}</span>
                <h3 className="text-base font-semibold capitalize text-slate-300">{slot}</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="space-y-4 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500/40 to-transparent" />
                {activities.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ActivityCard
                      activity={activity}
                      isExpanded={expandedActivities.has(activity.id)}
                      onToggle={() => onToggle(activity.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function OverviewTab({ trip }: { trip: Trip }) {
  const itinerary = trip.itinerary!;

  // Compute category breakdown
  const categoryTotals: Record<string, number> = {};
  itinerary.days.forEach(day => {
    day.activities.forEach(act => {
      categoryTotals[act.category] = (categoryTotals[act.category] || 0) + act.estimatedCost;
    });
  });

  const categoryEmojis: Record<string, string> = {
    attraction: '🏛️', restaurant: '🍽️', hotel: '🏨', transport: '🚇',
    experience: '⚡', event: '🎭', shopping: '🛍️',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Highlights */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">✨ Trip Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {itinerary.highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/3"
            >
              <span className="text-indigo-400 mt-0.5">→</span>
              <span className="text-sm text-slate-300">{h}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">💰 Budget Overview</h3>
        <div className="flex items-center gap-8 mb-6">
          <div>
            <div className="text-3xl font-bold">${itinerary.totalEstimatedCost}</div>
            <div className="text-sm text-slate-400">of ${trip.intent.budget} total</div>
          </div>
          <div>
            <div className={`text-3xl font-bold ${itinerary.budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${Math.abs(itinerary.budgetRemaining)}
            </div>
            <div className="text-sm text-slate-400">{itinerary.budgetRemaining >= 0 ? 'remaining' : 'over budget'}</div>
          </div>
        </div>
        <div className="space-y-3">
          {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <span>{categoryEmojis[cat] || '📦'}</span>
                  <span className="capitalize">{cat}</span>
                </span>
                <span className="font-medium">${amount}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(amount / itinerary.totalEstimatedCost) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day-by-day cost */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">📅 Daily Cost Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {itinerary.days.map((day) => (
            <div key={day.date} className="glass rounded-xl p-4 text-center">
              <div className="text-xl mb-1">{day.weatherForecast?.icon || '📅'}</div>
              <div className="text-xs text-slate-400 mb-2">Day {day.dayNumber}</div>
              <div className="text-xl font-bold">${day.totalCost}</div>
              <div className="text-xs text-slate-500 mt-1">{day.activities.length} activities</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Score */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">🤖 AI Optimization Score</h3>
            <p className="text-sm text-slate-400">Based on route efficiency, budget adherence, and preference matching</p>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="35" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 35}`}
                strokeDashoffset={`${2 * Math.PI * 35 * (1 - itinerary.optimizationScore / 100)}`}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{itinerary.optimizationScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
