import React, { useState, useEffect } from 'react';
import { Search, Filter, Tv, Users, Star, Radio } from 'lucide-react';
import { Creator } from '../types/index.js';
import { StreamerCard } from '../components/StreamerCard.js';

interface StreamersPageProps {
  creators: Creator[];
  onNavigateToProfile: (slug: string) => void;
}

export const StreamersPage: React.FC<StreamersPageProps> = ({
  creators,
  onNavigateToProfile,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'offline' | 'featured'>('all');
  const [factionFilter, setFactionFilter] = useState<'all' | 'POLICE' | 'EMS' | 'DOJ' | 'SYNDICATE' | 'CIVILIAN'>('all');
  const [platform, setPlatform] = useState<'all' | 'TWITCH'>('all');

  // Debounced search filtering
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(handler);
  }, [search]);

  const filteredCreators = creators.filter(c => {
    // Platform filter
    if (platform !== 'all') {
      const pa = c.platformAccount;
      if (pa && pa.platform !== platform) return false;
    }

    // Status filter
    const isLive = !!c.currentStream?.isLive;
    if (filter === 'live' && !isLive) return false;
    if (filter === 'offline' && isLive) return false;
    if (filter === 'featured' && !c.featured) return false;

    // Faction filter
    if (factionFilter !== 'all' && c.faction !== factionFilter) return false;

    // Search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const matchName = c.displayName.toLowerCase().includes(q);
      const matchSlug = c.slug.toLowerCase().includes(q);
      const matchUsername = c.platformAccount?.username.toLowerCase().includes(q);
      const matchCharacter = c.characterName?.toLowerCase().includes(q);
      const matchGang = c.gangName?.toLowerCase().includes(q);
      const matchCode = c.creatorCode?.toLowerCase().includes(q);
      return matchName || matchSlug || matchUsername || matchCharacter || matchGang || matchCode;
    }

    return true;
  });

  const liveCount = creators.filter(c => !!c.currentStream?.isLive).length;
  const offlineCount = creators.length - liveCount;
  const featuredCount = creators.filter(c => c.featured).length;

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">
          Community Directory
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          PIONEER RP STREAMERS
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
          Meet the verified creators bringing Pioneer RP to life. Search by streamer name, in-city character, or gang affiliation.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search streamer, character, gang..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls (interactive segmented buttons compliant with frontend-design) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({creators.length})
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filter === 'live'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${filter === 'live' ? 'bg-white' : 'bg-red-500'}`} />
              Live ({liveCount})
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'offline'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Offline ({offlineCount})
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                filter === 'featured'
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Star className="h-3 w-3" />
              Featured ({featuredCount})
            </button>
          </div>

          {/* Platform Dropdown/Pill (Architecture ready for Kick) */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setPlatform('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg ${
                platform === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Platforms
            </button>
            <button
              onClick={() => setPlatform('TWITCH')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 ${
                platform === 'TWITCH' ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="h-3 w-3" />
              Twitch
            </button>
          </div>
        </div>
      </div>

      {/* Factions Segmented Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mr-1">Faction:</span>
        <button
          onClick={() => setFactionFilter('all')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            factionFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Roles
        </button>
        <button
          onClick={() => setFactionFilter('POLICE')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            factionFilter === 'POLICE' ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40' : 'text-neutral-400 hover:text-blue-300'
          }`}
        >
          LSPD / Police
        </button>
        <button
          onClick={() => setFactionFilter('EMS')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            factionFilter === 'EMS' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'text-neutral-400 hover:text-rose-300'
          }`}
        >
          Pillbox EMS
        </button>
        <button
          onClick={() => setFactionFilter('DOJ')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            factionFilter === 'DOJ' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-amber-300'
          }`}
        >
          DOJ / Court
        </button>
        <button
          onClick={() => setFactionFilter('SYNDICATE')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            factionFilter === 'SYNDICATE' ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40' : 'text-neutral-400 hover:text-purple-300'
          }`}
        >
          Syndicate / Gangs
        </button>
        <button
          onClick={() => setFactionFilter('CIVILIAN')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            factionFilter === 'CIVILIAN' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'text-neutral-400 hover:text-emerald-300'
          }`}
        >
          Civilian & Business
        </button>
      </div>

      {/* Grid of Results */}
      {filteredCreators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCreators.map(creator => (
            <StreamerCard
              key={creator.id}
              creator={creator}
              onNavigateToProfile={onNavigateToProfile}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/30 p-16 text-center max-w-lg mx-auto space-y-3">
          <Users className="h-10 w-10 text-neutral-600 mx-auto" />
          <h3 className="font-display text-lg font-bold text-white">No Streamers Found</h3>
          <p className="text-xs text-neutral-400">
            No Pioneer RP creators matched your current search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setFilter('all');
              setPlatform('all');
            }}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline pt-2"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
