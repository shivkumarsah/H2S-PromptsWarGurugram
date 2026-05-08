/* eslint-disable */
'use client';

import { motion } from 'framer-motion';
import { Trip } from '@/lib/types';
import { useTravelStore } from '@/lib/store';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

/* eslint-disable @next/next/no-img-element */
export default function TripCard({ trip, onClick }: TripCardProps) {
  const days = Math.ceil(
    (new Date(trip.intent.endDate).getTime() - new Date(trip.intent.startDate).getTime()) / 86400000
  );

  const statusConfig = {
    planning: { label: '📝 Planning', color: 'tag-amber' },
    confirmed: { label: '✅ Confirmed', color: 'tag-green' },
    active: { label: '✈️ Active', color: 'tag' },
    completed: { label: '🏁 Completed', color: '' },
    cancelled: { label: '❌ Cancelled', color: 'tag-rose' },
  };

  const status = statusConfig[trip.status];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card overflow-hidden cursor-pointer group"
    >
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.intent.destination}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-5xl">
            🌍
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white">{trip.intent.destination}</h3>
          <p className="text-sm text-slate-300">
            {new Date(trip.intent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(trip.intent.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="absolute top-4 right-4">
          <span className={`tag text-xs ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Stat row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold">{days}</div>
            <div className="text-xs text-slate-400">Days</div>
          </div>
          <div className="text-center border-x border-white/5">
            <div className="text-lg font-bold">{trip.intent.groupSize}</div>
            <div className="text-xs text-slate-400">Travelers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">${trip.intent.budget >= 1000
              ? `${(trip.intent.budget / 1000).toFixed(1)}k`
              : trip.intent.budget}</div>
            <div className="text-xs text-slate-400">Budget</div>
          </div>
        </div>

        {/* Budget progress (if itinerary exists) */}
        {trip.itinerary && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Budget used</span>
              <span className={trip.itinerary.totalEstimatedCost > trip.intent.budget ? 'text-rose-400' : 'text-emerald-400'}>
                ${trip.itinerary.totalEstimatedCost} / ${trip.intent.budget}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill transition-all"
                style={{
                  width: `${Math.min(100, (trip.itinerary.totalEstimatedCost / trip.intent.budget) * 100)}%`,
                  background: trip.itinerary.totalEstimatedCost > trip.intent.budget
                    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                    : undefined,
                }}
              />
            </div>
          </div>
        )}

        {/* Travel styles */}
        <div className="flex flex-wrap gap-1.5">
          {trip.intent.travelStyle.map(style => (
            <span key={style} className="tag text-xs capitalize">{style}</span>
          ))}
          {trip.intent.interests.slice(0, 2).map(interest => (
            <span key={interest} className="tag-cyan text-xs tag">{interest}</span>
          ))}
        </div>

        {/* AI Score */}
        {trip.itinerary && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-xs text-slate-400">AI Optimization Score</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-indigo-400">{trip.itinerary.optimizationScore}%</span>
              <span className="text-xs">{'⭐'.repeat(Math.floor(trip.itinerary.optimizationScore / 20))}</span>
            </div>
          </div>
        )}
      </div>

      {/* View button */}
      <div className="px-4 pb-4">
        <div className="btn-secondary w-full text-center text-sm py-2.5 group-hover:border-indigo-500/40 group-hover:text-indigo-300 transition-all">
          {trip.itinerary ? 'View Itinerary →' : 'Generate Itinerary →'}
        </div>
      </div>
    </motion.div>
  );
}
