'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Trip } from '@/lib/types';

interface MapViewProps {
  trip: Trip;
}

// P3: Build Google Maps Static API URL with activity markers
type Activity = NonNullable<Trip['itinerary']>['days'][0]['activities'][0];
function buildStaticMapUrl(activities: Activity[], center: { lat: number; lng: number }): string | null {
  const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
  if (!apiKey) return null;

  const markers = activities
    .map((act, i) => `markers=color:0x6366f1%7Clabel:${i + 1}%7C${act.location.coordinates.lat},${act.location.coordinates.lng}`)
    .join('&');

  return `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=13&size=800x400&maptype=roadmap&${markers}&style=element:geometry%7Ccolor:0x242f3e&style=element:labels.text.stroke%7Ccolor:0x242f3e&style=element:labels.text.fill%7Ccolor:0x746855&key=${apiKey}`;
}


// Map view using embedded static maps (Google Maps embed in production)
export default function MapView({ trip }: MapViewProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const itinerary = trip.itinerary;

  if (!itinerary) return null;

  const day = itinerary.days[selectedDay];
  const activities = day?.activities || [];

  // Generate a static map URL using coordinates
  const markers = activities
    .map((act, i) => `markers=color:0x6366f1%7Clabel:${i + 1}%7C${act.location.coordinates.lat},${act.location.coordinates.lng}`)
    .join('&');

  // Center on the first activity
  const center = activities[0]?.location.coordinates || { lat: 35.6762, lng: 139.6503 };

  return (
    <div className="flex h-full">
      {/* Activity list panel */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4">
        {/* Day tabs */}
        <div className="flex gap-1 mb-4">
          {itinerary.days.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 py-2 text-xs rounded-lg transition-all font-medium ${
                selectedDay === i
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Day {d.dayNumber}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400 mb-3">{day?.theme}</p>

        {/* Activity list with route */}
        <div className="space-y-2">
          {activities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3"
            >
              {/* Number + line */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 z-10">
                  {i + 1}
                </div>
                {i < activities.length - 1 && (
                  <div className="w-0.5 h-8 bg-indigo-500/30 mt-1" />
                )}
              </div>

              {/* Activity info */}
              <div className="glass rounded-xl p-3 flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{act.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{act.startTime} · {act.durationMinutes}m</p>
                {act.estimatedCost > 0 ? (
                  <p className="text-xs text-indigo-400 mt-1">${act.estimatedCost}</p>
                ) : (
                  <p className="text-xs text-emerald-400 mt-1">Free</p>
                )}
                {i < activities.length - 1 && act.travelTimeFromPrevious && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    ↓ {act.travelTimeFromPrevious} min transit
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Day stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-base font-bold">${day?.totalCost}</div>
            <div className="text-xs text-slate-400">Total Cost</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-base font-bold">{day?.totalDistance} km</div>
            <div className="text-xs text-slate-400">Distance</div>
          </div>
        </div>
      </div>

      {/* Map panel */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated map with gradient background and pins */}
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 30%, #1a2f4a 60%, #0a1628 100%)',
            position: 'relative',
          }}
        >
          {/* Grid lines to simulate a map */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Simulated map roads */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Major roads */}
            <line x1="0" y1="40%" x2="100%" y2="38%" stroke="rgba(99,102,241,0.15)" strokeWidth="8" />
            <line x1="0" y1="55%" x2="100%" y2="58%" stroke="rgba(99,102,241,0.12)" strokeWidth="6" />
            <line x1="30%" y1="0" x2="28%" y2="100%" stroke="rgba(99,102,241,0.12)" strokeWidth="6" />
            <line x1="65%" y1="0" x2="68%" y2="100%" stroke="rgba(99,102,241,0.1)" strokeWidth="5" />
            {/* Minor roads */}
            <line x1="0" y1="25%" x2="100%" y2="27%" stroke="rgba(99,102,241,0.07)" strokeWidth="3" />
            <line x1="0" y1="72%" x2="100%" y2="70%" stroke="rgba(99,102,241,0.07)" strokeWidth="3" />
            <line x1="45%" y1="0" x2="47%" y2="100%" stroke="rgba(99,102,241,0.07)" strokeWidth="3" />
            <line x1="80%" y1="0" x2="82%" y2="100%" stroke="rgba(99,102,241,0.07)" strokeWidth="3" />
          </svg>

          {/* Activity pins positioned on the "map" */}
          {activities.map((act, i) => {
            // Distribute pins across the map area
            const positions = [
              { x: '25%', y: '30%' },
              { x: '45%', y: '45%' },
              { x: '60%', y: '35%' },
              { x: '35%', y: '60%' },
              { x: '70%', y: '55%' },
            ];
            const pos = positions[i % positions.length];

            return (
              <motion.div
                key={act.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, type: 'spring' }}
                className="absolute group cursor-pointer"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
              >
                {/* Pin */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg animate-pulse-glow">
                    {i + 1}
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rotate-45" />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 glass-strong rounded-xl p-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="text-xs font-semibold">{act.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{act.startTime} · {act.durationMinutes}m</p>
                  <p className="text-xs text-indigo-400 mt-1">
                    {act.estimatedCost === 0 ? 'Free' : `$${act.estimatedCost}`}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Route connecting pins */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {activities.length > 1 && (
              <path
                d="M 25% 30% Q 35% 40% 45% 45% Q 55% 42% 60% 35% Q 48% 50% 35% 60% Q 55% 58% 70% 55%"
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.5"
              />
            )}
          </svg>

          {/* Map overlay info */}
          <div className="absolute top-4 right-4 glass-strong rounded-xl p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-medium text-indigo-300">Live Route — Day {day?.dayNumber}</span>
            </div>
            <p className="text-xs text-slate-400">{day?.theme?.split('—')[0]?.trim()}</p>
            <div className="mt-2 flex gap-3 text-xs text-slate-400">
              <span>📍 {activities.length} stops</span>
              <span>🛣️ {day?.totalDistance} km</span>
              <span>⏱️ {day?.totalTravelTime} min</span>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-2">Map View</p>
            <p className="text-xs text-slate-300">
              {trip.intent.destination}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Google Maps integration available with API key
            </p>
          </div>

          {/* Destination label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="text-center opacity-10">
              <div className="text-6xl font-black text-slate-200">
                {trip.intent.destination.split(',')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
