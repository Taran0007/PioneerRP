import React, { useState } from 'react';
import {
  Calendar as CalendarIcon, Clock, MapPin, Users,
  Scale, Shield, Flame, Car, Sparkles, ChevronRight, AlertCircle
} from 'lucide-react';
import { Creator } from '../types/index.js';

interface EventsPageProps {
  creators: Creator[];
  onNavigateToProfile: (slug: string) => void;
  onNavigateToSquad?: () => void;
}

interface ServerEvent {
  id: string;
  title: string;
  subtitle: string;
  category: 'COURT' | 'GANG' | 'AUCTION' | 'HEIST' | 'SPECIAL';
  dateStr: string;
  timeStr: string;
  location: string;
  description: string;
  participatingStreamers: string[];
  severity: 'HIGH_STAKES' | 'MAJOR_STORYLINE' | 'COMMUNITY';
}

const UPCOMING_EVENTS: ServerEvent[] = [
  {
    id: 'event_01',
    title: 'The People vs. Purple Nine Syndicate — Grand Racketeering Trial',
    subtitle: 'Supreme Court of San Andreas · Presided by Chief Justice',
    category: 'COURT',
    dateStr: 'Tonight',
    timeStr: '8:00 PM EST / 5:00 PM PST',
    location: 'Los Santos Courthouse (DOJ)',
    description: 'The monumental trial following the federal raid on the port docks. Prosecutors present wiretap evidence as criminal defense attorneys argue constitutional search violations.',
    participatingStreamers: ['TJ_SINGH007', 'apocalypticsith'],
    severity: 'HIGH_STAKES',
  },
  {
    id: 'event_02',
    title: 'South Central Faction Spray War & Turf Expansion',
    subtitle: 'Underworld territory conflict across industrial districts',
    category: 'GANG',
    dateStr: 'Tomorrow',
    timeStr: '9:30 PM EST / 6:30 PM PST',
    location: 'Rancho & Cypress Flats',
    description: 'Contested territory tags reset across eastern Los Santos. Crews mobilize tactical convoys to lock down district control.',
    participatingStreamers: ['apocalypticsith', 'moxiemoses'],
    severity: 'HIGH_STAKES',
  },
  {
    id: 'event_03',
    title: 'Pioneer RP Supercar Showcase & Midnight Drag Tournament',
    subtitle: 'Sponsored by Los Santos Customs & Pillbox EMS Charity',
    category: 'AUCTION',
    dateStr: 'Friday',
    timeStr: '7:00 PM EST / 4:00 PM PST',
    location: 'Los Santos International Airport Runway',
    description: 'A gathering of the rarest custom-tuned supercars in the city. Bracket-style quarter-mile drag races with a $250,000 in-city purse prize.',
    participatingStreamers: ['moxiemoses', 'ithebunny'],
    severity: 'COMMUNITY',
  },
  {
    id: 'event_04',
    title: 'Paleto Bay Bank Vault Tactical Breach',
    subtitle: 'Tier 3 Bank Security System test operation',
    category: 'HEIST',
    dateStr: 'Saturday',
    timeStr: '10:00 PM EST / 7:00 PM PST',
    location: 'Blaine County Savings Bank (Paleto Bay)',
    description: 'An elite four-man crew plans a subterranean thermite breach while LSPD State Troopers prepare roadblock choke points.',
    participatingStreamers: ['TJ_SINGH007'],
    severity: 'MAJOR_STORYLINE',
  },
];

export const EventsPage: React.FC<EventsPageProps> = ({
  creators,
  onNavigateToProfile,
  onNavigateToSquad,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredEvents = UPCOMING_EVENTS.filter(e => {
    if (selectedCategory === 'ALL') return true;
    return e.category === selectedCategory;
  });

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'COURT':
        return { text: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/40', icon: Scale };
      case 'GANG':
        return { text: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/40', icon: Flame };
      case 'AUCTION':
        return { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', icon: Car };
      case 'HEIST':
        return { text: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/40', icon: Shield };
      default:
        return { text: 'text-blue-400', bg: 'bg-blue-950/60', border: 'border-blue-500/40', icon: Sparkles };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1 flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Community Timeline</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            SERVER EVENTS & SCHEDULE
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Major roleplay storylines, scheduled courtroom trials, gang territory wars, and community events happening in Pioneer RP.
          </p>
        </div>

        {onNavigateToSquad && (
          <button
            onClick={onNavigateToSquad}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-purple-600/30"
          >
            <span>Watch Live Multi-Stream →</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'COURT', 'GANG', 'AUCTION', 'HEIST'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap border ${
              selectedCategory === cat
                ? 'bg-neutral-800 text-white border-white/20 shadow-sm'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            {cat === 'ALL' ? 'All Events' : cat}
          </button>
        ))}
      </div>

      {/* Events Timeline */}
      <div className="space-y-4">
        {filteredEvents.map(event => {
          const theme = getCategoryTheme(event.category);
          const Icon = theme.icon;

          return (
            <div
              key={event.id}
              className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 sm:p-6 hover:border-purple-500/40 transition-all space-y-4 shadow-xl"
            >
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 ${theme.text} ${theme.bg} ${theme.border}`}>
                      <Icon className="h-3 w-3" />
                      <span>{event.category}</span>
                    </span>

                    <span className="text-[11px] font-mono font-bold text-neutral-300 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-purple-400" />
                      <span>{event.dateStr} · {event.timeStr}</span>
                    </span>

                    {event.severity === 'HIGH_STAKES' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        CRITICAL IMPACT
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg sm:text-xl font-extrabold text-white mt-1">
                    {event.title}
                  </h3>
                  <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                    <span>{event.location}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-400">{event.subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3.5 rounded-xl border border-white/[0.05]">
                {event.description}
              </p>

              {/* Participating Streamers */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-neutral-500">Streamed by:</span>
                  {event.participatingStreamers.map(handle => {
                    const creator = creators.find(
                      c => (c.platformAccount?.username || c.slug).toLowerCase() === handle.toLowerCase()
                    );

                    return (
                      <button
                        key={handle}
                        onClick={() => {
                          if (creator) onNavigateToProfile(creator.slug);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors border border-white/10"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        <span>{creator?.displayName || handle}</span>
                      </button>
                    );
                  })}
                </div>

                {onNavigateToSquad && (
                  <button
                    onClick={onNavigateToSquad}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <span>Watch in Squad Mode</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
