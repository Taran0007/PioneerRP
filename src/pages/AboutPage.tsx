import React from 'react';
import { Radio, Star, ShoppingBag, Shield, ExternalLink, Users, Tv } from 'lucide-react';
import { SiteSettings } from '../types/index.js';

interface AboutPageProps {
  settings: SiteSettings | null;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigate }) => {
  const storeUrl = settings?.storeUrl || 'https://pioneer-rp-18.tebex.io/';
  const discordUrl = settings?.discordUrl || 'https://discord.gg/pioneerrp';

  return (
    <div className="min-h-screen bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left border-b border-white/[0.08] pb-8">
        <div className="text-xs font-bold uppercase tracking-widest text-purple-400">
          About The Platform
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          PIONEER RP LIVE
        </h1>
        <p className="text-base text-neutral-300 max-w-2xl leading-relaxed">
          Pioneer RP Live was built from the ground up to give community members, viewers, and roleplay fans an instant window into what is happening across the city right now.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-3">
          <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Radio className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            Real-Time Live Telemetry
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Our background synchronization engine monitors registered creators every 30–60 seconds directly through the official Twitch API. The moment a streamer starts broadcasting, their live stream, title, and viewer count update instantly.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-3">
          <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Star className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            Curated Creators
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Instead of indexing thousands of random GTA streams, Pioneer RP Live features an approved roster of verified roleplayers. Every listed streamer has an established character and presence inside Pioneer RP.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-3">
          <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            Creator Codes
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Support your favorite roleplayers directly! Creator codes can be copied with one click and entered into the Pioneer RP Tebex store at checkout.
          </p>
        </div>
      </div>

      {/* Detailed FAQ / Explanation */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">
          HOW IT WORKS
        </h2>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-neutral-900/40 border border-white/[0.06] space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span>How are streamers added to the directory?</span>
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Streamers are manually registered through the Pioneer RP Live Admin Panel. The backend resolves the streamer’s official Twitch user ID and initiates automated polling. We do not automatically discover random streams.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-neutral-900/40 border border-white/[0.06] space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Tv className="h-4 w-4 text-purple-400" />
              <span>What platforms are supported?</span>
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Version 1 is built specifically for Twitch with official API verification. The underlying database schema is architected with platform abstractions so Kick and other video platforms can be enabled in future versions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-neutral-900/40 border border-white/[0.06] space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              <span>Official Disclaimer</span>
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Pioneer RP Live is a dedicated streaming community hub created for the Pioneer RP FiveM roleplay community. Grand Theft Auto and FiveM are registered trademarks of their respective copyright owners.
            </p>
          </div>
        </div>
      </div>

      {/* Community Links CTA */}
      <div className="p-8 rounded-2xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-display text-xl font-bold text-white">
            Join the Pioneer RP Community
          </h3>
          <p className="text-xs text-neutral-400">
            Connect with thousands of roleplayers, apply for whitelist, or join the discussion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
          >
            <span>Join Discord</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold border border-white/10 transition-colors"
          >
            <span>Server Store</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
