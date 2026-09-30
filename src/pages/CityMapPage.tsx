import React, { useState } from 'react';
import {
  MapPin, Shield, Heart, Scale, Skull, Wrench, Radio,
  Tv, Eye, ExternalLink, Plus, Filter, Navigation, Compass, Layers
} from 'lucide-react';
import { Creator } from '../types/index.js';

interface CityMapPageProps {
  creators: Creator[];
  onNavigateToProfile: (slug: string) => void;
  onNavigateToSquad?: (streamers: string[]) => void;
}

interface DistrictPoint {
  id: string;
  name: string;
  subname: string;
  category: 'POLICE' | 'EMS' | 'DOJ' | 'SYNDICATE' | 'CIVILIAN' | 'LANDMARK';
  description: string;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  associatedStreamerSlug?: string;
}

const DISTRICT_LANDMARKS: DistrictPoint[] = [
  {
    id: 'mission-row',
    name: 'Mission Row Police Dept',
    subname: 'LSPD Headquarters',
    category: 'POLICE',
    description: 'Central Command for the Los Santos Police Department. High-speed unit dispatches and booking operations.',
    x: 52,
    y: 56,
    associatedStreamerSlug: 'tj-singh007',
  },
  {
    id: 'pillbox-hill',
    name: 'Pillbox Hill Medical Center',
    subname: 'EMS & Trauma Center',
    category: 'EMS',
    description: 'Primary emergency triage and trauma surgery clinic in downtown Los Santos. Home base of Pillbox EMS.',
    x: 48,
    y: 51,
    associatedStreamerSlug: 'ithebunny',
  },
  {
    id: 'doj-courthouse',
    name: 'San Andreas Department of Justice',
    subname: 'Los Santos Courthouse',
    category: 'DOJ',
    description: 'Where major trials, bail hearings, appeals, and landmark roleplay legal proceedings are adjudicated.',
    x: 55,
    y: 53,
  },
  {
    id: 'legion-square',
    name: 'Legion Square',
    subname: 'Community Center & Plaza',
    category: 'LANDMARK',
    description: 'The pulsing heart of city social life. Impromptu gatherings, spontaneous roleplay, and community meetings.',
    x: 50,
    y: 54,
  },
  {
    id: 'syndicate-docks',
    name: 'Port of Los Santos Docks',
    subname: 'Syndicate Cargo Terminal',
    category: 'SYNDICATE',
    description: 'Industrial shipping yards, container warehouses, and underworld trading grounds controlled by syndicates.',
    x: 57,
    y: 78,
    associatedStreamerSlug: 'apocalypticsith',
  },
  {
    id: 'vinewood-boulevard',
    name: 'Vinewood Strip & Nightlife',
    subname: 'Entertainment District',
    category: 'CIVILIAN',
    description: 'Luxury shops, clubs, comedy nights, and high-end vehicle cruising along the famous boulevard.',
    x: 44,
    y: 42,
    associatedStreamerSlug: 'moxiemoses',
  },
  {
    id: 'ls-customs-burton',
    name: 'Los Santos Customs (Burton)',
    subname: 'Tuning & Performance Shop',
    category: 'CIVILIAN',
    description: 'Top-tier mechanics shop for engine swaps, nitro setups, custom paint, and vehicle bodywork.',
    x: 45,
    y: 48,
  },
  {
    id: 'sandy-shores',
    name: 'Sandy Shores Outpost',
    subname: 'Blaine County Medical & Sheriff',
    category: 'LANDMARK',
    description: 'The rugged desert frontier. Off-road chases, desert outlaws, and county sheriff patrols around the Alamo Sea.',
    x: 62,
    y: 28,
  },
];

