'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '@/lib/types';

interface ActivityCardProps {
  activity: Activity;
  isExpanded: boolean;
  onToggle: () => void;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  attraction: { icon: '🏛️', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  restaurant: { icon: '🍽️', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  hotel: { icon: '🏨', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  transport: { icon: '🚇', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  experience: { icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  event: { icon: '🎭', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  shopping: { icon: '🛍️', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

const TRANSPORT_ICONS: Record<string, string> = {
  walking: '🚶', taxi: '🚕', 'public-transit': '🚇', 'rental-car': '🚗', bike: '🚲', mixed: '🔄',
};

export default function ActivityCard({ activity, isExpanded, onToggle }: ActivityCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const config = CATEGORY_CONFIG[activity.category] || { icon: '📍', color: 'text-slate-400', bg: 'bg-slate-400/10' };

  const confidenceColor =
    activity.confidenceScore >= 0.9 ? 'text-emerald-400' :
    activity.confidenceScore >= 0.75 ? 'text-amber-400' : 'text-rose-400';

  const confidenceBg =
    activity.confidenceScore >= 0.9 ? 'bg-emerald-400/10 border-emerald-400/20' :
    activity.confidenceScore >= 0.75 ? 'bg-amber-400/10 border-amber-400/20' : 'bg-rose-400/10 border-rose-400/20';

  return (
    <div className="ml-10">
      {/* Travel indicator from previous */}
      {activity.distanceFromPrevious !== undefined && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 ml-2">
          <span>{TRANSPORT_ICONS[activity.transportMode || 'mixed']}</span>
          <span>{activity.distanceFromPrevious} km · {activity.travelTimeFromPrevious} min transit</span>
        </div>
      )}

      <div
        className={`glass-card overflow-hidden transition-all ${activity.isCompleted ? 'opacity-60' : ''}`}
      >
        {/* Card Header */}
        <div
          className="p-4 cursor-pointer select-none"
          onClick={onToggle}
        >
          <div className="flex items-start gap-4">
            {/* Category Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${config.bg}`}>
              {config.icon}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="font-semibold text-base leading-tight">{activity.name}</h4>
                  <p className="text-sm text-slate-400 mt-0.5">{activity.location.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {activity.estimatedCost === 0 ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      `$${activity.estimatedCost}`
                    )}
                  </span>
                  <span className={`confidence-ring border ${confidenceBg} ${confidenceColor} text-xs font-bold`}>
                    {Math.round(activity.confidenceScore * 100)}
                  </span>
                </div>
              </div>

              {/* Time and duration */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  🕐 {activity.startTime} – {activity.endTime}
                </span>
                <span className="text-xs text-slate-400">
                  ⏱️ {activity.durationMinutes >= 60
                    ? `${Math.floor(activity.durationMinutes / 60)}h${activity.durationMinutes % 60 > 0 ? ` ${activity.durationMinutes % 60}m` : ''}`
                    : `${activity.durationMinutes}m`
                  }
                </span>
                {activity.rating && (
                  <span className="text-xs text-amber-400">
                    ⭐ {activity.rating}
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activity.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="tag text-xs">{tag}</span>
                ))}
              </div>
            </div>

            {/* Expand arrow */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-slate-500 flex-shrink-0 mt-1"
            >
              ▼
            </motion.div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                <div className="h-px bg-white/5" />

                {/* Cover image */}
                {activity.imageUrl && (
                  <div className="rounded-xl overflow-hidden h-40">
                    <img
                      src={activity.imageUrl}
                      alt={activity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed">{activity.description}</p>

                {/* Why included */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0">🤖</span>
                  <div>
                    <p className="text-xs font-medium text-indigo-300 mb-1">Why AI picked this</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{activity.reasonIncluded}</p>
                  </div>
                </div>

                {/* Location & Links */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    📍 {activity.location.address}
                  </span>
                  {activity.openingHours && (
                    <span className="text-xs text-slate-400">🕐 {activity.openingHours}</span>
                  )}
                  {activity.bookingUrl && (
                    <a
                      href={activity.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Book now →
                    </a>
                  )}
                </div>

                {/* Alternatives */}
                {activity.alternatives.length > 0 && (
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAlternatives(!showAlternatives); }}
                      className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span className="text-amber-400">⚡</span>
                      {activity.alternatives.length} alternative{activity.alternatives.length > 1 ? 's' : ''} available
                      <span>{showAlternatives ? '▲' : '▼'}</span>
                    </button>

                    <AnimatePresence>
                      {showAlternatives && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2 space-y-2"
                        >
                          {activity.alternatives.map((alt) => (
                            <div key={alt.id} className="glass rounded-xl p-3 border border-amber-400/10">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium">{alt.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{alt.description}</p>
                                  <p className="text-xs text-amber-400 mt-1">{alt.reasonAlternative}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-sm font-bold">${alt.estimatedCost}</div>
                                  <div className="text-xs text-slate-500">{alt.durationMinutes}m</div>
                                </div>
                              </div>
                              <button className="mt-2 text-xs btn-secondary py-1.5 w-full">
                                Switch to this →
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs py-1.5 flex-1">
                    ✓ Mark Done
                  </button>
                  <button className="btn-ghost text-xs py-1.5 flex-1">
                    ✕ Skip
                  </button>
                  <button className="btn-ghost text-xs py-1.5 flex-1">
                    🗺️ Map
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
