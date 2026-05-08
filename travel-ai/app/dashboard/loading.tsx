// P3: Next.js streaming loading UI for the dashboard route
export default function DashboardLoading() {
  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }} role="status" aria-label="Loading dashboard">
      {/* Sidebar skeleton */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 p-5 space-y-4">
        <div className="h-8 w-32 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 w-full rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-16 border-b border-white/5 flex items-center px-8 gap-4">
          <div className="h-6 w-48 rounded-lg bg-white/5 animate-pulse" />
          <div className="ml-auto flex gap-3">
            <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Day selector */}
        <div className="px-8 py-4 border-b border-white/5 flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>

        {/* Activity cards */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 w-full rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading your travel dashboard...</span>
    </div>
  );
}
