import React from 'react';

export const StreamCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-neutral-900/40 border border-white/[0.05] animate-pulse">
      <div className="aspect-video w-full bg-neutral-800/60" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neutral-800/80 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-24 bg-neutral-800 rounded" />
            <div className="h-2.5 w-16 bg-neutral-850 rounded" />
          </div>
        </div>
        <div className="h-3 w-3/4 bg-neutral-800 rounded" />
        <div className="h-8 bg-neutral-800/50 rounded-lg" />
      </div>
    </div>
  );
};

export const FeaturedHeroSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-6 sm:p-8 animate-pulse">
      <div className="h-4 w-32 bg-neutral-800 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 aspect-video rounded-xl bg-neutral-800/80" />
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-neutral-800" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-neutral-800 rounded" />
              <div className="h-3 w-20 bg-neutral-850 rounded" />
            </div>
          </div>
          <div className="h-16 bg-neutral-850 rounded-xl" />
          <div className="h-12 bg-neutral-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