export const CityMapPage: React.FC<CityMapPageProps> = ({
  creators,
  onNavigateToProfile,
  onNavigateToSquad,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<DistrictPoint | null>(DISTRICT_LANDMARKS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredPoints = DISTRICT_LANDMARKS.filter(pt => {
    if (categoryFilter === 'ALL') return true;
    return pt.category === categoryFilter;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'POLICE':
        return { text: 'text-blue-400', bg: 'bg-blue-600', ring: 'ring-blue-500/50', border: 'border-blue-500/40' };
      case 'EMS':
        return { text: 'text-rose-400', bg: 'bg-rose-600', ring: 'ring-rose-500/50', border: 'border-rose-500/40' };
      case 'DOJ':
        return { text: 'text-amber-400', bg: 'bg-amber-600', ring: 'ring-amber-500/50', border: 'border-amber-500/40' };
      case 'SYNDICATE':
        return { text: 'text-purple-400', bg: 'bg-purple-600', ring: 'ring-purple-500/50', border: 'border-purple-500/40' };
      case 'CIVILIAN':
        return { text: 'text-emerald-400', bg: 'bg-emerald-600', ring: 'ring-emerald-500/50', border: 'border-emerald-500/40' };
      default:
        return { text: 'text-neutral-300', bg: 'bg-neutral-600', ring: 'ring-white/20', border: 'border-white/20' };
    }
  };

  const associatedCreator = selectedPoint?.associatedStreamerSlug
    ? creators.find(c => c.slug.toLowerCase() === selectedPoint.associatedStreamerSlug?.toLowerCase())
    : null;

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1 flex items-center gap-2">
            <Compass className="h-3.5 w-3.5" />
            <span>Los Santos Roleplay Atlas</span>
          </div>
          <h1 className="max-w-full font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance break-words">
            INTERACTIVE CITY MAP & DISTRICTS
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Explore Pioneer RP key landmarks, faction headquarters, and where city roleplay unfolds live on stream.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-neutral-900 rounded-xl border border-white/[0.08] text-xs">
          {['ALL', 'POLICE', 'EMS', 'DOJ', 'SYNDICATE', 'CIVILIAN'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Canvas (Left 2 Columns) */}
        <div className="lg:col-span-2 relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/90 shadow-2xl select-none">
          {/* Stylized Los Santos Vector Grid Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Stylized Topographic City Contours */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none stroke-purple-500/40 fill-none"
            viewBox="0 0 1000 800"
          >
            {/* Mountain / Coastline Curves */}
            <path d="M 100,50 Q 300,120 400,250 T 600,400 T 800,600 T 900,750" strokeWidth="2" strokeDasharray="8 8" />
            <path d="M 200,800 Q 350,600 500,550 T 700,500 T 850,300" strokeWidth="1.5" />
            <path d="M 50,400 C 200,300 450,450 650,350 S 900,200 950,150" strokeWidth="1.5" />
            {/* Alamo Sea water body shape */}
            <ellipse cx="620" cy="270" rx="90" ry="45" className="fill-purple-950/30 stroke-purple-400/50" />
            {/* Los Santos Bay Water Body */}
            <path d="M 300,780 C 450,700 550,750 700,780 L 700,800 L 300,800 Z" className="fill-blue-950/40 stroke-blue-500/30" />
          </svg>

          {/* District Pins Layer */}
          {filteredPoints.map(point => {
            const isSelected = selectedPoint?.id === point.id;
            const style = getCategoryColor(point.category);

            return (
              <div
                key={point.id}
                onClick={() => setSelectedPoint(point)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30 transition-transform hover:scale-110"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                {/* Pin Head */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-lg border backdrop-blur-md transition-all ${
                    isSelected
                      ? `${style.bg} text-white font-extrabold ring-4 ${style.ring} scale-105`
                      : 'bg-neutral-900/90 text-neutral-200 border-white/20 hover:border-white/50'
                  }`}
                >
                  <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : style.text}`} />
                  <span className="text-[11px] font-mono whitespace-nowrap">{point.name}</span>
                </div>

                {/* Pulse Indicator */}
                {isSelected && (
                  <span className="absolute -inset-1 rounded-xl bg-purple-500 opacity-25 animate-ping -z-10" />
                )}
              </div>
            );
          })}

          {/* Map Compass Rose / Legend */}
          <div className="absolute bottom-3 left-3 bg-neutral-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-[10px] font-mono text-neutral-400 space-y-1 z-20">
            <div className="flex items-center gap-2 text-white font-bold">
              <Navigation className="h-3.5 w-3.5 text-purple-400" />
              <span>LOS SANTOS SECTOR 18</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Police</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> EMS</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Syndicate</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Civ</span>
            </div>
          </div>
        </div>

        {/* Location Details & Associated Streamer Card (Right Column) */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 flex flex-col justify-between space-y-6">
          {selectedPoint ? (
            <div className="space-y-4">
              <div>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getCategoryColor(selectedPoint.category).text} ${getCategoryColor(selectedPoint.category).border} bg-neutral-950`}>
                  {selectedPoint.category} DISTRICT
                </span>
                <h3 className="font-display text-xl font-extrabold text-white mt-2">
                  {selectedPoint.name}
                </h3>
                <span className="text-xs text-neutral-400 font-medium">
                  {selectedPoint.subname}
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3.5 rounded-xl border border-white/[0.06]">
                {selectedPoint.description}
              </p>

              {/* Associated Active Streamer */}
              {associatedCreator && (
                <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Active Faction Streamer
                  </span>

                  <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={associatedCreator.profileImageUrl || `https://avatar.vercel.sh/${associatedCreator.slug}.png`}
                        alt={associatedCreator.displayName}
                        className="h-10 w-10 rounded-xl object-cover border border-purple-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {associatedCreator.displayName}
                          </span>
                          {associatedCreator.isLive && (
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {associatedCreator.characterName || `@${associatedCreator.slug}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToProfile(associatedCreator.slug)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 text-xs">
              Select any district pin on the map to inspect landmark lore and active streamers.
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            <button
              onClick={() => {
                if (onNavigateToSquad) {
                  onNavigateToSquad(['TJ_SINGH007', 'apocalypticsith', 'ithebunny', 'moxiemoses']);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-800 hover:bg-purple-600 text-neutral-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors border border-white/10"
            >
              <Radio className="h-3.5 w-3.5 text-purple-400" />
              <span>Launch City Squad Multi-Stream</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
