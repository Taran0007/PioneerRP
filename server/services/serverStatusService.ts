import { ServerStatusResponse } from '../../src/types/index.js';
import { db } from '../db/database.js';

class ServerStatusService {
  private cache: ServerStatusResponse | null = null;
  private lastChecked: number = 0;
  private readonly CACHE_TTL_MS = 30000; // 30s cache

  async getServerStatus(): Promise<ServerStatusResponse> {
    const now = Date.now();
    if (this.cache && (now - this.lastChecked) < this.CACHE_TTL_MS) {
      return this.cache;
    }

    const settings = db.getSettings();
    const apiUrl = settings.serverStatusApiUrl;

    if (!apiUrl || !apiUrl.trim()) {
      const response: ServerStatusResponse = {
        available: false,
        online: false,
        message: 'SERVER STATUS UNAVAILABLE',
        checkedAt: new Date().toISOString(),
      };
      this.cache = response;
      this.lastChecked = now;
      return response;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      // Supports standard FiveM dynamic.json or custom Pioneer status endpoint
      const playerCount = typeof data.clients === 'number' ? data.clients : data.playerCount;
      const maxPlayers = typeof data.sv_maxclients === 'number' ? data.sv_maxclients : data.maxPlayers || 128;
      const serverName = data.hostname || data.serverName || 'Pioneer RP';

      const response: ServerStatusResponse = {
        available: true,
        online: true,
        playerCount: typeof playerCount === 'number' ? playerCount : undefined,
        maxPlayers: typeof maxPlayers === 'number' ? maxPlayers : undefined,
        serverName,
        message: 'ONLINE',
        checkedAt: new Date().toISOString(),
      };

      this.cache = response;
      this.lastChecked = now;
      return response;
    } catch (err: any) {
      console.warn('[ServerStatusService] Failed querying FiveM server status:', err.message);
      const response: ServerStatusResponse = {
        available: false,
        online: false,
        message: 'SERVER STATUS UNAVAILABLE',
        checkedAt: new Date().toISOString(),
      };
      this.cache = response;
      this.lastChecked = now;
      return response;
    }
  }
}

export const serverStatusService = new ServerStatusService();
