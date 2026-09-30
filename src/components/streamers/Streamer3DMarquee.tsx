import React, { useRef } from 'react';
import { Radio, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { Creator } from '../../types/index.js';

interface Streamer3DMarqueeProps {
  creators: Creator[];
  onSelectCreator?: (creator: Creator) => void;
}

function formatLastLive(dateStr?: string | null): string {
  if (!dateStr) return 'Recently in city';
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 5) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const Streamer3DMarquee: React.FC<Streamer3DMarqueeProps> = ({
  creators,
  onSelectCreator,
}) => {
  if (!creators || creators.length === 0) return null;

  // Duplicate items for continuous smooth ticker loop
  const displayItems = [...creators, ...creators, ...creators];

  return (
    <div className="relative w-full overflow-hidden py-6 select-none group">
      {/* Label and Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pioneer RP Creator Roster</span>
          <span className="text-neutral-500 font-normal">({creators.length} Official Streamers)</span>
        </div>
        <div className="text-[11px] text-neutral-400 hidden sm:block">
          Hover to pause · Click card to view streamer
        </div>
      </div>

      {/* 3D Stage Container */}
      <div className="relative w-full overflow-hidden [perspective:1200px]">
        {/* Left & Right gradient edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-40 z-20 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-40 z-20 bg-gradient-to-l from-neutral-950 via-neutral-950/80 to-transparent" />

        {/* 3D Tilted Rail */}
        <div
          className="flex gap-4 w-max animate-marquee group-hover:[animation-play-state:paused] transition-transform duration-500 py-3 px-4"
          style={{
            transform: 'rotateX(5deg) translateZ(0)',
            transformStyle: 'preserve-3d',
          }}
        >
          {displayItems.map((creator, idx) => {
            const isLive = !!creator.currentStream?.isLive;
            const channelUrl = creator.platformAccount?.channelUrl || `https://twitch.tv/${creator.slug}`;

            return (
              <div
                key={`${creator.id}-${idx}`}
                onClick={() => onSelectCreator ? onSelectCreator(creator) : window.open(channelUrl, '_blank')}
                className="relative flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/10 hover:border-purple-500/50 shadow-xl shadow-purple-950/20 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 hover:shadow-purple-500/20 w-[280px] sm:w-[310px] shrink-0"
              >
                {/* Avatar with Status Halo */}
                <div className="relative shrink-0">
                  <div
                    className={`h-13 w-13 rounded-xl overflow-hidden border-2 transition-all ${
                      isLive
                        ? 'border-emerald-500 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-500/30'
                        : 'border-purple-500/40 group-hover:border-purple-400'
                    }`}
                  >
                    <img
                      src={creator.profileImageUrl || `https://avatar.vercel.sh/${creator.slug}.png`}
                      alt={creator.displayName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Pulsing Live indicator or Status pip */}
                  {isLive ? (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-neutral-950"></span>
                    </span>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-neutral-700 border-2 border-neutral-950"></span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs truncate">
                      {creator.displayName}
                    </span>
                    {creator.verified && (
                      <span className="text-[10px] text-purple-400 shrink-0 font-mono">✓</span>
                    )}
                  </div>

                  <div className="text-[11px] text-neutral-400 truncate">
                    {creator.characterName || `@${creator.platformAccount?.username || creator.slug}`}
                  </div>

                  {/* Live or Last Live Status */}
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    {isLive ? (
                      <div className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        <span>LIVE NOW</span>
                        {creator.currentStream?.viewerCount !== undefined && (
                          <span className="font-mono text-emerald-300">
                            · {creator.currentStream.viewerCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-neutral-400 bg-neutral-950/60 px-1.5 py-0.5 rounded border border-white/5">
                        <Clock className="h-2.5 w-2.5 text-neutral-500" />
                        <span>Last live:</span>
                        <span className="font-semibold text-neutral-300">
                          {formatLastLive(creator.lastLiveAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* External link button */}
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-purple-600 text-neutral-400 hover:text-white transition-colors shrink-0"
                  title="Watch on Twitch"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
