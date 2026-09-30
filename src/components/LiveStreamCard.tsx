import React from 'react';
import { Eye, ExternalLink, Star, Copy, Check, Tv } from 'lucide-react';
import { Creator } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface LiveStreamCardProps {
  creator: Creator;
  onNavigateToProfile?: (slug: string) => void;
}

export const LiveStreamCard: React.FC<LiveStreamCardProps> = ({ creator, onNavigateToProfile }) => {
  const [copied, setCopied] = React.useState(false);
  const stream = creator.currentStream;
  const username = creator.platformAccount?.username || creator.slug;
  const watchUrl = creator.platformAccount?.channelUrl || `https://twitch.tv/${username}`;

  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent('watch_click', creator.id, { username, title: stream?.title });
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!creator.creatorCode) return;
    navigator.clipboard.writeText(creator.creatorCode);
    api.trackEvent('creator_code_click', creator.id, { code: creator.creatorCode });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile(creator.slug);
    } else {
      window.open(watchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Thumbnail fallback if missing
  const thumbnail = stream?.thumbnailUrl || '/src/assets/images/streamer_offline_card_1790597889192.jpg';
  const avatar = creator.profileImageUrl || creator.platformAccount?.profileImageUrl || `https://avatar.vercel.sh/${username}.png`;

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/80 border border-white/[0.08] hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/30 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
        <img
          src={thumbnail}
          alt={stream?.title || `${creator.displayName} Live Stream`}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            // Fallback image if Twitch thumbnail placeholder fails
            (e.target as HTMLImageElement).src = '/src/assets/images/streamer_offline_card_1790597889192.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

        {/* Top Badges: LIVE indicator & Viewer Count */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/90 text-white text-[11px] font-bold tracking-wider uppercase shadow-md backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>LIVE</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-950/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium font-mono tabular-nums shadow-md">
            <Eye className="h-3 w-3 text-red-400" />
            <span>{(stream?.viewerCount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Featured Tag if applicable */}
        {creator.featured && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/90 border border-purple-500/40 text-purple-200 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-xs">
            <Star className="h-2.5 w-2.5 fill-purple-400 text-purple-400" />
            <span>Featured</span>
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute bottom-2 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900/90 border border-white/10 text-purple-300 text-[10px] font-medium">
          <Tv className="h-2.5 w-2.5" />
          <span>TWITCH</span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
        {/* Streamer Avatar + Names */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={creator.displayName}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-lg object-cover border border-purple-500/30"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${username}.png`;
              }}
            />
            <span className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-neutral-900" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-white truncate group-hover:text-purple-300 transition-colors">
                {creator.displayName}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
              <span>@{username}</span>
              {creator.characterName && (
                <>
                  <span>·</span>
                  <span className="text-neutral-300 truncate">{creator.characterName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-medium text-neutral-200 line-clamp-2 leading-relaxed">
          {stream?.title || 'Streaming live on Pioneer RP'}
        </p>

        {/* Category & Gang info */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-white/[0.05] pt-2">
          <span className="truncate max-w-[150px]">{stream?.category || 'Grand Theft Auto V'}</span>
          {creator.gangName && (
            <span className="text-purple-400 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/30">
              {creator.gangName}
            </span>
          )}
        </div>

        {/* Bottom Actions: Creator Code & Watch Live */}
        <div className="pt-1 flex items-center justify-between gap-2">
          {creator.creatorCode ? (
            <button
              onClick={handleCopyCode}
              title={`Click to copy code: ${creator.creatorCode}`}
              className="flex items-center gap-1 text-[11px] font-mono px-2 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-300 font-sans text-[10px]">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-purple-400" />
                  <span>CODE: <strong className="text-white font-bold">{creator.creatorCode}</strong></span>
                </>
              )}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleWatchClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-neutral-800 hover:bg-purple-600 text-white border border-white/10 hover:border-purple-400 transition-all shadow-sm group-hover:bg-purple-600 ml-auto"
          >
            <span>WATCH LIVE</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
