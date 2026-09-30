import React from 'react';
import { Eye, ExternalLink, Star, Tv, User, ArrowUpRight } from 'lucide-react';
import { Creator } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface StreamerCardProps {
  creator: Creator;
  onNavigateToProfile: (slug: string) => void;
}

export const StreamerCard: React.FC<StreamerCardProps> = ({ creator, onNavigateToProfile }) => {
  const isLive = !!creator.currentStream?.isLive;
  const stream = creator.currentStream;
  const username = creator.platformAccount?.username || creator.slug;
  const channelUrl = creator.platformAccount?.channelUrl || `https://twitch.tv/${username}`;
  const avatar = creator.profileImageUrl || creator.platformAccount?.profileImageUrl || `https://avatar.vercel.sh/${username}.png`;

  const handleOpenTwitch = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent('watch_click', creator.id, { username, isLive });
    window.open(channelUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onNavigateToProfile(creator.slug)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-white/[0.07] hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20 transition-all duration-200 cursor-pointer p-4 justify-between"
    >
      <div>
        {/* Top Header: Avatar + Status + Featured */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatar}
                alt={creator.displayName}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-xl object-cover border border-white/10 group-hover:border-purple-500/50 transition-colors"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${username}.png`;
                }}
              />
              <span
                className={`absolute -bottom-1 -right-1 block h-3.5 w-3.5 rounded-full ring-2 ring-neutral-950 ${
                  isLive ? 'bg-red-500' : 'bg-neutral-600'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                  {creator.displayName}
                </h4>
              </div>
              <div className="text-[11px] text-neutral-400">
                @{username}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-800/90 text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                OFFLINE
              </span>
            )}

            {creator.featured && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-400">
                <Star className="h-2.5 w-2.5 fill-purple-400" />
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Character & Gang info */}
        {(creator.characterName || creator.gangName) && (
          <div className="mb-2 text-xs flex items-center gap-2 flex-wrap text-neutral-300">
            {creator.characterName && (
              <span className="flex items-center gap-1 text-neutral-300">
                <User className="h-3 w-3 text-neutral-500" />
                <span className="truncate">{creator.characterName}</span>
              </span>
            )}
            {creator.gangName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/30 text-purple-300 font-medium">
                {creator.gangName}
              </span>
            )}
          </div>
        )}

        {/* Live Stream Title or Bio */}
        {isLive && stream?.title ? (
          <div className="my-2 p-2 rounded-lg bg-neutral-950/60 border border-white/5 space-y-1">
            <p className="text-xs text-neutral-200 line-clamp-1 font-medium">
              {stream.title}
            </p>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1 text-red-400">
                <Eye className="h-3 w-3" />
                {(stream.viewerCount || 0).toLocaleString()} viewers
              </span>
              <span>{stream.category || 'GTA V'}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400 line-clamp-2 my-2 leading-relaxed">
            {creator.bio || 'Pioneer RP creator actively participating in city storylines and community roleplay.'}
          </p>
        )}
      </div>

      {/* Footer Details: Code & Buttons */}
      <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2 mt-2">
        {creator.creatorCode ? (
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-purple-950/30 text-purple-300 border border-purple-800/20">
            CODE: <strong>{creator.creatorCode}</strong>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Tv className="h-3 w-3" />
            Twitch
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenTwitch}
            title="Open Twitch Channel"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onNavigateToProfile(creator.slug)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-semibold transition-colors"
          >
            <span>Profile</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
