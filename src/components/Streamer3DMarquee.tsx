import React from 'react';
import { Radio, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { Creator } from '../types/index.js';

interface Streamer3DMarqueeProps {
  creators: Creator[];
  onNavigateToProfile?: (slug: string) => void;
  onNavigate?: (path: string) => void;
}

export const Streamer3DMarquee: React.FC<Streamer3DMarqueeProps> = ({
  creators,
  onNavigateToProfile,
  onNavigate,
}) => {
  if (!creators || creators.length === 0) return null;

  // Duplicate list to achieve seamless infinite looping marquee
  const marqueeItems = [...creators, ...creators, ...creators, ...creators];

  const formatLastLive = (lastLiveAt?: string, isLive?: boolean) => {
    if (isLive) {
      return { text: 'BROADCASTING NOW', isLive: true };
    }
    if (!lastLiveAt) {
      return { text: 'Recently in City', isLive: false };
    }
    const diffMs = Date.now() - new Date(lastLiveAt).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return { text: 'Live < 1h ago', isLive: false };
    if (hours < 24) return { text: `Last live ${hours}h ago`, isLive: false };
    if (days === 1) return { text: 'Last live yesterday', isLive: false };
    return { text: `Last live ${days}d ago`, isLive: false };
  };

  return (
    <div className="relative w-full py-8 overflow-hidden bg-neutral-950/60 border-y border-white/[0.06] select-none">
      {/* Subtle perspective backdrop effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-neutral-950 z-20 pointer-events-none" />

      {/* Header Tag */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-purple-400 uppercase">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Active Pioneer RP Streamers & Creator Roster</span>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('/streamers')}
            className="text-[11px] font-semibold text-neutral-400 hover:text-purple-300 transition-colors"
          >
            View All Streamers →
          </button>
        )}
      </div>

      {/* 3D Perspective Marquee Track */}
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex gap-4 animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] py-2">
          {marqueeItems.map((c, idx) => {
            const isLive = !!c.currentStream || !!c.isLive;
            const liveStatus = formatLastLive(c.lastLiveAt || undefined, isLive);

            return (
              <div
                key={`${c.id}-${idx}`}
                onClick={() => {
                  if (onNavigateToProfile) onNavigateToProfile(c.slug);
                }}
                className={`group relative flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/90 border transition-all duration-200 cursor-pointer whitespace-nowrap shadow-lg ${
                  isLive
                    ? 'border-red-500/50 shadow-red-950/30'
                    : 'border-white/10 hover:border-purple-500/40 hover:shadow-purple-950/20'
                }`}
                style={{
                  transform: 'perspective(1000px) rotateY(-2deg)',
                }}
              >
                {/* Profile Avatar with Live Ring */}
                <div className="relative">
                  <img
                    src={c.profileImageUrl || `https://avatar.vercel.sh/${c.slug}.png`}
                    alt={c.displayName}
                    className={`h-11 w-11 rounded-xl object-cover border ${
                      isLive ? 'border-red-500 ring-2 ring-red-500/30' : 'border-purple-500/30'
                    }`}
                  />
                  {isLive && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 ring-2 ring-neutral-950">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  )}
                </div>

                {/* Creator Details */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-white group-hover:text-purple-300 transition-colors">
                      {c.displayName}
                    </span>
                    {c.featured && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        STAR
                      </span>
                    )}
                  </div>

                  {/* Character Name / Faction */}
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {c.characterName || `@${c.platformAccount?.username || c.slug}`}
                  </span>

                  {/* Last Live or Live Indicator */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 font-mono">
                        <Radio className="h-2.5 w-2.5 animate-pulse text-red-400" />
                        <span>LIVE NOW</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                        <Clock className="h-2.5 w-2.5 text-neutral-600" />
                        <span>{liveStatus.text}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Twitch Link Icon */}
                {c.platformAccount?.channelUrl && (
                  <a
                    href={c.platformAccount.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-400 hover:bg-neutral-800 transition-colors"
                    title={`Open ${c.displayName}'s Twitch channel`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global CSS keyframes for infinite marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
