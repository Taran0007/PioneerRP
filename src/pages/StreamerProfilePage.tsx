import React, { useEffect, useState } from 'react';
import { Radio, Eye, ExternalLink, Star, Copy, Check, ShoppingBag, Tv, User, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Creator, LiveStream } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface StreamerProfilePageProps {
  slug: string;
  onNavigateBack: () => void;
}

export const StreamerProfilePage: React.FC<StreamerProfilePageProps> = ({
  slug,
  onNavigateBack,
}) => {
  const [creator, setCreator] = useState<(Creator & { streamHistory?: LiveStream[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api.getStreamerBySlug(slug)
      .then(res => {
        if (mounted) setCreator(res.data);
      })
      .catch(err => {
        if (mounted) setError(err.message || 'Streamer not found');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 py-16 px-4 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-48 rounded-2xl bg-neutral-900" />
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-neutral-850" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-neutral-850 rounded" />
            <div className="h-4 w-28 bg-neutral-850 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-neutral-950 py-20 px-4 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-display text-2xl font-bold text-white">Streamer Not Found</h2>
        <p className="text-sm text-neutral-400">
          The creator profile you are looking for may have been removed or does not exist.
        </p>
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </button>
      </div>
    );
  }

  const isLive = !!creator.currentStream?.isLive;
  const stream = creator.currentStream;
  const username = creator.platformAccount?.username || creator.slug;
  const channelUrl = creator.platformAccount?.channelUrl || `https://twitch.tv/${username}`;
  const storeUrl = creator.creatorStoreUrl || 'https://pioneer-rp-18.tebex.io/';
  const avatar = creator.profileImageUrl || creator.platformAccount?.profileImageUrl || `https://avatar.vercel.sh/${username}.png`;

  const handleWatchLive = () => {
    api.trackEvent('watch_click', creator.id, { username, isLive });
    window.open(channelUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCode = () => {
    if (!creator.creatorCode) return;
    navigator.clipboard.writeText(creator.creatorCode);
    api.trackEvent('creator_code_click', creator.id, { code: creator.creatorCode });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStoreClick = () => {
    api.trackEvent('store_click', creator.id, { code: creator.creatorCode, storeUrl });
    window.open(storeUrl, '_blank', 'noopener,noreferrer');
  };

  // Formatted duration
  const getStreamDuration = (startedAt: string) => {
    try {
      const diffMs = Date.now() - new Date(startedAt).getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      {/* Back button header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Streamers</span>
        </button>
      </div>

      {/* Hero Banner Frame */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-neutral-900 h-48 sm:h-64">
          <img
            src={creator.bannerUrl || '/src/assets/images/pioneer_city_hero_1790597857284.jpg'}
            alt="Profile Banner"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Profile Card Header overlay */}
        <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="relative">
              <img
                src={avatar}
                alt={creator.displayName}
                referrerPolicy="no-referrer"
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 border-neutral-950 bg-neutral-900 shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${username}.png`;
                }}
              />
              <span
                className={`absolute bottom-2 right-2 h-4 w-4 rounded-full ring-2 ring-neutral-950 ${
                  isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {creator.displayName}
                </h1>
                {creator.featured && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-[11px] font-bold">
                    <Star className="h-3 w-3 fill-purple-400" />
                    FEATURED
                  </span>
                )}
                {isLive ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    LIVE NOW
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase">
                    OFFLINE
                  </span>
                )}
              </div>

              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>@{username}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-purple-400">
                  <Tv className="h-3 w-3" />
                  Twitch Partner/Affiliate
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleWatchLive}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isLive
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  : 'bg-neutral-850 hover:bg-neutral-800 text-white border border-white/10'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>{isLive ? 'Watch Live on Twitch' : 'Open Twitch Channel'}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* LIVE BROADCAST PANEL OR OFFLINE PANEL */}
            {isLive && stream ? (
              <div className="rounded-2xl border border-red-500/30 bg-neutral-900/80 p-6 space-y-4 shadow-xl shadow-red-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-display font-bold text-sm text-red-400 uppercase tracking-wider">
                      CURRENTLY BROADCASTING
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-red-400" />
                      <strong>{(stream.viewerCount || 0).toLocaleString()}</strong> viewers
                    </span>
                    {stream.startedAt && (
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Clock className="h-3.5 w-3.5" />
                        Live for {getStreamDuration(stream.startedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stream Preview Frame */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-neutral-950">
                  <img
                    src={stream.thumbnailUrl || '/src/assets/images/streamer_offline_card_1790597889192.jpg'}
                    alt={stream.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/streamer_offline_card_1790597889192.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent flex items-end p-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-200">
                        {stream.category}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white line-clamp-2">
                        {stream.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleWatchLive}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 transition-all"
                  >
                    <span>Watch Full Stream On Twitch</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-neutral-900/40 p-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    STREAM STATUS
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Currently Offline
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {creator.displayName} is not broadcasting at this moment. You can visit their channel or check back during their next scheduled session.
                  </p>
                </div>
                <button
                  onClick={handleWatchLive}
                  className="px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold whitespace-nowrap border border-white/10"
                >
                  Visit Channel
                </button>
              </div>
            )}

            {/* About / Bio */}
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
                ABOUT THE CREATOR
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {creator.bio || 'Pioneer RP streamer actively participating in city storylines and community roleplay events.'}
              </p>

              {/* Character & Gang badges */}
              <div className="pt-2 flex flex-wrap gap-4 border-t border-white/[0.06]">
                {creator.characterName && (
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      CHARACTER NAME
                    </div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-purple-400" />
                      <span>{creator.characterName}</span>
                    </div>
                  </div>
                )}

                {creator.gangName && (
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      AFFILIATION / GANG
                    </div>
                    <div className="text-sm font-semibold text-purple-300">
                      {creator.gangName}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stream History / VODs */}
            {creator.streamHistory && creator.streamHistory.length > 0 && (
              <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 space-y-4">
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span>RECENT RECORDED BROADCASTS</span>
                </h3>
                <div className="space-y-3">
                  {creator.streamHistory.map(hist => (
                    <div
                      key={hist.id}
                      className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {hist.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                          <span>{hist.category}</span>
                          <span>·</span>
                          <span>{new Date(hist.startedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-neutral-300 shrink-0">
                        {hist.viewerCount.toLocaleString()} peak viewers
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* CREATOR CODE WIDGET */}
            {creator.creatorCode && (
              <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-neutral-900 p-6 space-y-4 shadow-xl shadow-purple-950/20">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                    OFFICIAL CREATOR CODE
                  </div>
                  <h4 className="font-display text-xl font-extrabold text-white tracking-wide">
                    SUPPORT {creator.displayName.toUpperCase()}
                  </h4>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {creator.creatorCodeDescription ||
                    `Use code ${creator.creatorCode} at the Pioneer RP Tebex store during checkout to support this creator directly.`}
                </p>

                {/* Code display box */}
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-purple-500/30 flex items-center justify-between">
                  <span className="font-mono text-xl font-extrabold text-white tracking-widest">
                    {creator.creatorCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Store button */}
                <button
                  onClick={handleStoreClick}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-purple-500/30 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 text-purple-400" />
                  <span>USE CODE AT STORE</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </button>
              </div>
            )}

            {/* Quick Links & Verification Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 space-y-4">
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                COMMUNITY DETAILS
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-neutral-400">Platform</span>
                  <span className="font-semibold text-white">Twitch</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-neutral-400">Pioneer Streamer</span>
                  <span className="font-semibold text-emerald-400">Verified</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-neutral-400">Channel</span>
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <span>twitch.tv/{username}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
