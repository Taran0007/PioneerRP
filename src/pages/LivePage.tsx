import React from 'react';
import { Radio, RefreshCw, Users } from 'lucide-react';
import { Creator, SiteSettings } from '../types/index.js';
import { LiveStreamCard } from '../components/LiveStreamCard.js';
import { StreamCardSkeleton } from '../components/LoadingSkeleton.js';

interface LivePageProps {
  liveCreators: Creator[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateToProfile: (slug: string) => void;
  onNavigate: (path: string) => void;
  settings: SiteSettings | null;
}

export const LivePage: React.FC<LivePageProps> = ({
  liveCreators,
  loading,
  onRefresh,
  onNavigateToProfile,
  onNavigate,
}) => {
  const totalViewers = liveCreators.reduce(
    (acc, c) => acc + (c.currentStream?.viewerCount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest mb-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            Twitch Broadcasts
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>LIVE NOW</span>
            <span className="text-sm font-mono px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400">
              {liveCreators.length} ONLINE
            </span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Watch registered Pioneer RP creators currently broadcasting their stories on Twitch.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {liveCreators.length > 0 && (
            <div className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs font-mono text-neutral-300">
              <span className="text-neutral-500">TOTAL VIEWERS:</span>{' '}
              <strong className="text-white">{totalViewers.toLocaleString()}</strong>
            </div>
          )}

          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Streams</span>
          </button>
        </div>
      </div>

      {/* Grid of Streams */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StreamCardSkeleton />
          <StreamCardSkeleton />
          <StreamCardSkeleton />
          <StreamCardSkeleton />
          <StreamCardSkeleton />
          <StreamCardSkeleton />
        </div>
      ) : liveCreators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveCreators.map(creator => (
            <LiveStreamCard
              key={creator.id}
              creator={creator}
              onNavigateToProfile={onNavigateToProfile}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/30 p-16 text-center max-w-2xl mx-auto my-8 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800/80 border border-white/5 text-neutral-400">
            <Radio className="h-8 w-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-white tracking-wide uppercase">
              NO ONE’S LIVE RIGHT NOW
            </h3>
            <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
              Check back soon — Pioneer RP creators will appear here when they go live.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/streamers')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Browse All Pioneer RP Creators</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
