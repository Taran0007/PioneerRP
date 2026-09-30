import React, { useState } from 'react';
import { Eye, ExternalLink, Star, Copy, Check, ShoppingBag, Radio } from 'lucide-react';
import { Creator } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface FeaturedHeroCardProps {
  creator: Creator;
  onNavigateToProfile?: (slug: string) => void;
}

export const FeaturedHeroCard: React.FC<FeaturedHeroCardProps> = ({ creator, onNavigateToProfile }) => {
  const [copied, setCopied] = useState(false);
  const stream = creator.currentStream;
  const username = creator.platformAccount?.username || creator.slug;
  const watchUrl = creator.platformAccount?.channelUrl || `https://twitch.tv/${username}`;
  const storeUrl = creator.creatorStoreUrl || 'https://pioneer-rp-18.tebex.io/';
  const isLive = !!stream?.isLive;

  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent('watch_click', creator.id, { username, title: stream?.title, isFeatured: true });
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent('store_click', creator.id, { code: creator.creatorCode, storeUrl });
    window.open(storeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!creator.creatorCode) return;
    navigator.clipboard.writeText(creator.creatorCode);
    api.trackEvent('creator_code_click', creator.id, { code: creator.creatorCode });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const thumbnail = isLive && stream?.thumbnailUrl
    ? stream.thumbnailUrl
    : '/src/assets/images/streamer_offline_card_1790597889192.jpg';

  const avatar = creator.profileImageUrl || creator.platformAccount?.profileImageUrl || `https://avatar.vercel.sh/${username}.png`;

  return (
    <div
      onClick={() => onNavigateToProfile && onNavigateToProfile(creator.slug)}
      className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-purple-950/20 shadow-2xl shadow-purple-950/40 p-6 sm:p-8 cursor-pointer group transition-all duration-300 hover:border-purple-500/60"
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Tag */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold tracking-wider uppercase">
            <Star className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
            <span>FEATURED CREATOR</span>
          </span>
          {creator.gangName && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-white/5">
              {creator.gangName}
            </span>
          )}
        </div>

        {isLive ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>LIVE</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950/80 border border-white/10 text-white text-xs font-mono tabular-nums">
              <Eye className="h-3.5 w-3.5 text-red-400" />
              <span>{(stream?.viewerCount || 0).toLocaleString()} VIEWERS</span>
            </span>
          </div>
        ) : (
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-neutral-800/80 text-neutral-400 border border-white/5">
            CURRENTLY OFFLINE
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Stream Thumbnail or Visual Frame */}
        <div className="lg:col-span-7">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-neutral-950 shadow-xl group-hover:border-purple-500/40 transition-colors">
            <img
              src={thumbnail}
              alt={stream?.title || `${creator.displayName} Live Broadcast`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/images/streamer_offline_card_1790597889192.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

            {/* Platform Tag */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-bold rounded bg-neutral-950/80 backdrop-blur-md border border-white/10 text-purple-300">
                TWITCH
              </span>
              {isLive && stream?.category && (
                <span className="px-2 py-1 text-xs rounded bg-neutral-900/80 backdrop-blur-md border border-white/10 text-neutral-200">
                  {stream.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Creator Info, Code, and CTAs */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={creator.displayName}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-xl object-cover border-2 border-purple-500/50 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${username}.png`;
                }}
              />
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                  {creator.displayName}
                </h3>
                <div className="text-xs text-neutral-400">
                  @{username} {creator.characterName && `· ${creator.characterName}`}
                </div>
              </div>
            </div>

            {/* Current Stream Title or Bio */}
            {isLive ? (
              <p className="text-base font-semibold text-neutral-100 leading-snug line-clamp-3">
                “{stream?.title || 'Streaming live on Pioneer RP'}”
              </p>
            ) : (
              <p className="text-sm text-neutral-300 leading-relaxed line-clamp-3">
                {creator.bio || 'Official Pioneer RP Creator bringing gripping roleplay stories and high-intensity community events to life.'}
              </p>
            )}
          </div>

          {/* Creator Code Highlight Box */}
          {creator.creatorCode && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  CREATOR CODE
                </div>
                <div className="font-mono text-xl font-extrabold text-white tracking-widest mt-0.5">
                  {creator.creatorCode}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-purple-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleStoreClick}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-colors"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Use Code {creator.creatorCode}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleWatchClick}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all"
            >
              <Radio className="h-4 w-4" />
              <span>{isLive ? 'WATCH LIVE ON TWITCH' : 'VISIT TWITCH CHANNEL'}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </button>

            {onNavigateToProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToProfile(creator.slug);
                }}
                className="py-3 px-5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs tracking-wider border border-white/10 transition-colors"
              >
                PROFILE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
