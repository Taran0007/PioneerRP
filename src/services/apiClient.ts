import { Creator, CreatorVOD, LiveStream, SiteSettings, AnalyticsSummary, ServerStatusResponse, AuditLog } from '../types/index.js';

class ApiClient {
  private baseUrl = '/api';
  private token: string | null = null;

  constructor() {
    try {
      this.token = typeof window !== 'undefined' ? sessionStorage.getItem('pioneer_admin_token') : null;
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        sessionStorage.setItem('pioneer_admin_token', token);
      } else {
        sessionStorage.removeItem('pioneer_admin_token');
      }
    } catch {
      // sessionStorage restricted in some iframe contexts
    }
  }

  getToken(): string | null {
    if (!this.token) {
      try {
        this.token = sessionStorage.getItem('pioneer_admin_token');
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  private async adminFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Ensures cookies are transmitted in cross-origin / iframe scenarios
    });
  }

  async getLive(): Promise<{ data: Creator[]; totalLive: number; timestamp: string }> {
    const res = await fetch(`${this.baseUrl}/live`);
    if (!res.ok) throw new Error('Failed to load live streamers');
    return res.json();
  }

  async getFeatured(): Promise<{ data: Creator[]; totalFeatured: number }> {
    const res = await fetch(`${this.baseUrl}/featured`);
    if (!res.ok) throw new Error('Failed to load featured creators');
    return res.json();
  }

  async getStreamers(params?: {
    filter?: 'all' | 'live' | 'offline' | 'featured';
    search?: string;
    platform?: string;
  }): Promise<{ data: Creator[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.filter && params.filter !== 'all') query.set('filter', params.filter);
    if (params?.search) query.set('search', params.search);
    if (params?.platform) query.set('platform', params.platform);

    const res = await fetch(`${this.baseUrl}/streamers?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load streamers');
    return res.json();
  }

  async getStreamerBySlug(slug: string): Promise<{ data: Creator & { streamHistory?: LiveStream[] } }> {
    const res = await fetch(`${this.baseUrl}/streamers/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Streamer not found');
    return res.json();
  }

  async getSettings(): Promise<{ data: SiteSettings }> {
    const res = await fetch(`${this.baseUrl}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  }

  async getServerStatus(): Promise<{ data: ServerStatusResponse }> {
    const res = await fetch(`${this.baseUrl}/server-status`);
    if (!res.ok) throw new Error('Failed to load server status');
    return res.json();
  }

  async getVods(): Promise<{ data: CreatorVOD[] }> {
    const res = await fetch(`${this.baseUrl}/vods`);
    if (!res.ok) throw new Error('Failed to load VODs');
    return res.json();
  }

  async trackEvent(eventType: 'watch_click' | 'creator_code_click' | 'store_click' | 'profile_view', creatorId?: string, metadata?: any): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, creatorId, metadata }),
      });
    } catch {
      // Fire and forget
    }
  }

  // Admin APIs
  async getTwitchAuthUrl(): Promise<{ configured: boolean; url?: string; redirectUri: string; clientId?: string; message?: string }> {
    const res = await this.adminFetch('/auth/twitch/url');
    if (!res.ok) throw new Error('Failed to get Twitch auth URL');
    return res.json();
  }

  async testTwitchConnection(): Promise<{ success: boolean; message: string }> {
    const res = await this.adminFetch('/admin/twitch/test', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Twitch test failed');
    return data;
  }

  async quickConnectTwitch(clientId: string, clientSecret: string): Promise<{ success: boolean; message: string }> {
    const res = await this.adminFetch('/admin/twitch/quick-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to connect Twitch');
    return data;
  }

  async adminLogin(identifier: string, password: string): Promise<{ success: boolean; token: string; user: any }> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async adminGetMe(): Promise<any> {
    const res = await this.adminFetch('/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  }

  async adminLogout(): Promise<void> {
    this.setToken(null);
    await this.adminFetch('/auth/logout', { method: 'POST' });
  }

  async adminGetOverview(): Promise<any> {
    const res = await this.adminFetch('/admin/overview');
    if (!res.ok) throw new Error('Failed to load admin overview');
    return res.json();
  }

  async adminGetStreamers(): Promise<{ data: Creator[] }> {
    const res = await this.adminFetch('/admin/streamers');
    if (!res.ok) throw new Error('Failed to load streamers');
    return res.json();
  }

  async adminResolveTwitch(username: string): Promise<{ success: boolean; data: any }> {
    const res = await this.adminFetch('/admin/streamers/resolve-twitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve Twitch account');
    return data;
  }

  async adminCreateStreamer(payload: any): Promise<{ success: boolean; data: Creator }> {
    const res = await this.adminFetch('/admin/streamers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create streamer');
    return data;
  }

  async adminUpdateStreamer(id: string, payload: any): Promise<{ success: boolean; data: Creator }> {
    const res = await this.adminFetch(`/admin/streamers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update streamer');
    return data;
  }

  async adminDeleteStreamer(id: string): Promise<void> {
    const res = await this.adminFetch(`/admin/streamers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete streamer');
  }

  async adminReorderFeatured(items: Array<{ id: string; featuredOrder: number; featured: boolean }>): Promise<void> {
    const res = await this.adminFetch('/admin/featured/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Failed to update featured order');
  }

  async adminGetLiveMonitor(): Promise<any> {
    const res = await this.adminFetch('/admin/live');
    if (!res.ok) throw new Error('Failed to load live monitor');
    return res.json();
  }

  async adminGetAnalytics(): Promise<{ data: AnalyticsSummary }> {
    const res = await this.adminFetch('/admin/analytics');
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  }

  async adminGetSettings(): Promise<{ data: SiteSettings }> {
    const res = await this.adminFetch('/admin/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  }

  async adminUpdateSettings(updates: any): Promise<{ success: boolean; data: SiteSettings }> {
    const res = await this.adminFetch('/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data;
  }

  async adminSyncNow(): Promise<any> {
    const res = await this.adminFetch('/admin/sync-now', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Manual sync failed');
    return data;
  }

  async adminGetAuditLogs(): Promise<{ data: AuditLog[] }> {
    const res = await this.adminFetch('/admin/audit-logs');
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  }

  // Admin User Accounts Management
  async adminGetAdmins(): Promise<{ data: any[] }> {
    const res = await this.adminFetch('/admin/admins');
    if (!res.ok) throw new Error('Failed to load administrators');
    return res.json();
  }

  async adminCreateAdmin(payload: { username: string; email: string; password: string; role?: string }): Promise<{ success: boolean; data: any }> {
    const res = await this.adminFetch('/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create administrator');
    return data;
  }

  async adminDeleteAdmin(id: string): Promise<void> {
    const res = await this.adminFetch(`/admin/admins/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete administrator');
  }

  // Admin Clip Moderation
  async adminGetClips(): Promise<{ data: any[]; total: number }> {
    const res = await this.adminFetch('/admin/clips');
    if (!res.ok) throw new Error('Failed to load clips for moderation');
    return res.json();
  }

  async adminUpdateClip(id: string, updates: any): Promise<{ success: boolean; data: any }> {
    const res = await this.adminFetch(`/admin/clips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update clip');
    return data;
  }

  async adminDeleteClip(id: string): Promise<void> {
    const res = await this.adminFetch(`/admin/clips/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete clip');
  }
}

export const api = new ApiClient();
