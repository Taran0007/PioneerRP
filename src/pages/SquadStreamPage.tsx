import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Volume2, VolumeX, Maximize2, X, Plus,
  MessageSquare, Radio, Users, Check, RefreshCw, Share2, Sparkles
} from 'lucide-react';
import { Creator } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface SquadStreamPageProps {
  onNavigateHome: () => void;
  onNavigateToProfile: (slug: string) => void;
}

export const SquadStreamPage: React.FC<SquadStreamPageProps> = ({
  onNavigateHome,
  onNavigateToProfile,
}) => {
  // Available creators
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Active channels in the squad (array of Twitch usernames, max 4)
  const [channels, setChannels] = useState<string[]>([]);
  // Which stream has audio active (username, or null if all muted)
  const [activeAudioChannel, setActiveAudioChannel] = useState<string | null>(null);
  // Which stream's chat is currently displayed in the sidebar
  const [activeChatChannel, setActiveChatChannel] = useState<string | null>(null);
  // Whether chat drawer is open
  const [showChat, setShowChat] = useState<boolean>(true);
  // Modal to add a streamer
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customChannelInput, setCustomChannelInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Load creators & parse initial channels from URL
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await api.getStreamers();
        setAllCreators(res.data);

        // Check URL params for pre-selected streamers (e.g. ?streamers=TJ_SINGH007,apocalypticsith)
        const params = new URLSearchParams(window.location.search);
        const urlStreamers = params.get('streamers');

        if (urlStreamers) {
          const list = urlStreamers.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
          if (list.length > 0) {
            setChannels(list);
            setActiveAudioChannel(list[0]);
            setActiveChatChannel(list[0]);
            setLoading(false);
            return;
          }
        }

        // Default to live creators, or top featured creators
        const liveOnes = res.data.filter(c => !!c.currentStream?.isLive).map(c => c.platformAccount?.username || c.slug);
        const defaultList = liveOnes.length > 0
          ? liveOnes.slice(0, 2)
          : res.data.slice(0, 2).map(c => c.platformAccount?.username || c.slug);

        setChannels(defaultList);
        if (defaultList.length > 0) {
          setActiveAudioChannel(defaultList[0]);
          setActiveChatChannel(defaultList[0]);
        }
      } catch (err) {
        console.error('Failed loading streamers for squad:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  // Sync channels to URL for easy Discord sharing
  useEffect(() => {
    if (channels.length > 0) {
      const url = new URL(window.location.href);
      url.searchParams.set('streamers', channels.join(','));
      window.history.replaceState({}, '', url.toString());
    }
  }, [channels]);

  const addChannel = (username: string) => {
    const clean = username.trim().toLowerCase();
    if (!clean) return;
    if (channels.some(c => c.toLowerCase() === clean)) return;
    if (channels.length >= 4) return;

    const updated = [...channels, clean];
    setChannels(updated);
    if (!activeAudioChannel) setActiveAudioChannel(clean);
    if (!activeChatChannel) setActiveChatChannel(clean);
    setShowAddModal(false);
    setCustomChannelInput('');
  };

  const removeChannel = (username: string) => {
    const updated = channels.filter(c => c.toLowerCase() !== username.toLowerCase());
    setChannels(updated);
    if (activeAudioChannel?.toLowerCase() === username.toLowerCase()) {
      setActiveAudioChannel(updated[0] || null);
    }
    if (activeChatChannel?.toLowerCase() === username.toLowerCase()) {
      setActiveChatChannel(updated[0] || null);
    }
  };

  const toggleSoloAudio = (username: string) => {
    if (activeAudioChannel?.toLowerCase() === username.toLowerCase()) {
      // Mute all
      setActiveAudioChannel(null);
    } else {
      // Solo this channel
      setActiveAudioChannel(username);
    }
  };

  const handleShareSquad = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Determine grid CSS based on stream count
  const getGridClasses = () => {
    switch (channels.length) {
      case 1:
        return 'grid-cols-1 grid-rows-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Squad Control Bar */}
      <header className="px-4 py-3 bg-neutral-900/90 border-b border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-between gap-3 sticky top-8 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            ← Public Hub
          </button>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-purple-400" />
            <h1 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wider uppercase">
              Squad Multi-Stream
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {channels.length}/4 STREAMS
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Streamer Button */}
          {channels.length < 4 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Streamer</span>
            </button>
          )}

          {/* Share Squad Link */}
          <button
            onClick={handleShareSquad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors border border-white/10"
            title="Copy shareable link"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-neutral-400" />
                <span>Share Squad</span>
              </>
            )}
          </button>

          {/* Toggle Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              showChat
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                : 'bg-neutral-800 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat {showChat ? 'On' : 'Off'}</span>
          </button>
        </div>
      </header>

      {/* Main Squad Grid & Chat Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Streams Container */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-neutral-900/40 rounded-2xl border border-dashed border-white/10">
              <Users className="h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="font-display text-lg font-bold text-white mb-1">Squad is Empty</h3>
              <p className="text-xs text-neutral-400 max-w-sm mb-4">
                Select active Pioneer RP creators to watch multiple roleplay perspectives simultaneously with synchronized audio switching.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                + Choose Streamers
              </button>
            </div>
          ) : (
            <div className={`grid gap-2.5 h-full ${getGridClasses()}`}>
              {channels.map((channel, idx) => {
                const isSoloAudio = activeAudioChannel?.toLowerCase() === channel.toLowerCase();
                const isCreator = allCreators.find(
                  c => (c.platformAccount?.username || c.slug).toLowerCase() === channel.toLowerCase()
                );

                return (
                  <div
                    key={`${channel}-${idx}`}
                    className={`relative rounded-xl overflow-hidden bg-neutral-900 border flex flex-col transition-all min-h-[260px] sm:min-h-[320px] ${
                      isSoloAudio
                        ? 'border-purple-500/60 ring-1 ring-purple-500/40'
                        : 'border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    {/* Stream Header Controls */}
                    <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 bg-gradient-to-b from-neutral-950/90 to-transparent flex items-center justify-between text-xs pointer-events-auto">
                      <div className="flex items-center gap-2">
                        {isCreator?.isLive && (
                          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        <span className="font-extrabold text-white text-xs drop-shadow">
                          {isCreator?.displayName || channel}
                        </span>
                        {isCreator?.characterName && (
                          <span className="text-[10px] text-neutral-400 hidden sm:inline">
                            ({isCreator.characterName})
                          </span>
                        )}
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1.5 bg-neutral-950/80 p-1 rounded-lg backdrop-blur-md border border-white/10">
                        {/* Audio Toggle */}
                        <button
                          onClick={() => toggleSoloAudio(channel)}
                          className={`p-1 rounded text-xs transition-colors ${
                            isSoloAudio
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title={isSoloAudio ? 'Mute audio' : 'Solo this audio (mutes others)'}
                        >
                          {isSoloAudio ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                        </button>

                        {/* Set Active Chat */}
                        <button
                          onClick={() => {
                            setActiveChatChannel(channel);
                            setShowChat(true);
                          }}
                          className={`p-1 rounded text-xs transition-colors ${
                            activeChatChannel?.toLowerCase() === channel.toLowerCase() && showChat
                              ? 'bg-neutral-800 text-purple-300'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title="Show this streamer's chat"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>

                        {/* Remove stream */}
                        <button
                          onClick={() => removeChannel(channel)}
                          className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors"
                          title="Remove from squad"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Twitch Embedded Player */}
                    <div className="flex-1 w-full h-full relative bg-black">
                      <iframe
                        src={`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=${!isSoloAudio}&autoplay=true`}
                        className="w-full h-full border-0 absolute inset-0"
                        allowFullScreen
                        title={`Stream ${channel}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Twitch Chat Sidebar */}
        {showChat && activeChatChannel && (
          <aside className="w-full lg:w-80 h-72 lg:h-auto border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-neutral-900/90 flex flex-col shrink-0">
            {/* Chat Tabs */}
            <div className="p-2 border-b border-white/[0.08] bg-neutral-950/60 flex items-center justify-between gap-1 overflow-x-auto">
              <div className="flex items-center gap-1 overflow-x-auto">
                {channels.map(channel => (
                  <button
                    key={`chat-${channel}`}
                    onClick={() => setActiveChatChannel(channel)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold whitespace-nowrap transition-colors ${
                      activeChatChannel.toLowerCase() === channel.toLowerCase()
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                    }`}
                  >
                    #{channel}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                title="Close chat sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Embedded Twitch Chat */}
            <div className="flex-1 w-full h-full bg-neutral-950 relative">
              <iframe
                src={`https://www.twitch.tv/embed/${activeChatChannel}/chat?parent=${window.location.hostname}&darkpopout`}
                className="w-full h-full border-0 absolute inset-0"
                title={`Twitch Chat for ${activeChatChannel}`}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Add Streamer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Add Streamer to Squad
                </h3>
                <p className="text-xs text-neutral-400">
                  Select an active Pioneer RP creator or enter any Twitch handle.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Custom Channel Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Type Any Twitch Channel Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TJ_SINGH007"
                  value={customChannelInput}
                  onChange={e => setCustomChannelInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addChannel(customChannelInput);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addChannel(customChannelInput)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Available Pioneer RP Streamers */}
            <div>
              <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Pioneer RP Roster
              </span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {allCreators.map(creator => {
                  const username = creator.platformAccount?.username || creator.slug;
                  const inSquad = channels.some(c => c.toLowerCase() === username.toLowerCase());

                  return (
                    <div
                      key={creator.id}
                      className="p-2.5 rounded-xl bg-neutral-950/70 border border-white/[0.06] flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={creator.profileImageUrl || `https://avatar.vercel.sh/${creator.slug}.png`}
                          alt={creator.displayName}
                          className="h-8 w-8 rounded-lg object-cover border border-white/10"
                        />
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{creator.displayName}</span>
                            {creator.isLive && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-red-600/30 text-red-300 border border-red-500/40">
                                LIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            {creator.characterName || `@${username}`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addChannel(username)}
                        disabled={inSquad}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          inSquad
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-neutral-800 hover:bg-purple-600 text-neutral-200 hover:text-white'
                        }`}
                      >
                        {inSquad ? 'In Squad' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
