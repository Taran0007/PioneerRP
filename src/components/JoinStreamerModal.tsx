import React, { useState } from 'react';
import { X, UserPlus, Radio, Sparkles, CheckCircle2, Shield, AlertCircle } from 'lucide-react';

interface JoinStreamerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinStreamerModal: React.FC<JoinStreamerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    username: '',
    characterName: '',
    faction: 'CIVILIAN',
    bio: '',
    creatorCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/streamer-requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      setSuccessMessage('Application submitted successfully! An admin will review and approve your request shortly.');
      setTimeout(() => {
        setSuccessMessage(null);
        setForm({ username: '', characterName: '', faction: 'CIVILIAN', bio: '', creatorCode: '' });
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-purple-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-purple-950/40 p-6 sm:p-8 space-y-6 shadow-2xl shadow-purple-950/50 overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 shadow-inner">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-wide">
                Join Pioneer RP Streamers
              </h3>
              <p className="text-xs text-neutral-400">
                Submit your details to get listed on the official community creator hub.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="py-12 text-center space-y-4 relative z-10">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="font-display text-lg font-bold text-white">Application Received!</h4>
            <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Twitch Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Twitch Username <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TJ_SINGH007"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Character Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Character Name <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tejinder 'TJ' Singh"
                  value={form.characterName}
                  onChange={e => setForm({ ...form, characterName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* In-Game Faction */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  In-Game Faction / Role <span className="text-purple-400">*</span>
                </label>
                <select
                  value={form.faction}
                  onChange={e => setForm({ ...form, faction: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none transition-colors"
                >
                  <option value="CIVILIAN">Civilian / Independent</option>
                  <option value="POLICE">Police / LSPD</option>
                  <option value="EMS">EMS / Pillbox Medical</option>
                  <option value="DOJ">Department of Justice</option>
                  <option value="SYNDICATE">Syndicate / Gang</option>
                </select>
              </div>

              {/* Creator Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Store Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. INDIA"
                  value={form.creatorCode}
                  onChange={e => setForm({ ...form, creatorCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Bio / About */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                About / Roleplay Bio <span className="text-purple-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Tell us about your character, stream schedule, and roleplay style in Los Santos..."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
