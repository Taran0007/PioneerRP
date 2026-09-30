import React, { useState, useEffect } from 'react';
import { Play, Search, Video, Clock, ExternalLink, Filter, Users, X, Eye, Sparkles } from 'lucide-react';
import { CreatorVOD, Creator } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface VodsPageProps {
  onNavigate?: (path: string) => void;
  onNavigateToProfile?: (slug: string) => void;
  onSelectCreator?: (creator: Creator) => void;
}

export const VodsPage: React.FC<VodsPageProps> = () => {
  const [vods, setVods] = useState<CreatorVOD[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string>('all');
  const [activeModalVod, setActiveModalVod] = useState<CreatorVOD | null>(null);

  useEffect(() => {
    loadVods();
  }, []);

  const loadVods = async () => {
    setLoading(true);
    try {
      const res = await api.getVods();
      setVods(res.data);
    } catch (err) {
      console.error('Failed loading VODs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVods = vods.filter(vod => {
    const matchesSearch =
      vod.title.toLowerCase().includes(search.toLowerCase()) ||
      vod.creatorDisplayName.toLowerCase().includes(search.toLowerCase()) ||
      (vod.characterName && vod.characterName.toLowerCase().includes(search.toLowerCase()));

    const matchesCreator =
      selectedCreator === 'all' || vod.creatorId === selectedCreator || vod.creatorDisplayName === selectedCreator;

    return matchesSearch && matchesCreator;
  });

  const uniqueCreators = Array.from(
    new Map(vods.map(v => [v.creatorId, { id: v.creatorId, name: v.creatorDisplayName }])).values()
  );

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="relative rounded-3xl border border-purple-500/20 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-purple-950/30 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Video className="h-3.5 w-3.5" />
              <span>Broadcast Archives & VODs</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              Past Broadcasts & Storylines
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Catch up on the latest storylines, high-speed tactical chases, cartel deals, and life flights across Los Santos. Watch past full streams from registered Pioneer RP content creators.
            </p>
          </div>

          {/* Decorative Background Glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search VOD title, streamer, or character..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-900 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Streamer Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCreator('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCreator === 'all'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              All Streamers
            </button>
            {uniqueCreators.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCreator(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCreator === c.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 rounded-3xl bg-neutral-900/60 border border-white/5" />
            ))}
          </div>
        ) : filteredVods.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-neutral-900/40 border border-white/5 space-y-3">
            <Video className="mx-auto h-12 w-12 text-neutral-600" />
            <h3 className="font-display text-lg font-bold text-white uppercase">No VODs Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No recorded broadcasts matched your current search filters. Check back soon or browse active live streamers.
            </p>
          </div>
        ) : (
          /* VODs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVods.map(vod => (
              <div
                key={vod.id}
                className="group relative rounded-3xl border border-white/10 hover:border-purple-500/50 bg-neutral-900/80 hover:bg-neutral-900 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Thumbnail Container */}
                <div
                  className="relative aspect-video w-full overflow-hidden bg-neutral-950 cursor-pointer"
                  onClick={() => setActiveModalVod(vod)}
                >
                  <img
                    src={vod.thumbnailUrl}
                    alt={vod.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/20" />

                  {/* Play Button Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/40 backdrop-blur-[2px]">
                    <div className="h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/50 transform group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 ml-0.5 fill-white" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-neutral-950/90 text-white font-mono text-[11px] font-semibold border border-white/10">
                    {vod.duration}
                  </div>

                  {/* VOD Tag */}
                  {vod.hasArchivedVod ? (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-purple-950/90 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/40 flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      TWITCH VOD
                    </div>
                  ) : (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-neutral-900/90 text-neutral-300 font-mono text-[10px] font-bold border border-white/10">
                      CHANNEL VIDEOS
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Streamer Info */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={vod.creatorProfileImage || `https://avatar.vercel.sh/${vod.creatorSlug}.png`}
                        alt={vod.creatorDisplayName}
                        className="h-7 w-7 rounded-lg object-cover border border-purple-500/40"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">
                          {vod.creatorDisplayName}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {vod.characterName || `@${vod.creatorSlug}`}
                        </div>
                      </div>
                    </div>

                    {/* VOD Title */}
                    <h3
                      onClick={() => setActiveModalVod(vod)}
                      className="font-bold text-sm text-neutral-100 line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      {vod.title}
                    </h3>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-neutral-500" />
                        <span>{new Date(vod.publishedAt).toLocaleDateString()}</span>
                      </span>
                      {typeof vod.viewCount === 'number' && (
                        <span className="flex items-center gap-1 font-mono text-purple-300/80">
                          <Eye className="h-3 w-3 text-purple-400" />
                          <span>{vod.viewCount.toLocaleString()}</span>
                        </span>
                      )}
                    </div>

                    <a
                      href={vod.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600 text-neutral-200 hover:text-white font-bold text-xs transition-colors"
                      title="Watch past broadcast on Twitch"
                    >
                      <span>Watch</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VOD PLAYER MODAL */}
      {activeModalVod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl rounded-3xl border border-purple-500/40 bg-neutral-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeModalVod.creatorProfileImage || `https://avatar.vercel.sh/${activeModalVod.creatorSlug}.png`}
                  alt={activeModalVod.creatorDisplayName}
                  className="h-9 w-9 rounded-xl object-cover border border-purple-500/40"
                />
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                    {activeModalVod.title}
                  </h3>
                  <div className="text-xs text-neutral-400">
                    {activeModalVod.creatorDisplayName} · {activeModalVod.characterName}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModalVod(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player / Live Twitch Embed */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              {(() => {
                let vodId = activeModalVod.vodId;
                if (!vodId && activeModalVod.url) {
                  const match = activeModalVod.url.match(/videos\/(\d+)/);
                  if (match) vodId = match[1];
                }
                if (!vodId && activeModalVod.id.startsWith('vod_')) {
                  vodId = activeModalVod.id.replace('vod_', '');
                }

                if (vodId) {
                  return (
                    <iframe
                      src={`https://player.twitch.tv/?video=${vodId}&parent=${window.location.hostname}&autoplay=true`}
                      className="w-full h-full border-0 absolute inset-0"
                      allowFullScreen
                      title={activeModalVod.title}
                    />
                  );
                }

                const channelName = activeModalVod.creatorSlug || activeModalVod.creatorDisplayName;
                return (
                  <iframe
                    src={`https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}&autoplay=true`}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    title={activeModalVod.title}
                  />
                );
              })()}
            </div>

            {/* Storyline Timestamp Bookmarks */}
            <div className="rounded-2xl bg-neutral-950 border border-white/5 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  Key Roleplay Moments & Timestamps
                </span>
                <span className="text-[11px] font-mono text-neutral-400">Click to jump on Twitch</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a
                  href={`${activeModalVod.url}?t=00h12m00s`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">00:12:00</span>
                    <span className="text-neutral-300 group-hover:text-white font-medium">Duty Briefing & Setup</span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-neutral-400 group-hover:text-purple-300" />
                </a>

                <a
                  href={`${activeModalVod.url}?t=00h48m30s`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">00:48:30</span>
                    <span className="text-neutral-300 group-hover:text-white font-medium">10-80 High Speed Pursuit</span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-neutral-400 group-hover:text-purple-300" />
                </a>

                <a
                  href={`${activeModalVod.url}?t=01h35m15s`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">01:35:15</span>
                    <span className="text-neutral-300 group-hover:text-white font-medium">Negotiation & Hostage Scene</span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-neutral-400 group-hover:text-purple-300" />
                </a>

                <a
                  href={`${activeModalVod.url}?t=02h10m40s`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">02:10:40</span>
                    <span className="text-neutral-300 group-hover:text-white font-medium">Debrief & Interrogation</span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-neutral-400 group-hover:text-purple-300" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
              <div className="flex items-center gap-3">
                <span>Duration: <strong className="text-neutral-200">{activeModalVod.duration}</strong></span>
                <span>·</span>
                <span>Recorded: <strong className="text-neutral-200">{new Date(activeModalVod.publishedAt).toLocaleDateString()}</strong></span>
              </div>
              <button
                onClick={() => setActiveModalVod(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                Close Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
