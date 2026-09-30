import { EventEmitter } from 'events';
import { db } from '../db/database.js';
import { twitchService } from './twitchService.js';

export interface SyncResult {
  timestamp: string;
  success: boolean;
  totalMonitoredAccounts: number;
  liveDetected: number;
  offlineMarked: number;
  error?: string | null;
}

class StreamSyncService extends EventEmitter {
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastResult: SyncResult | null = null;

  init() {
    this.startScheduledSync();
  }

  startScheduledSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    const settings = db.getSettings();
    const intervalSec = Math.max(20, Math.min(600, settings.twitchPollingIntervalSeconds || 45));
    console.log(`[StreamSync] Starting scheduled Twitch sync every ${intervalSec} seconds...`);

    // Run first sync shortly after startup
    setTimeout(() => {
      this.runSync().catch(err => console.error('[StreamSync] Initial sync error:', err));
    }, 2000);

    this.syncTimer = setInterval(() => {
      this.runSync().catch(err => console.error('[StreamSync] Interval sync error:', err));
    }, intervalSec * 1000);
  }

  restartWithNewInterval() {
    this.startScheduledSync();
  }

  getLastResult(): SyncResult | null {
    return this.lastResult;
  }

  async runSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        timestamp: new Date().toISOString(),
        success: false,
        totalMonitoredAccounts: 0,
        liveDetected: 0,
        offlineMarked: 0,
        error: 'Sync already in progress',
      };
    }

    this.isSyncing = true;
    db.updateSettings({ syncStatus: 'syncing' });

    const startTime = new Date().toISOString();
    let liveDetected = 0;
    let offlineMarked = 0;

    try {
      // 1. Fetch all enabled Twitch platform accounts
      const twitchAccounts = await db.getAllPlatformAccounts('TWITCH');
      const enabledAccounts = twitchAccounts.filter(a => a.creator.enabled);

      if (enabledAccounts.length === 0) {
        db.updateSettings({
          lastSyncAt: startTime,
          syncStatus: 'success',
          syncErrorMessage: null,
        });
        const result: SyncResult = {
          timestamp: startTime,
          success: true,
          totalMonitoredAccounts: 0,
          liveDetected: 0,
          offlineMarked: 0,
        };
        this.lastResult = result;
        this.isSyncing = false;
        return result;
      }

      // Check if Twitch API is configured
      if (!twitchService.isConfigured()) {
        const errorMsg = 'Twitch API credentials (TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET) not configured.';
        db.updateSettings({
          lastSyncAt: startTime,
          syncStatus: 'error',
          syncErrorMessage: errorMsg,
        });
        const result: SyncResult = {
          timestamp: startTime,
          success: false,
          totalMonitoredAccounts: enabledAccounts.length,
          liveDetected: 0,
          offlineMarked: 0,
          error: errorMsg,
        };
        this.lastResult = result;
        this.isSyncing = false;
        return result;
      }

      // 2. Resolve missing platform user IDs if any are placeholder seed IDs
      const accountsToResolve = enabledAccounts.filter(
        a => !a.platformUserId || a.platformUserId.startsWith('twitch_seed_')
      );
      if (accountsToResolve.length > 0) {
        try {
          const resolvedUsers = await twitchService.getUsersByUsernames(accountsToResolve.map(a => a.username));
          for (const user of resolvedUsers) {
            const match = enabledAccounts.find(
              a => a.username.toLowerCase() === user.login.toLowerCase()
            );
            if (match) {
              match.platformUserId = user.id;
              match.profileImageUrl = user.profileImageUrl;
              await db.updateCreator(match.creatorId, {
                platformUserId: user.id,
                profileImageUrl: match.creator.profileImageUrl?.includes('avatar.vercel.sh')
                  ? user.profileImageUrl
                  : match.creator.profileImageUrl,
              });
            }
          }
        } catch (resolveErr: any) {
          console.warn('[StreamSync] Warning resolving twitch usernames:', resolveErr.message);
        }
      }

      // 3. Batch check live status for all valid accounts
      const userIds = enabledAccounts
        .map(a => a.platformUserId)
        .filter(id => id && !id.startsWith('twitch_seed_'));

      let liveStreams: any[] = [];
      if (userIds.length > 0) {
        liveStreams = await twitchService.getStreamsByUserIds(userIds);
      }

      const liveUserIdSet = new Set(liveStreams.map(s => s.userId));

      // 4. Update live streams and offline status
      for (const account of enabledAccounts) {
        const isLive = liveUserIdSet.has(account.platformUserId);

        if (isLive) {
          const streamInfo = liveStreams.find(s => s.userId === account.platformUserId);
          if (streamInfo) {
            await db.upsertLiveStream({
              creatorId: account.creatorId,
              platformAccountId: account.id,
              platform: 'TWITCH',
              platformStreamId: streamInfo.id,
              title: streamInfo.title,
              category: streamInfo.gameName || 'Grand Theft Auto V',
              viewerCount: streamInfo.viewerCount,
              thumbnailUrl: streamInfo.thumbnailUrl,
              startedAt: streamInfo.startedAt,
              isLive: true,
            });
            liveDetected++;
          }
        } else {
          // If was previously live, mark offline
          if (account.creator.currentStream?.isLive) {
            await db.markPlatformAccountOffline(account.id);
            offlineMarked++;
          }
        }
      }

      const finishTime = new Date().toISOString();
      db.updateSettings({
        lastSyncAt: finishTime,
        syncStatus: 'success',
        syncErrorMessage: null,
      });

      const result: SyncResult = {
        timestamp: finishTime,
        success: true,
        totalMonitoredAccounts: enabledAccounts.length,
        liveDetected,
        offlineMarked,
      };

      this.lastResult = result;
      this.emit('sync_complete', result);
      return result;
    } catch (err: any) {
      console.error('[StreamSync] Sync execution failed:', err);
      const finishTime = new Date().toISOString();
      db.updateSettings({
        lastSyncAt: finishTime,
        syncStatus: 'error',
        syncErrorMessage: err.message || 'Twitch API sync failure',
      });
      const result: SyncResult = {
        timestamp: finishTime,
        success: false,
        totalMonitoredAccounts: 0,
        liveDetected: 0,
        offlineMarked: 0,
        error: err.message,
      };
      this.lastResult = result;
      this.emit('sync_error', result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new StreamSyncService();
