import React from 'react';
import { Radio, Users, Star, ArrowRight, ShieldAlert, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { Creator, SiteSettings } from '../types/index.js';
import { LiveStreamCard } from '../components/LiveStreamCard.js';
import { FeaturedHeroCard } from '../components/FeaturedHeroCard.js';
import { StreamerCard } from '../components/StreamerCard.js';
import { ServerStatusWidget } from '../components/ServerStatusWidget.js';
import { StreamCardSkeleton, FeaturedHeroSkeleton } from '../components/LoadingSkeleton.js';
import { Streamer3DMarquee } from '../components/Streamer3DMarquee.js';

interface HomePageProps {
  liveCreators: Creator[];
  featuredCreators: Creator[];
  allCreators: Creator[];
  settings: SiteSettings | null;
  loading: boolean;
  onNavigate: (path: string) => void;
  onNavigateToProfile: (slug: string) => void;
  onRefresh: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  liveCreators,
  featuredCreators,
  allCreators,
  settings,
  loading,
  onNavigate,
  onNavigateToProfile,
  onRefresh,
}) => {
  const storeUrl = settings?.storeUrl || 'https://pioneer-rp-18.tebex.io/';
  const joinUrl = settings?.serverJoinUrl || 'fivem://connect/cfx.re/join/pioneer-rp';
  const headline = settings?.heroHeadline || 'PIONEER RP LIVE';
  const subheading = settings?.heroSubheading || 'The city is live. Watch the stories unfold.';

  // Top live featured creator if any
  const liveFeatured = featuredCreators.filter(c => !!c.currentStream?.isLive);
  const primaryFeatured = liveFeatured.length > 0 ? liveFeatured[0] : featuredCreators[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative flex min-h-[460px] items-center overflow-hidden border-b border-white/[0.08] lg:min-h-[520px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/pioneer_city_hero_1790597857284.jpg"
            alt="Pioneer RP City at Night"
            className="h-full w-full object-cover object-center opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/75 to-neutral-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/20" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(15rem,0.75fr)] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <img
                src="/pioneer-logo.png"
                alt="Pioneer RP emblem"
                className="h-12 w-12 shrink-0 object-contain"
              />
              <div>
                <p className="text-sm font-semibold text-white">Pioneer RP</p>
                <p className="text-xs text-neutral-300">Creator network</p>
              </div>
            </div>

            <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white text-balance normal-case sm:text-5xl lg:text-6xl">
              {headline}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-200 text-balance sm:text-base">
              {subheading}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  const el = document.getElementById('live-now-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else onNavigate('/live');
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-6 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-200 sm:w-auto"
              >
                <Radio className="h-4 w-4" />
                <span>Watch live</span>
              </button>

              <button
                onClick={() => onNavigate('/streamers')}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-neutral-950/70 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 sm:w-auto"
              >
                <Users className="h-4 w-4" />
                <span>Browse streamers</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 border-t border-white/20 pt-5 lg:ml-auto lg:block lg:max-w-xs lg:border-l lg:border-t-0 lg:pb-1 lg:pl-6 lg:pt-0">
            <div className="font-display text-5xl font-bold leading-none tabular-nums text-white sm:text-6xl">
              {liveCreators.length}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {liveCreators.length === 1 ? 'Creator live now' : 'Creators live now'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-300">
                {allCreators.length} Pioneer RP creators on Twitch
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE NOW SECTION (Primary functional section) */}
      <section id="live-now-section" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest mb-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              Real-Time Broadcasts
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>LIVE NOW</span>
              {liveCreators.length > 0 && (
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300">
                  {liveCreators.length}
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Pioneer RP creators currently streaming on Twitch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              title="Refresh live status"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>

            {liveCreators.length > 0 && (
              <button
                onClick={() => onNavigate('/live')}
                className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>View Full Live Grid</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          /* Empty State as requested in Specification Section 11 */
          <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/30 p-12 text-center max-w-2xl mx-auto my-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800/80 border border-white/5 text-neutral-400">
              <Radio className="h-7 w-7 opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                NO ONE’S LIVE RIGHT NOW
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                Check back soon — Pioneer RP creators will appear here automatically when they go live on Twitch.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/streamers')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Browse All Streamers</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <Streamer3DMarquee
        creators={allCreators}
        onNavigateToProfile={onNavigateToProfile}
        onNavigate={onNavigate}
      />

      {/* 3. FEATURED CREATORS SECTION */}
      {primaryFeatured && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">
                Spotlight
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                FEATURED CREATORS
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/featured')}
              className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>View All Featured</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <FeaturedHeroSkeleton />
          ) : (
            <FeaturedHeroCard
              creator={primaryFeatured}
              onNavigateToProfile={onNavigateToProfile}
            />
          )}
        </section>
      )}

      {/* 4. ALL PIONEER RP STREAMERS DIRECTORY PREVIEW */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
              Community Roster
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PIONEER RP STREAMERS
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Meet the registered creators bringing Pioneer RP to life every day.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/streamers')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-colors self-start sm:self-auto"
          >
            <span>All {allCreators.length} Streamers</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {allCreators.slice(0, 4).map(creator => (
            <StreamerCard
              key={creator.id}
              creator={creator}
              onNavigateToProfile={onNavigateToProfile}
            />
          ))}
        </div>
      </section>

      {/* 5. PIONEER RP SERVER SHOWCASE & TEBEX STORE CTA */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/src/assets/images/pioneer_server_showcase_1790597870249.jpg"
              alt="Pioneer RP Server"
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent" />
          </div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-semibold text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>OFFICIAL FIVEM SERVER & COMMUNITY</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-tight">
              EXPERIENCE THE STORIES IN FIRST PERSON
            </h2>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Step into Los Santos with custom vehicles, criminal syndicates, emergency services, and deeply immersive roleplay. Support your favorite creators by using their creator codes at checkout.
            </p>

            {/* Server Status Widget embedded */}
            <div className="pt-2">
              <ServerStatusWidget settings={settings} />
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all"
              >
                <span>Visit Tebex Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <a
                href={joinUrl}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-all"
              >
                <span>Connect with FiveM</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
