import React from 'react';
import { Star, Radio, ArrowRight } from 'lucide-react';
import { Creator } from '../types/index.js';
import { FeaturedHeroCard } from '../components/FeaturedHeroCard.js';
import { StreamerCard } from '../components/StreamerCard.js';

interface FeaturedPageProps {
  featuredCreators: Creator[];
  onNavigateToProfile: (slug: string) => void;
  onNavigate: (path: string) => void;
}

export const FeaturedPage: React.FC<FeaturedPageProps> = ({
  featuredCreators,
  onNavigateToProfile,
  onNavigate,
}) => {
  const liveFeatured = featuredCreators.filter(c => !!c.currentStream?.isLive);
  const offlineFeatured = featuredCreators.filter(c => !c.currentStream?.isLive);

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">
          <Star className="h-3.5 w-3.5 fill-purple-400" />
          <span>Hand-Picked Spotlight</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          FEATURED CREATORS
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
          Highlighted creators and flagship roleplayers on the Pioneer RP FiveM server. Featured status is manually curated by the server administration.
        </p>
      </div>

      {/* Featured Streamers Showcase */}
      {featuredCreators.length > 0 ? (
        <div className="space-y-8">
          {/* If there are live featured creators, render the primary hero card */}
          {liveFeatured.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>Featured Creators Broadcasting Right Now</span>
              </div>
              <FeaturedHeroCard
                creator={liveFeatured[0]}
                onNavigateToProfile={onNavigateToProfile}
              />
            </div>
          )}

          {/* All featured creators list */}
          <div className="space-y-4 pt-4">
            <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">
              ALL FEATURED CREATORS ({featuredCreators.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredCreators.map(creator => (
                <StreamerCard
                  key={creator.id}
                  creator={creator}
                  onNavigateToProfile={onNavigateToProfile}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/30 p-16 text-center max-w-md mx-auto space-y-3">
          <Star className="h-10 w-10 text-neutral-600 mx-auto" />
          <h3 className="font-display text-lg font-bold text-white">No Featured Creators</h3>
          <p className="text-xs text-neutral-400">
            Featured streamers will appear here once designated in the Admin Panel.
          </p>
        </div>
      )}
    </div>
  );
};
