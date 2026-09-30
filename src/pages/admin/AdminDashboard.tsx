import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Radio, Star, BarChart3, Settings, LogOut, Plus,
  RefreshCw, Edit3, Trash2, Check, X, ExternalLink, Shield, AlertCircle,
  ArrowUp, ArrowDown, Eye, Copy, Tv, Search, CheckCircle2, History, UserPlus, UserCheck
} from 'lucide-react';
import { Creator, SiteSettings, AnalyticsSummary, AuditLog } from '../../types/index.js';
import { api } from '../../services/apiClient.js';

interface AdminDashboardProps {
  adminUser: any;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'streamers' | 'live' | 'featured' | 'admins' | 'analytics' | 'settings' | 'audit'>('overview');

  // Overview data
  const [overview, setOverview] = useState<any>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [liveMonitor, setLiveMonitor] = useState<any[]>([]);

  // Admin users state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add Streamer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    displayName: '',
    characterName: '',
    gangName: '',
    bio: '',
    profileImageUrl: '',
    featured: false,
    featuredOrder: 99,
    creatorCode: '',
    creatorCodeDescription: '',
    creatorStoreUrl: 'https://pioneer-rp-18.tebex.io/',
    enabled: true,
    platformUserId: '',
  });
  const [resolvingTwitch, setResolvingTwitch] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  // Edit Streamer Modal State
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);

  // Featured Order state for drag/move
  const [featuredList, setFeaturedList] = useState<Creator[]>([]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Twitch quick connect & test states
  const [testingTwitch, setTestingTwitch] = useState(false);
  const [quickClientId, setQuickClientId] = useState('');
  const [quickClientSecret, setQuickClientSecret] = useState('');
  const [savingQuickTwitch, setSavingQuickTwitch] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Listen for OAuth popup completion
  useEffect(() => {
    const handleMsg = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        showToast('Twitch account connected successfully!', 'success');
        loadAllData();
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const handleTestTwitch = async () => {
    setTestingTwitch(true);
    try {
      const res = await api.testTwitchConnection();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Twitch test failed', 'error');
    } finally {
      setTestingTwitch(false);
    }
  };

  const handleConnectTwitchOAuth = async () => {
    try {
      const authInfo = await api.getTwitchAuthUrl();
      if (!authInfo.configured || !authInfo.url) {
        showToast('Please enter your Twitch Client ID & Secret first below', 'error');
        return;
      }
      const popup = window.open(authInfo.url, 'twitch_oauth_popup', 'width=600,height=750');
      if (!popup) {
        showToast('Popup was blocked by your browser. Please allow popups.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed opening Twitch popup', 'error');
    }
  };

  const handleSaveQuickTwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientId || !quickClientSecret) {
      showToast('Client ID and Secret are required', 'error');
      return;
    }
    setSavingQuickTwitch(true);
    try {
      const res = await api.quickConnectTwitch(quickClientId, quickClientSecret);
      showToast(res.message, 'success');
      setQuickClientId('');
      setQuickClientSecret('');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Twitch connection failed', 'error');
    } finally {
      setSavingQuickTwitch(false);
    }
  };

  const handleCopyRedirect = () => {
    const url = `${window.location.origin}/api/auth/twitch/callback`;
    navigator.clipboard.writeText(url);
    setCopiedRedirect(true);
    showToast('Redirect URI copied to clipboard!');
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ovRes, crRes, setRes, anRes, audRes, liveRes, admRes] = await Promise.all([
        api.adminGetOverview(),
        api.adminGetStreamers(),
        api.adminGetSettings(),
        api.adminGetAnalytics(),
        api.adminGetAuditLogs(),
        api.adminGetLiveMonitor(),
        api.adminGetAdmins().catch(() => ({ data: [] })),
      ]);

      setOverview(ovRes.data);
      setCreators(crRes.data);
      setSettings(setRes.data);
      setSettingsForm(setRes.data);
      setAnalytics(anRes.data);
      setAuditLogs(audRes.data);
      setLiveMonitor(liveRes.data);
      if (admRes?.data) {
        setAdminsList(admRes.data);
      }

      const featured = crRes.data
        .filter((c: Creator) => c.featured)
        .sort((a: Creator, b: Creator) => (a.featuredOrder || 999) - (b.featuredOrder || 999));
      setFeaturedList(featured);
    } catch (err: any) {
      showToast(err.message || 'Failed loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.username.trim() || !newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      showToast('Username, email, and password are required', 'error');
      return;
    }
    if (newAdminForm.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setCreatingAdmin(true);
    try {
      await api.adminCreateAdmin(newAdminForm);
      showToast(`Administrator "${newAdminForm.username}" created successfully!`);
      setShowAddAdminModal(false);
      setNewAdminForm({ username: '', email: '', password: '', role: 'admin' });
      const updated = await api.adminGetAdmins();
      setAdminsList(updated.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to create administrator', 'error');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!window.confirm(`Are you sure you want to remove administrator "${username}"?`)) {
      return;
    }
    try {
      await api.adminDeleteAdmin(id);
      showToast(`Administrator "${username}" removed successfully`);
      const updated = await api.adminGetAdmins();
      setAdminsList(updated.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete administrator', 'error');
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Manual sync trigger
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await api.adminSyncNow();
      showToast(`Twitch sync finished: ${res.result.liveDetected} live, ${res.result.totalMonitoredAccounts} monitored`);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Manual sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Resolve Twitch username
  const handleResolveTwitch = async () => {
    if (!addForm.username.trim()) {
      showToast('Enter a Twitch username first', 'error');
      return;
    }
    setResolvingTwitch(true);
    setResolveSuccess(false);
    try {
      const res = await api.adminResolveTwitch(addForm.username);
      setAddForm(prev => ({
        ...prev,
        username: res.data.username,
        displayName: prev.displayName || res.data.displayName,
        profileImageUrl: prev.profileImageUrl || res.data.profileImageUrl,
        platformUserId: res.data.userId,
      }));
      setResolveSuccess(true);
      showToast(`Twitch account resolved: ${res.data.displayName} (ID: ${res.data.userId})`);
    } catch (err: any) {
      showToast(err.message || 'Could not resolve Twitch account', 'error');
    } finally {
      setResolvingTwitch(false);
    }
  };

  // Add Streamer submit
  const handleCreateStreamer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.username.trim()) {
      showToast('Twitch username is required', 'error');
      return;
    }
    try {
      await api.adminCreateStreamer(addForm);
      showToast(`Streamer "${addForm.displayName || addForm.username}" added successfully!`);
      setShowAddModal(false);
      setAddForm({
        username: '',
        displayName: '',
        characterName: '',
        gangName: '',
        bio: '',
        profileImageUrl: '',
        featured: false,
        featuredOrder: 99,
        creatorCode: '',
        creatorCodeDescription: '',
        creatorStoreUrl: 'https://pioneer-rp-18.tebex.io/',
        enabled: true,
        platformUserId: '',
      });
      setResolveSuccess(false);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add streamer', 'error');
    }
  };

  // Update Streamer submit
  const handleUpdateStreamer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreator) return;
    try {
      await api.adminUpdateStreamer(editingCreator.id, editingCreator);
      showToast(`Updated "${editingCreator.displayName}"`);
      setEditingCreator(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update streamer', 'error');
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (creator: Creator) => {
    try {
      await api.adminUpdateStreamer(creator.id, {
        featured: !creator.featured,
        featuredOrder: !creator.featured ? 1 : 999,
      });
      showToast(`Updated featured status for ${creator.displayName}`);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Toggle Enabled
  const handleToggleEnabled = async (creator: Creator) => {
    try {
      await api.adminUpdateStreamer(creator.id, { enabled: !creator.enabled });
      showToast(`${creator.displayName} is now ${!creator.enabled ? 'Enabled' : 'Disabled'}`);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Delete Streamer
  const handleDeleteStreamer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove streamer "${name}"?`)) return;
    try {
      await api.adminDeleteStreamer(id);
      showToast(`Streamer "${name}" removed`);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete streamer', 'error');
    }
  };

  // Move Featured item up/down
  const moveFeaturedItem = async (index: number, direction: 'up' | 'down') => {
    const list = [...featuredList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // reassign order numbers
    const updated = list.map((item, idx) => ({
      id: item.id,
      featuredOrder: idx + 1,
      featured: true,
    }));

    setFeaturedList(list);

    try {
      await api.adminReorderFeatured(updated);
      showToast('Featured order updated');
    } catch (err: any) {
      showToast('Failed to save order', 'error');
      loadAllData();
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.adminUpdateSettings(settingsForm);
      showToast('Settings saved successfully');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.08] bg-neutral-900/60 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="font-display font-bold text-sm tracking-wider text-white">
                  ADMIN PORTAL
                </span>
                <div className="text-[10px] text-neutral-400">
                  {adminUser?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('streamers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'streamers'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4" />
                <span>Streamer Management</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950/60 font-mono">
                {creators.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'live'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-red-400" />
                <span>Live Monitor</span>
              </div>
              {overview?.liveNow > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">
                  {overview.liveNow}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('featured')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'featured'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4 text-purple-400" />
                <span>Featured Ordering</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950/60 font-mono">
                {featuredList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'admins'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>Admin Users</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950/60 font-mono">
                {adminsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Click Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Platform Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Audit Trail</span>
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2 mt-6">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/30 text-xs font-semibold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/[0.08]">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white tracking-tight uppercase">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'streamers' && 'Streamer Roster Management'}
              {activeTab === 'live' && 'Real-Time Live Monitor'}
              {activeTab === 'featured' && 'Featured Creators Order'}
              {activeTab === 'admins' && 'Administrator Accounts'}
              {activeTab === 'analytics' && 'Interaction & Click Analytics'}
              {activeTab === 'settings' && 'System & API Settings'}
              {activeTab === 'audit' && 'System Audit Trail'}
            </h2>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
              <span>Sync status:</span>
              <span className={`font-semibold ${overview?.syncStatus === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {overview?.syncStatus?.toUpperCase() || 'IDLE'}
              </span>
              <span>·</span>
              <span>Last checked: {overview?.lastSyncAt ? new Date(overview.lastSyncAt).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-purple-400' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Twitch Now'}</span>
            </button>

            {activeTab === 'streamers' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Streamer</span>
              </button>
            )}

            {activeTab === 'admins' && (
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  TOTAL STREAMERS
                </div>
                <div className="font-display text-3xl font-extrabold text-white">
                  {overview?.totalCreators || 0}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Manually registered accounts
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE NOW
                </div>
                <div className="font-display text-3xl font-extrabold text-white">
                  {overview?.liveNow || 0}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Broadcasting on Twitch
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-purple-400" />
                  FEATURED
                </div>
                <div className="font-display text-3xl font-extrabold text-white">
                  {overview?.featuredCount || 0}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Spotlighted on homepage
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  TOTAL CURRENT VIEWERS
                </div>
                <div className="font-display text-3xl font-extrabold text-white font-mono">
                  {(overview?.totalViewers || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Combined live audience
                </div>
              </div>
            </div>

            {/* 1-CLICK TWITCH INTEGRATION & VERIFICATION CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-neutral-900/60 to-neutral-900 border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#9146FF]/20 text-[#a855f7]">
                      <Tv className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-bold text-white tracking-wide">
                      1-Click Twitch API Integration & Live Verification
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Connect your Twitch developer account to enable automatic stream detection and 1-click Twitch login for administrators.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTestTwitch}
                    disabled={testingTwitch}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${testingTwitch ? 'animate-spin text-purple-400' : ''}`} />
                    <span>{testingTwitch ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectTwitchOAuth}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold shadow-md shadow-purple-900/40 transition-all"
                  >
                    <Tv className="h-3.5 w-3.5" />
                    <span>Connect Twitch (OAuth)</span>
                  </button>
                </div>
              </div>

              {/* Redirect URI Display */}
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px] truncate">
                  <span className="text-neutral-500 shrink-0">Twitch Console Redirect URI:</span>
                  <span className="text-purple-300 font-semibold truncate select-all">
                    {window.location.origin}/api/auth/twitch/callback
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRedirect}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 shrink-0 self-end sm:self-auto"
                >
                  {copiedRedirect ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy URI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Connect Inputs if not yet configured */}
              {!overview?.twitchConfigured && (
                <form onSubmit={handleSaveQuickTwitch} className="pt-2 border-t border-white/[0.06] space-y-3">
                  <div className="text-xs font-semibold text-neutral-300">
                    Quick Connect (Paste your Twitch App credentials once):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <input
                      type="text"
                      placeholder="Twitch Client ID (e.g. gp762nuuoqcoxypju8c569th9wz7q5)"
                      value={quickClientId}
                      onChange={e => setQuickClientId(e.target.value)}
                      className="sm:col-span-5 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Twitch Client Secret"
                      value={quickClientSecret}
                      onChange={e => setQuickClientSecret(e.target.value)}
                      className="sm:col-span-5 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={savingQuickTwitch}
                      className="sm:col-span-2 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
                    >
                      <span>{savingQuickTwitch ? 'Saving...' : 'Activate'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* DATABASE & STORAGE STATUS (Zero manual work) */}
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="font-bold text-white">Database Engine:</span>{' '}
                  <span className="text-emerald-300">Self-Managed & Persistent</span>
                  <div className="text-[11px] text-neutral-400">
                    Initial creators (TJ SINGH, ApocalypticSith, ithebunny, Moxie Moses) seeded and synced. Zero manual SQL or maintenance required.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono uppercase font-bold">
                Healthy
              </span>
            </div>

            {/* Twitch API Health Status */}
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Tv className="h-4 w-4 text-purple-400" />
                  <span>Twitch API Status & Rate Limit Guard</span>
                </h3>
                {overview?.twitchConfigured ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Credentials Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    Credentials Required in Settings
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Background synchronization queries Twitch every {settings?.twitchPollingIntervalSeconds || 45} seconds for active streams. Website visitors read cached status from the database, eliminating duplicate API calls.
              </p>
              {overview?.syncErrorMessage && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {overview.syncErrorMessage}
                </div>
              )}
            </div>

            {/* Live Streamers Quick Table */}
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Active Live Streamers
                </h3>
                <button
                  onClick={() => setActiveTab('live')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Open Live Monitor
                </button>
              </div>

              {liveMonitor.filter(m => m.isLive).length > 0 ? (
                <div className="divide-y divide-white/[0.05]">
                  {liveMonitor.filter(m => m.isLive).map(stream => (
                    <div key={stream.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{stream.displayName}</span>
                          <span className="text-xs font-normal text-neutral-400">(@{stream.username})</span>
                        </div>
                        <div className="text-xs text-neutral-300 line-clamp-1">
                          {stream.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1 text-red-400">
                          <Eye className="h-3.5 w-3.5" />
                          <strong>{stream.viewerCount.toLocaleString()}</strong>
                        </span>
                        <a
                          href={stream.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-200 hover:text-white flex items-center gap-1"
                        >
                          <span>Twitch</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No creators are currently live. When a registered streamer starts streaming, they appear here automatically.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STREAMERS MANAGEMENT */}
        {activeTab === 'streamers' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/80 border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Creator</th>
                      <th className="py-3.5 px-4">Twitch Account</th>
                      <th className="py-3.5 px-4">Live Status</th>
                      <th className="py-3.5 px-4">Featured</th>
                      <th className="py-3.5 px-4">Creator Code</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {creators.map(c => {
                      const isLive = !!c.currentStream?.isLive;
                      const username = c.platformAccount?.username || c.slug;
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={c.profileImageUrl || `https://avatar.vercel.sh/${username}.png`}
                                alt={c.displayName}
                                className="h-9 w-9 rounded-lg object-cover border border-white/10"
                              />
                              <div>
                                <div className="font-bold text-white text-sm">
                                  {c.displayName}
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                  {c.characterName || 'No character set'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <a
                              href={c.platformAccount?.channelUrl || `https://twitch.tv/${username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>@{username}</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          </td>

                          <td className="py-3.5 px-4">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                                {c.currentStream?.viewerCount.toLocaleString()} viewers
                              </span>
                            ) : (
                              <span className="text-neutral-500 font-medium">Offline</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleFeatured(c)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                                c.featured
                                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                                  : 'bg-neutral-800/40 border-white/5 text-neutral-500 hover:text-neutral-300'
                              }`}
                            >
                              <Star className={`h-3 w-3 ${c.featured ? 'fill-purple-400' : ''}`} />
                              <span>{c.featured ? `#${c.featuredOrder || 1}` : 'No'}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            {c.creatorCode ? (
                              <span className="px-2 py-0.5 rounded bg-neutral-950 border border-purple-500/30 text-purple-300 font-bold">
                                {c.creatorCode}
                              </span>
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleEnabled(c)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                c.enabled
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {c.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingCreator(c)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                                title="Edit Creator"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteStreamer(c.id, c.displayName)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                                title="Delete Creator"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE MONITOR */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/80 border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Creator</th>
                      <th className="py-3.5 px-4">Live Status</th>
                      <th className="py-3.5 px-4">Viewer Count</th>
                      <th className="py-3.5 px-4">Current Stream Title</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-right">Direct Twitch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {liveMonitor.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div>{item.displayName}</div>
                          <div className="text-[11px] text-neutral-400 font-normal">@{item.username}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {item.isLive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-neutral-500">Offline</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold">
                          {item.isLive ? item.viewerCount.toLocaleString() : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-300 max-w-xs truncate">
                          {item.title}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-400">
                          {item.category}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={item.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-semibold transition-colors"
                          >
                            <span>Open Twitch</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FEATURED REORDERING */}
        {activeTab === 'featured' && (
          <div className="space-y-6 max-w-3xl">
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-neutral-300">
              Featured creators are given visual prominence across the homepage and in the hero spotlight. You can adjust the order using the Up and Down controls.
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 divide-y divide-white/[0.05] overflow-hidden">
              {featuredList.map((creator, index) => (
                <div key={creator.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-neutral-950 font-mono font-bold text-xs flex items-center justify-center text-purple-400 border border-purple-500/30">
                      {index + 1}
                    </span>
                    <img
                      src={creator.profileImageUrl || `https://avatar.vercel.sh/${creator.slug}.png`}
                      alt={creator.displayName}
                      className="h-10 w-10 rounded-lg object-cover border border-white/10"
                    />
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{creator.displayName}</span>
                        {creator.creatorCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/30">
                            CODE: {creator.creatorCode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">
                        @{creator.platformAccount?.username || creator.slug}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveFeaturedItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveFeaturedItem(index, 'down')}
                      disabled={index === featuredList.length - 1}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ADMIN USERS */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <div className="text-xs text-neutral-300">
                Manage authorized administrator accounts for Pioneer RP Live. Admins can update streamers, manage featured creators, and adjust server settings.
              </div>
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Administrator</span>
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Active Administrators ({adminsList.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/50 text-neutral-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-4">Administrator</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {adminsList.map(admin => {
                      const isSelf = admin.id === adminUser?.id;
                      return (
                        <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold font-mono text-xs">
                                {admin.username?.substring(0, 2).toUpperCase() || 'AD'}
                              </div>
                              <div>
                                <span className="font-bold text-white text-sm">{admin.username}</span>
                                {isSelf && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800/40 text-purple-300 font-mono">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-300 font-mono text-xs">
                            {admin.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                              admin.role === 'superadmin'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-700/40'
                                : 'bg-blue-950/80 text-blue-300 border border-blue-700/40'
                            }`}>
                              {admin.role || 'ADMIN'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-xs">
                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                              disabled={isSelf || adminsList.length <= 1}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              title={isSelf ? 'Cannot delete your own active account' : 'Remove Administrator'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLICK ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  WATCH CLICKS
                </div>
                <div className="font-display text-3xl font-extrabold text-white font-mono">
                  {(analytics?.totalWatchClicks || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Visits sent to Twitch channels
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  CREATOR CODE CLICKS
                </div>
                <div className="font-display text-3xl font-extrabold text-white font-mono">
                  {(analytics?.totalCodeClicks || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Creator code copy interactions
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  PROFILE VIEWS
                </div>
                <div className="font-display text-3xl font-extrabold text-white font-mono">
                  {(analytics?.totalProfileViews || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Direct creator page visits
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-1">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  STORE CLICKS
                </div>
                <div className="font-display text-3xl font-extrabold text-white font-mono">
                  {(analytics?.totalStoreClicks || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Direct Tebex store referrals
                </div>
              </div>
            </div>

            {/* Top Creators Table */}
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 overflow-hidden">
              <div className="p-4 border-b border-white/[0.06]">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Top Creators by Engagement
                </h3>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {analytics?.topCreatorsByClicks?.map((item, idx) => (
                  <div key={item.creatorId} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-neutral-500 font-bold text-xs">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white text-sm">{item.displayName}</div>
                        <div className="text-[11px] text-neutral-400">@{item.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-mono">
                      <span>{item.watchClicks} watch clicks</span>
                      <span className="text-purple-300">{item.codeClicks} code clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-8 max-w-3xl">
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-3">
                Twitch API Integration
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Twitch Client ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.twitchClientId || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, twitchClientId: e.target.value })}
                    placeholder="e.g. gp762nuuoqcoxypju8c569th9wz7q5"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Twitch Client Secret
                  </label>
                  <input
                    type="password"
                    value={settingsForm.twitchClientSecret || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, twitchClientSecret: e.target.value })}
                    placeholder="Enter Twitch client secret securely"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Used strictly server-side for OAuth App Access token generation. Never exposed to browser.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Twitch Polling Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={600}
                      value={settingsForm.twitchPollingIntervalSeconds || 45}
                      onChange={e => setSettingsForm({ ...settingsForm, twitchPollingIntervalSeconds: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Frontend Refresh Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={300}
                      value={settingsForm.liveRefreshIntervalSeconds || 30}
                      onChange={e => setSettingsForm({ ...settingsForm, liveRefreshIntervalSeconds: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-3">
                Pioneer RP Server & Links
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Pioneer Tebex Store URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.storeUrl || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, storeUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Pioneer Discord URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.discordUrl || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, discordUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Server Join / FiveM URL
                  </label>
                  <input
                    type="text"
                    value={settingsForm.serverJoinUrl || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, serverJoinUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Server Status API URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={settingsForm.serverStatusApiUrl || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, serverStatusApiUrl: e.target.value })}
                    placeholder="https://servers-frontend.fivem.net/api/servers/single/... or leave blank"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    If empty, server widget displays 'SERVER STATUS UNAVAILABLE' cleanly without fabricating player counts.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-3">
                SEO & Branding Copy
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroHeadline || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Hero Subheading
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.heroSubheading || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, heroSubheading: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Redirect URI Display in Settings */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px] truncate">
                <span className="text-neutral-500 shrink-0">Twitch OAuth Redirect URI:</span>
                <span className="text-purple-300 font-semibold truncate select-all">
                  {window.location.origin}/api/auth/twitch/callback
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyRedirect}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 shrink-0"
              >
                {copiedRedirect ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Redirect URI</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {savingSettings ? 'Saving Settings...' : 'Save Settings'}
              </button>

              <button
                type="button"
                onClick={handleTestTwitch}
                disabled={testingTwitch}
                className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-white/10 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testingTwitch ? 'animate-spin text-purple-400' : ''}`} />
                <span>{testingTwitch ? 'Testing Twitch...' : 'Test Twitch Connection'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 overflow-hidden">
              <div className="p-4 border-b border-white/[0.06]">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Admin Action Trail
                </h3>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{log.action}</span>
                        <span className="text-[11px] text-purple-400">({log.entityType})</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Admin: <span className="text-neutral-200">{log.adminEmail}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ADD STREAMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-neutral-900 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Register Pioneer RP Streamer
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStreamer} className="space-y-5">
              {/* Twitch Account Resolution section */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300">
                  Twitch Username (Required)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. TJ_SINGH007"
                    value={addForm.username}
                    onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleResolveTwitch}
                    disabled={resolvingTwitch}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    {resolvingTwitch ? 'Resolving...' : 'Resolve Account'}
                  </button>
                </div>
                {resolveSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Twitch account resolved successfully!</span>
                  </div>
                )}
              </div>

              {/* Display Name & Character */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Display Name Override
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TJ SINGH"
                    value={addForm.displayName}
                    onChange={e => setAddForm({ ...addForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    In-City Character Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tejinder 'TJ' Singh"
                    value={addForm.characterName}
                    onChange={e => setAddForm({ ...addForm, characterName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gang & Creator Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Gang / Faction Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Purple Nine"
                    value={addForm.gangName}
                    onChange={e => setAddForm({ ...addForm, gangName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Creator Code (e.g. INDIA)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INDIA"
                    value={addForm.creatorCode}
                    onChange={e => setAddForm({ ...addForm, creatorCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono uppercase focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Store URL */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Creator Tebex Store URL
                </label>
                <input
                  type="url"
                  placeholder="https://pioneer-rp-18.tebex.io/"
                  value={addForm.creatorStoreUrl}
                  onChange={e => setAddForm({ ...addForm, creatorStoreUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Featured toggle & order */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-purple-400" />
                    <span>Featured Creator</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Display prominently on homepage spotlight
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {addForm.featured && (
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={addForm.featuredOrder}
                      onChange={e => setAddForm({ ...addForm, featuredOrder: parseInt(e.target.value, 10) || 1 })}
                      className="w-16 px-2 py-1 rounded bg-neutral-900 border border-white/10 text-xs font-mono text-center text-white"
                      title="Featured Order"
                    />
                  )}
                  <input
                    type="checkbox"
                    checked={addForm.featured}
                    onChange={e => setAddForm({ ...addForm, featured: e.target.checked })}
                    className="h-5 w-5 rounded border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Creator Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief roleplay summary, storyline background..."
                  value={addForm.bio}
                  onChange={e => setAddForm({ ...addForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30"
                >
                  Save Streamer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STREAMER MODAL */}
      {editingCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-neutral-900 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Edit Creator: {editingCreator.displayName}
              </h3>
              <button
                onClick={() => setEditingCreator(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStreamer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Display Name Override
                  </label>
                  <input
                    type="text"
                    value={editingCreator.displayName}
                    onChange={e => setEditingCreator({ ...editingCreator, displayName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    In-City Character Name
                  </label>
                  <input
                    type="text"
                    value={editingCreator.characterName || ''}
                    onChange={e => setEditingCreator({ ...editingCreator, characterName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Gang / Affiliation
                  </label>
                  <input
                    type="text"
                    value={editingCreator.gangName || ''}
                    onChange={e => setEditingCreator({ ...editingCreator, gangName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Creator Code
                  </label>
                  <input
                    type="text"
                    value={editingCreator.creatorCode || ''}
                    onChange={e => setEditingCreator({ ...editingCreator, creatorCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono uppercase focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Creator Store URL
                </label>
                <input
                  type="url"
                  value={editingCreator.creatorStoreUrl || ''}
                  onChange={e => setEditingCreator({ ...editingCreator, creatorStoreUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Featured Creator</span>
                  <input
                    type="checkbox"
                    checked={editingCreator.featured}
                    onChange={e => setEditingCreator({ ...editingCreator, featured: e.target.checked })}
                    className="h-5 w-5 rounded border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Account Enabled</span>
                  <input
                    type="checkbox"
                    checked={editingCreator.enabled}
                    onChange={e => setEditingCreator({ ...editingCreator, enabled: e.target.checked })}
                    className="h-5 w-5 rounded border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Bio / Narrative
                </label>
                <textarea
                  rows={3}
                  value={editingCreator.bio || ''}
                  onChange={e => setEditingCreator({ ...editingCreator, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingCreator(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW ADMIN MODAL */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-purple-500/40 bg-neutral-900 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5 text-purple-400">
                <UserPlus className="h-5 w-5" />
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
                  Create Administrator
                </h3>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OfficerMiller"
                  value={newAdminForm.username}
                  onChange={e => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. miller@pioneerrp.live"
                  value={newAdminForm.email}
                  onChange={e => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Password * (Min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Choose a strong password"
                  value={newAdminForm.password}
                  onChange={e => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Role Permission Level
                </label>
                <select
                  value={newAdminForm.role}
                  onChange={e => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none"
                >
                  <option value="admin">Administrator (Full streamer and settings access)</option>
                  <option value="superadmin">Superadmin (All privileges)</option>
                  <option value="moderator">Moderator (Roster viewer and creator management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {creatingAdmin ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
