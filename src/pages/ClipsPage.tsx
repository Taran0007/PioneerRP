import React, { useState, useEffect } from 'react';
import {
  Film, Plus, Heart, ExternalLink, Play, X, Share2,
  Check, Sparkles, Filter, MessageSquare, AlertCircle
} from 'lucide-react';
import { CommunityClip } from '../types/index.js';

interface ClipsPageProps {
  onNavigateHome: () => void;
}

export const ClipsPage: React.FC<ClipsPageProps> = ({ onNavigateHome }) => {
  const [clips, setClips] = useState<CommunityClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeClipModal, setActiveClipModal] = useState<CommunityClip | null>(null);

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    clipUrl: '',
    creatorName: '',
    category: 'CHASE' as const,
    submitterName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const fetchClips = async () => {
    try {
      const res = await fetch(`/api/clips${selectedCategory !== 'ALL' ? `?category=${selectedCategory}` : ''}`);
      const data = await res.json();
      if (data.data) {
        setClips(data.data);
      }
    } catch (err) {
      console.error('Failed fetching clips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [selectedCategory]);

  const handleUpvote = async (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (upvotedIds.has(clipId)) return;

    // Optimistic update
    setUpvotedIds(prev => new Set(prev).add(clipId));
    setClips(prev =>
      prev.map(c => (c.id === clipId ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c))
    );

    try {
      await fetch(`/api/clips/${clipId}/upvote`, { method: 'POST' });
    } catch (err) {
      console.error('Failed upvoting clip:', err);
    }
  };

  const handleSubmitClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.title || !submitForm.clipUrl) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/clips/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowSubmitModal(false);
          setSubmitForm({
            title: '',
            clipUrl: '',
            creatorName: '',
            category: 'CHASE',
            submitterName: '',
          });
          fetchClips();
        }, 1200);
      }
    } catch (err) {
      console.error('Submit clip failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'CHASE':
        return 'text-blue-400 bg-blue-950/60 border-blue-500/40';
      case 'GUNFIGHT':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      case 'HEIST':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'DRAMA':
        return 'text-purple-400 bg-purple-950/60 border-purple-500/40';
      case 'COMEDY':
      default:
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1 flex items-center gap-2">
            <Film className="h-3.5 w-3.5" />
            <span>Community Highlight Reel</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            TOP ROLEPLAY CLIPS
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Watch the most dramatic pursuits, tactical shootouts, court hearings, and unforgettable roleplay moments submitted by the Pioneer RP community.
          </p>
        </div>

        {/* Submit Clip Button */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>Submit a Clip</span>
        </button>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'CHASE', 'GUNFIGHT', 'HEIST', 'DRAMA', 'COMEDY'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap border ${
              selectedCategory === cat
                ? 'bg-neutral-800 text-white border-white/20 shadow-sm'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            {cat === 'ALL' ? 'All Highlights' : cat}
          </button>
        ))}
      </div>

      {/* Clips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-video rounded-2xl bg-neutral-900/60 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-dashed border-white/10 p-8 space-y-3">
          <Film className="h-10 w-10 text-neutral-600 mx-auto" />
          <h3 className="font-display text-base font-bold text-white">No Clips Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Be the first to submit a Twitch clip for this category!
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-wider"
          >
            + Submit Clip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map(clip => {
            const hasUpvoted = upvotedIds.has(clip.id);

            return (
              <div
                key={clip.id}
                onClick={() => setActiveClipModal(clip)}
                className="group relative flex flex-col rounded-2xl overflow-hidden bg-neutral-900/60 border border-white/[0.08] hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20 transition-all duration-200 cursor-pointer"
              >
                {/* Thumbnail / Play Preview Box */}
                <div className="relative aspect-video bg-neutral-950 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent z-10" />

                  {/* Play Button Icon */}
                  <div className="h-12 w-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-20">
                    <Play className="h-5 w-5 ml-0.5 fill-white" />
                  </div>

                  {/* Category Pill Tag */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${getCategoryBadge(clip.category)}`}>
                      {clip.category}
                    </span>
                  </div>

                  {/* Upvote Button */}
                  <button
                    onClick={(e) => handleUpvote(clip.id, e)}
                    className={`absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-xs font-mono font-bold transition-colors border ${
                      hasUpvoted
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                        : 'bg-neutral-950/80 text-neutral-300 border-white/10 hover:border-rose-500/40 hover:text-rose-300'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${hasUpvoted ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{clip.upvotes || 0}</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                      {clip.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Featuring: <span className="text-neutral-200 font-semibold">{clip.creatorName}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                    <span>by {clip.submitterName}</span>
                    <span className="flex items-center gap-1 text-purple-400 group-hover:underline">
                      Watch Clip →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clip Video Player Modal */}
      {activeClipModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-neutral-900 border border-white/15 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-neutral-950/90 border-b border-white/[0.08] flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-bold text-white truncate max-w-lg">
                  {activeClipModal.title}
                </h3>
                <span className="text-[11px] text-neutral-400">
                  {activeClipModal.creatorName} · Submitted by {activeClipModal.submitterName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeClipModal.clipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
                  title="Open on Twitch"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setActiveClipModal(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Embedded Twitch Clip Iframe */}
            <div className="aspect-video w-full bg-black relative">
              <iframe
                src={`${activeClipModal.embedUrl}&parent=${window.location.hostname}&autoplay=true`}
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
                title={activeClipModal.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Clip Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
                Submit Roleplay Clip
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-2">
                <Check className="h-10 w-10 text-emerald-400 mx-auto" />
                <h4 className="font-display font-bold text-white">Clip Submitted!</h4>
                <p className="text-xs text-neutral-400">Your clip is now live on the community reel.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitClip} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Twitch Clip URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://clips.twitch.tv/..."
                    value={submitForm.clipUrl}
                    onChange={e => setSubmitForm({ ...submitForm, clipUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Clip Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TJ SINGH 100mph Pit Maneuver"
                    value={submitForm.title}
                    onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1">
                      Creator Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TJ SINGH"
                      value={submitForm.creatorName}
                      onChange={e => setSubmitForm({ ...submitForm, creatorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1">
                      Category
                    </label>
                    <select
                      value={submitForm.category}
                      onChange={e => setSubmitForm({ ...submitForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="CHASE">Police Chase</option>
                      <option value="GUNFIGHT">Gunfight</option>
                      <option value="HEIST">Heist</option>
                      <option value="DRAMA">Drama / Court</option>
                      <option value="COMEDY">Comedy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Your Name / Handle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CityEditor99"
                    value={submitForm.submitterName}
                    onChange={e => setSubmitForm({ ...submitForm, submitterName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Clip'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
