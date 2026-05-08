/* eslint-disable */
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTravelStore } from '@/lib/store';
import { Trip } from '@/lib/types';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { TRAVEL_STYLES_META } from '@/lib/seed-data';

interface SidebarProps {
  onNewTrip: () => void;
}

export default function Sidebar({ onNewTrip }: SidebarProps) {
  const { trips, activeTrip, setActiveTrip, sidebarOpen } = useTravelStore();

  const statusColor = (status: Trip['status']) => ({
    planning: 'text-amber-400 bg-amber-400/10',
    confirmed: 'text-emerald-400 bg-emerald-400/10',
    active: 'text-indigo-400 bg-indigo-400/10',
    completed: 'text-slate-400 bg-slate-400/10',
    cancelled: 'text-rose-400 bg-rose-400/10',
  }[status]);

  return (
    <aside
      className="sidebar"
      aria-label="Trip navigation sidebar"
      role="complementary"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">
          ✈️
        </div>
        <div>
          <span className="font-bold gradient-text text-base">TravelAI</span>
          <p className="text-xs text-slate-500">Powered by Gemini</p>
        </div>
      </div>

      {/* New Trip Button */}
      <div className="p-4">
        <button
          onClick={onNewTrip}
          className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2 relative z-10"
        >
          <span>+</span> Plan New Trip
        </button>
      </div>

      {/* Trip List */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest px-2 mb-3">My Trips</p>

        {trips.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🗺️</div>
            <p className="text-sm text-slate-500">No trips yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {trips.map((trip) => (
              <motion.button
                key={trip.id}
                whileHover={{ x: 2 }}
                onClick={() => setActiveTrip(trip)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                  activeTrip?.id === trip.id
                    ? 'bg-indigo-500/15 border border-indigo-500/30'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl flex-shrink-0">
                    {trip.intent.destination.toLowerCase().includes('tokyo') ? '🗼' :
                     trip.intent.destination.toLowerCase().includes('bali') ? '🌴' :
                     trip.intent.destination.toLowerCase().includes('paris') ? '🗼' :
                     trip.intent.destination.toLowerCase().includes('new york') ? '🗽' : '✈️'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {trip.intent.destination.split(',')[0]}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {new Date(trip.intent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(trip.intent.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>

                {/* Budget bar */}
                {trip.itinerary && (
                  <div className="mt-2 ml-10">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>${trip.itinerary.totalEstimatedCost} spent</span>
                      <span>${trip.intent.budget} budget</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, (trip.itinerary.totalEstimatedCost / trip.intent.budget) * 100)}%`,
                          background: trip.itinerary.totalEstimatedCost > trip.intent.budget
                            ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                            : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="p-4 border-t border-white/5">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Gemini AI Active</span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time adaptation enabled. Weather & event monitoring active.
          </p>
        </div>

        <div className="mt-4">
          <GoogleSignIn />
        </div>
      </div>
    </aside>
  );
}
