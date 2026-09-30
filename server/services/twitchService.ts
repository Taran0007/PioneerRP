import { decrypt } from '../utils/encryption.js';

export interface TwitchUserResult {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
  description: string;
  createdAt: string;
  email?: string;
}

export interface TwitchStreamResult {
  id: string;
  userId: string;
  userLogin: string;
  userName: string;
  gameId: string;
  gameName: string;
  type: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  language: string;
  thumbnailUrl: string;
  isMature: boolean;
}

export class TwitchService {
  private clientId: string;
  private clientSecret: string;
  private appAccessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID || '';
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET || '';
    this.syncWithDb();
  }

  syncWithDb() {
    try {
      import('../db/database.js').then(({ db }) => {
        const rawSettings = (db as any).memoryDb?.settings || {};
        if (rawSettings.twitchClientId) {
          this.clientId = rawSettings.twitchClientId.trim();
        }
        if (rawSettings.twitchClientSecret && rawSettings.twitchClientSecret !== '••••••••••••••••') {
          this.clientSecret = decrypt(rawSettings.twitchClientSecret).trim();
        }
      }).catch(() => {});
    } catch {}
  }

  isConfigured(): boolean {
    if (!this.clientId || !this.clientSecret) {
      this.syncWithDb();
    }
    return !!(this.clientId && this.clientSecret);
  }

  getClientId(): string {
    if (!this.clientId) {
      this.syncWithDb();
    }
    return this.clientId;
  }

  updateCredentials(clientId: string, clientSecret: string) {
    this.clientId = clientId.trim();
    this.clientSecret = clientSecret.trim();
    this.appAccessToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Generates OAuth Authorize URL for Twitch login
   */
  getOAuthUrl(redirectUri: string, state: string = 'pioneer_twitch_oauth'): string {
    if (!this.clientId) {
      throw new Error('Twitch Client ID not configured.');
    }
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'user:read:email',
      state,
      force_verify: 'true',
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchanges OAuth authorization code for User Access Token
   */
  async exchangeCodeForUserToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Twitch credentials not configured. Please set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to exchange Twitch code: ${res.status} ${err}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Fetches the authenticated user using User Access Token
   */
  async getUserFromToken(userToken: string): Promise<TwitchUserResult> {
    const res = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch Twitch user from token: ${res.status} ${text}`);
    }

    const json = await res.json();
    if (!json.data || json.data.length === 0) {
      throw new Error('No Twitch user profile returned');
    }

    const user = json.data[0];
    return {
      id: user.id,
      login: user.login,
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url,
      description: user.description || '',
      createdAt: user.created_at,
      email: user.email,
    };
  }

  /**
   * Tests API connectivity and token generation
   */
  async testConnection(): Promise<{ success: boolean; message: string; userCount?: number }> {
    try {
      const token = await this.getAppAccessToken();
      if (!token) throw new Error('Could not obtain Twitch App token');

      // Test with Helix users endpoint
      const res = await fetch('https://api.twitch.tv/helix/users?login=twitch', {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Twitch API test returned HTTP ${res.status}`);
      }

      return {
        success: true,
        message: 'Twitch Helix API connected and verified successfully!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Twitch API connection test failed',
      };
    }
  }

  /**
   * Obtains an App Access Token using OAuth Client Credentials Flow
   */
  private async getAppAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Twitch credentials not configured. Please set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in settings.');
    }

    const now = Date.now();
    if (this.appAccessToken && this.tokenExpiresAt > now + 60000) {
      return this.appAccessToken;
    }

    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      });

      const res = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to obtain Twitch App Access Token: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      this.appAccessToken = data.access_token;
      this.tokenExpiresAt = now + (data.expires_in * 1000);
      return this.appAccessToken!;
    } catch (err: any) {
      console.error('[TwitchService] Token acquisition error:', err.message);
      throw err;
    }
  }

  /**
   * Resolves a single Twitch user by username/login
   */
  async getUserByUsername(username: string): Promise<TwitchUserResult | null> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) return null;

    const token = await this.getAppAccessToken();
    const url = `https://api.twitch.tv/helix/users?login=${encodeURIComponent(cleanUsername)}`;

    const res = await fetch(url, {
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      const text = await res.text();
      throw new Error(`Twitch API user lookup failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    if (!json.data || json.data.length === 0) {
      return null;
    }

    const user = json.data[0];
    return {
      id: user.id,
      login: user.login,
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url,
      description: user.description,
      createdAt: user.created_at,
    };
  }

  /**
   * Batch resolves Twitch users by list of logins (max 100 per call)
   */
  async getUsersByUsernames(usernames: string[]): Promise<TwitchUserResult[]> {
    if (usernames.length === 0) return [];
    if (!this.isConfigured()) return [];

    const token = await this.getAppAccessToken();
    const cleanLogins = usernames.map(u => u.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
    const results: TwitchUserResult[] = [];

    // Chunk into 100
    for (let i = 0; i < cleanLogins.length; i += 100) {
      const chunk = cleanLogins.slice(i, i + 100);
      const query = chunk.map(u => `login=${encodeURIComponent(u)}`).join('&');
      const url = `https://api.twitch.tv/helix/users?${query}`;

      const res = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        for (const user of json.data || []) {
          results.push({
            id: user.id,
            login: user.login,
            displayName: user.display_name,
            profileImageUrl: user.profile_image_url,
            description: user.description,
            createdAt: user.created_at,
          });
        }
      }
    }

    return results;
  }

  /**
   * Batch checks live streams by user IDs (max 100 per call)
   */
  async getStreamsByUserIds(userIds: string[]): Promise<TwitchStreamResult[]> {
    if (userIds.length === 0) return [];
    if (!this.isConfigured()) return [];

    const token = await this.getAppAccessToken();
    const results: TwitchStreamResult[] = [];

    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100);
      const query = chunk.map(id => `user_id=${encodeURIComponent(id)}`).join('&');
      const url = `https://api.twitch.tv/helix/streams?${query}`;

      const res = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[TwitchService] Streams lookup error (${res.status}): ${text}`);
        continue;
      }

      const json = await res.json();
      for (const item of json.data || []) {
        const formattedThumb = (item.thumbnail_url || '')
          .replace('{width}', '1280')
          .replace('{height}', '720');

        results.push({
          id: item.id,
          userId: item.user_id,
          userLogin: item.user_login,
          userName: item.user_name,
          gameId: item.game_id,
          gameName: item.game_name || 'Grand Theft Auto V',
          type: item.type,
          title: item.title,
          viewerCount: item.viewer_count || 0,
          startedAt: item.started_at,
          language: item.language,
          thumbnailUrl: formattedThumb,
          isMature: item.is_mature || false,
        });
      }
    }

    return results;
  }

  /**
   * Fetches the latest clips for a given Twitch broadcaster user ID
   */
  async getLatestClipsForBroadcaster(broadcasterId: string, limit = 1): Promise<any[]> {
    if (!this.isConfigured() || !broadcasterId) return [];
    try {
      const token = await this.getAppAccessToken();
      const res = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(broadcasterId)}&first=${limit}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`[TwitchService] Clips fetch failed (${res.status}): ${text}`);
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn(`[TwitchService] Failed to fetch clips for broadcaster ${broadcasterId}:`, err);
      return [];
    }
  }

  /**
   * Fetches the latest past broadcast VODs for a given Twitch user ID
   */
  async getLatestVodsForUser(userId: string, limit = 1): Promise<any[]> {
    if (!this.isConfigured() || !userId) return [];
    try {
      const token = await this.getAppAccessToken();
      const res = await fetch(`https://api.twitch.tv/helix/videos?user_id=${encodeURIComponent(userId)}&type=archive&first=${limit}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`[TwitchService] VODs fetch failed (${res.status}): ${text}`);
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn(`[TwitchService] Failed to fetch VOD for user ${userId}:`, err);
      return [];
    }
  }
}

export const twitchService = new TwitchService();
