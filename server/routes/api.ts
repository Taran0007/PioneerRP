import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { twitchService } from '../services/twitchService.js';
import { syncService } from '../services/syncService.js';
import { serverStatusService } from '../services/serverStatusService.js';
import { discordWebhook } from '../services/discordWebhook.js';

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || 'pioneer_rp_live_secret_session_key_change_in_production';

// Client SSE connections
const sseClients = new Set<Response>();

// Broadcast updates to connected SSE clients
syncService.on('sync_complete', (result) => {
  const payload = JSON.stringify({ type: 'SYNC_UPDATE', result, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
});

// Middleware: Admin Authentication
export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.pioneer_admin_token || req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/* =========================================================================
   PUBLIC ENDPOINTS
   ========================================================================= */

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    storage: db.storageMode,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Real-Time Server-Sent Events (SSE)
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// GET /api/live — Currently live creators
router.get('/live', async (_req: Request, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: true, isLiveOnly: true });

    // Live Sorting Rule (Spec item 64):
    // 1. Featured live creators according to featuredOrder
    // 2. Non-featured live creators by viewer count descending
    creators.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.featured && b.featured) {
        return (a.featuredOrder || 999) - (b.featuredOrder || 999);
      }
      const viewersA = a.currentStream?.viewerCount || 0;
      const viewersB = b.currentStream?.viewerCount || 0;
      return viewersB - viewersA;
    });

    res.json({
      data: creators,
      totalLive: creators.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve live creators: ' + err.message });
  }
});

// GET /api/featured — Featured creators
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: true, featuredOnly: true });
    creators.sort((a, b) => {
      // Live featured first, then by featuredOrder
      const aLive = a.currentStream?.isLive ? 1 : 0;
      const bLive = b.currentStream?.isLive ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      return (a.featuredOrder || 999) - (b.featuredOrder || 999);
    });

    res.json({
      data: creators,
      totalFeatured: creators.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve featured creators: ' + err.message });
  }
});

// GET /api/streamers — Directory with filters & search
router.get('/streamers', async (req: Request, res: Response) => {
  try {
    const { filter, search, platform } = req.query as {
      filter?: 'all' | 'live' | 'offline' | 'featured';
      search?: string;
      platform?: string;
    };

    let creators = await db.getCreators({
      enabledOnly: true,
      search: search || undefined,
      platform: platform || undefined,
    });

    if (filter === 'live') {
      creators = creators.filter(c => !!c.currentStream?.isLive);
    } else if (filter === 'offline') {
      creators = creators.filter(c => !c.currentStream?.isLive);
    } else if (filter === 'featured') {
      creators = creators.filter(c => c.featured);
    }

    // Default directory sorting: Live first, then featured, then alphabetical
    creators.sort((a, b) => {
      const aLive = a.currentStream?.isLive ? 1 : 0;
      const bLive = b.currentStream?.isLive ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;

      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      return a.displayName.localeCompare(b.displayName);
    });

    res.json({
      data: creators,
      total: creators.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve streamers: ' + err.message });
  }
});

// Alias for /api/creators
router.get('/creators', async (req: Request, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: true });
    res.json({ data: creators, total: creators.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/streamers/:slug — Detailed profile
router.get('/streamers/:slug', async (req: Request, res: Response) => {
  try {
    const creator = await db.getCreatorBySlug(req.params.slug);
    if (!creator || !creator.enabled) {
      return res.status(404).json({ error: 'Streamer not found.' });
    }

    const streamHistory = await db.getRecentStreamHistory(creator.id, 5);

    // Track profile view
    db.trackAnalyticsEvent('profile_view', creator.id, { slug: creator.slug }).catch(() => {});

    res.json({
      data: {
        ...creator,
        streamHistory,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve streamer profile: ' + err.message });
  }
});

// GET /api/settings — Public site settings
router.get('/settings', (_req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

// GET /api/server-status — Pioneer RP FiveM status
router.get('/server-status', async (_req: Request, res: Response) => {
  try {
    const status = await serverStatusService.getServerStatus();
    res.json({ data: status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve server status.' });
  }
});

// GET /api/vods — Latest VOD / past broadcasts for each creator directly from Twitch Helix
router.get('/vods', async (_req: Request, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: true });
    const vods: any[] = [];

    for (const c of creators) {
      const pa = c.platformAccount;
      let twitchVods: any[] = [];
      let resolvedUserId = pa?.platformUserId;

      // If Twitch is configured, resolve Twitch User ID if missing or seed-based
      if (twitchService.isConfigured() && pa?.username) {
        try {
          if (!resolvedUserId || resolvedUserId.startsWith('twitch_seed_')) {
            const user = await twitchService.getUserByUsername(pa.username);
            if (user?.id) {
              resolvedUserId = user.id;
              pa.platformUserId = user.id;
            }
          }

          if (resolvedUserId && !resolvedUserId.startsWith('twitch_seed_')) {
            twitchVods = await twitchService.getLatestVodsForUser(resolvedUserId, 1);
          }
        } catch (err) {
          console.warn(`[API] Could not fetch real Twitch VODs for ${pa.username}:`, err);
          twitchVods = [];
        }
      }

      if (twitchVods.length > 0) {
        for (const tv of twitchVods) {
          vods.push({
            id: `vod_${tv.id}`,
            vodId: tv.id,
            creatorId: c.id,
            creatorDisplayName: c.displayName,
            creatorSlug: c.slug,
            creatorProfileImage: c.profileImageUrl,
            characterName: c.characterName,
            gangName: c.gangName,
            title: tv.title || `${c.displayName} - Past Broadcast`,
            url: tv.url || (pa ? pa.channelUrl + '/videos' : `https://twitch.tv/${c.slug}`),
            embedUrl: `https://player.twitch.tv/?video=${tv.id}`,
            thumbnailUrl: (tv.thumbnail_url || '')
              .replace('%{width}', '1280')
              .replace('%{height}', '720')
              .replace('{width}', '1280')
              .replace('{height}', '720') || c.profileImageUrl,
            duration: tv.duration || 'Broadcast',
            publishedAt: tv.created_at || new Date().toISOString(),
            viewCount: typeof tv.view_count === 'number' ? tv.view_count : null,
            hasArchivedVod: true,
          });
        }
      } else {
        const channelUrl = pa ? pa.channelUrl : `https://twitch.tv/${c.slug}`;
        vods.push({
          id: `archive_channel_${c.id}`,
          creatorId: c.id,
          creatorDisplayName: c.displayName,
          creatorSlug: c.slug,
          creatorProfileImage: c.profileImageUrl,
          characterName: c.characterName,
          gangName: c.gangName,
          title: `${c.displayName} — Twitch Channel Videos & Highlights`,
          url: `${channelUrl}/videos`,
          embedUrl: `https://player.twitch.tv/?channel=${pa?.username || c.slug}`,
          thumbnailUrl: c.profileImageUrl,
          duration: 'Replay Archive',
          publishedAt: c.lastLiveAt || new Date().toISOString(),
          viewCount: null,
          hasArchivedVod: false,
          isDirectChannelLink: true,
        });
      }
    }

    res.json({ data: vods });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve creator VODs: ' + err.message });
  }
});

// GET /api/clips — Community & Auto-fetched Twitch Clips for each creator
router.get('/clips', async (req: Request, res: Response) => {
  try {
    const { category, creatorId } = req.query;
    const dbClips = await db.getClips({
      category: category as string,
      creatorId: creatorId as string,
      approvedOnly: true,
    });

    const creators = await db.getCreators({ enabledOnly: true });
    const autoClips: any[] = [];

    // If Twitch is configured, fetch each streamer's latest clip automatically
    if (twitchService.isConfigured()) {
      for (const c of creators) {
        if (creatorId && c.id !== creatorId) continue;
        const pa = c.platformAccount;
        if (!pa?.username) continue;

        try {
          let resolvedUserId = pa.platformUserId;
          if (!resolvedUserId || resolvedUserId.startsWith('twitch_seed_')) {
            const user = await twitchService.getUserByUsername(pa.username);
            if (user?.id) {
              resolvedUserId = user.id;
              pa.platformUserId = user.id;
            }
          }

          if (resolvedUserId && !resolvedUserId.startsWith('twitch_seed_')) {
            const twitchClips = await twitchService.getLatestClipsForBroadcaster(resolvedUserId, 1);
            if (twitchClips && twitchClips.length > 0) {
              for (const tc of twitchClips) {
                // Determine category heuristic
                let autoCat: any = 'CHASE';
                const lowerTitle = (tc.title || '').toLowerCase();
                if (lowerTitle.includes('shoot') || lowerTitle.includes('gun') || lowerTitle.includes('10-99')) autoCat = 'GUNFIGHT';
                else if (lowerTitle.includes('heist') || lowerTitle.includes('bank') || lowerTitle.includes('vault')) autoCat = 'HEIST';
                else if (lowerTitle.includes('court') || lowerTitle.includes('arrest') || lowerTitle.includes('story')) autoCat = 'DRAMA';
                else if (lowerTitle.includes('lol') || lowerTitle.includes('funny') || lowerTitle.includes('fail')) autoCat = 'COMEDY';

                if (category && category !== 'ALL' && autoCat !== category) continue;

                autoClips.push({
                  id: `twitch_clip_${tc.id}`,
                  clipId: tc.id,
                  title: tc.title || `${c.displayName} - Roleplay Highlight`,
                  clipUrl: tc.url,
                  embedUrl: tc.embed_url || `https://clips.twitch.tv/embed?clip=${tc.id}`,
                  thumbnailUrl: tc.thumbnail_url || c.profileImageUrl,
                  creatorId: c.id,
                  creatorName: c.displayName,
                  creatorSlug: c.slug,
                  creatorProfileImage: c.profileImageUrl,
                  characterName: c.characterName,
                  gangName: c.gangName,
                  category: autoCat,
                  submitterName: 'Official Stream Broadcast',
                  upvotes: tc.view_count || 12,
                  approved: true,
                  featured: true,
                  createdAt: tc.created_at || new Date().toISOString(),
                  isTwitchClip: true,
                });
              }
            }
          }
        } catch (err) {
          console.warn(`[API] Could not auto-fetch clip for ${pa?.username}:`, err);
        }
      }
    }

    // Merge auto-fetched clips with database community clips (avoiding duplicate URLs)
    const clipUrlSet = new Set<string>();
    const mergedClips: any[] = [];

    for (const clip of autoClips) {
      if (!clipUrlSet.has(clip.clipUrl)) {
        clipUrlSet.add(clip.clipUrl);
        mergedClips.push(clip);
      }
    }

    for (const clip of dbClips) {
      if (!clipUrlSet.has(clip.clipUrl)) {
        clipUrlSet.add(clip.clipUrl);
        mergedClips.push(clip);
      }
    }

    res.json({ data: mergedClips, total: mergedClips.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load community clips: ' + err.message });
  }
});

// POST /api/clips/submit — Submit a community clip
router.post('/clips/submit', async (req: Request, res: Response) => {
  try {
    const { title, clipUrl, creatorName, category, submitterName } = req.body;
    if (!title || !clipUrl) {
      return res.status(400).json({ error: 'Title and Twitch clip URL are required.' });
    }

    const clip = await db.submitClip({
      title,
      clipUrl,
      creatorName,
      category,
      submitterName,
    });

    res.status(201).json({ success: true, message: 'Clip submitted successfully!', data: clip });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed submitting clip: ' + err.message });
  }
});

// POST /api/clips/:id/upvote — Upvote a clip
router.post('/clips/:id/upvote', async (req: Request, res: Response) => {
  try {
    const upvotes = await db.upvoteClip(req.params.id);
    if (upvotes === null) {
      return res.status(404).json({ error: 'Clip not found.' });
    }
    res.json({ success: true, upvotes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analytics — Track interaction clicks (watch click, creator code, store click)
router.post('/analytics', async (req: Request, res: Response) => {
  try {
    const { eventType, creatorId, metadata } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType required.' });
    }

    const allowedEvents = ['watch_click', 'creator_code_click', 'store_click', 'profile_view'];
    if (!allowedEvents.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type.' });
    }

    await db.trackAnalyticsEvent(eventType, creatorId, metadata);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record event.' });
  }
});

// POST /api/internal/sync — Protected scheduler / cron endpoint
router.post('/internal/sync', async (req: Request, res: Response) => {
  const secret = req.headers['x-sync-secret'] || req.query.secret;
  const configuredSecret = process.env.INTERNAL_SYNC_SECRET || 'pioneer_cron_secret_key';

  if (!secret || secret !== configuredSecret) {
    return res.status(403).json({ error: 'Forbidden: Invalid sync secret.' });
  }

  try {
    const result = await syncService.runSync();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

/* =========================================================================
   AUTH ENDPOINTS
   ========================================================================= */

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = (identifier || username || email || '').trim();
    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Username or email, and password are required.' });
    }

    const admin = await db.getAdminByEmailOrUsername(loginIdentifier);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('pioneer_admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    db.logAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN',
      entityType: 'AUTH',
      entityId: admin.id,
    }).catch(() => {});

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login error: ' + err.message });
  }
});

// GET /api/auth/twitch/url — Prepares Twitch OAuth popup URL
router.get('/auth/twitch/url', (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/auth/twitch/callback`;
    const configured = twitchService.isConfigured();

    if (!configured) {
      return res.json({
        configured: false,
        redirectUri,
        clientId: twitchService.getClientId(),
        message: 'Twitch Client ID or Secret is not yet configured. You can configure it directly in Admin Settings.',
      });
    }

    const url = twitchService.getOAuthUrl(redirectUri);
    res.json({
      configured: true,
      url,
      redirectUri,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/twitch/callback — OAuth Popup callback
router.get(['/auth/twitch/callback', '/auth/twitch/callback/'], async (req: Request, res: Response) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      throw new Error(`Twitch error: ${error_description || error}`);
    }
    if (!code || typeof code !== 'string') {
      throw new Error('No authorization code received from Twitch.');
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/auth/twitch/callback`;

    const tokenData = await twitchService.exchangeCodeForUserToken(code, redirectUri);
    const twitchUser = await twitchService.getUserFromToken(tokenData.accessToken);

    // Look up or establish admin
    let admin = await db.getAdminByEmail(twitchUser.email || `${twitchUser.login}@twitch.tv`);
    if (!admin) {
      const allAdmins = (db as any).memoryDb.adminUsers;
      if (allAdmins && allAdmins.length > 0) {
        admin = allAdmins[0];
      } else {
        admin = await db.createAdmin(
          twitchUser.email || `${twitchUser.login}@twitch.tv`,
          twitchUser.displayName,
          'twitch_oauth_' + Math.random().toString(36)
        ) as any;
      }
    }

    if (!admin) {
      throw new Error('Could not establish admin session for Twitch account.');
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        twitchLogin: twitchUser.login,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('pioneer_admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    db.logAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'TWITCH_OAUTH_LOGIN',
      entityType: 'AUTH',
      entityId: twitchUser.id,
      metadata: { twitchUsername: twitchUser.login, displayName: twitchUser.displayName },
    }).catch(() => {});

    // Return popup postMessage script conforming to 3P OAuth skill
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Twitch Authentication Complete</title>
          <style>
            body { background: #09090b; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; padding: 2rem; border-radius: 1rem; background: #18181b; border: 1px solid #3f3f46; max-width: 400px; }
            h2 { color: #a855f7; margin-bottom: 0.5rem; }
            p { color: #a1a1aa; font-size: 0.875rem; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Twitch Connected!</h2>
            <p>Welcome, ${twitchUser.displayName} (@${twitchUser.login}).</p>
            <p>Signing you into Pioneer RP Admin...</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    token: "${token}",
                    user: ${JSON.stringify({
                      id: admin.id,
                      email: admin.email,
                      username: admin.username,
                      role: admin.role,
                      twitchLogin: twitchUser.login,
                    })}
                  }, '*');
                  setTimeout(function() { window.close(); }, 800);
                } else {
                  window.location.href = '/admin';
                }
              } catch(e) {
                window.location.href = '/admin';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[Twitch OAuth Callback Error]:', err.message);
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Twitch Authentication Failed</title>
          <style>
            body { background: #09090b; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; padding: 2rem; }
            .box { max-width: 500px; margin: 2rem auto; padding: 2rem; border-radius: 1rem; background: #18181b; border: 1px solid #ef4444; }
            h2 { color: #ef4444; }
            p { color: #d4d4d8; font-size: 0.875rem; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Twitch Authentication Failed</h2>
            <p>${err.message}</p>
            <p style="color:#71717a;">Please make sure the Redirect URI in Twitch Console matches exactly: <code>${process.env.APP_URL || ''}/api/auth/twitch/callback</code></p>
          </div>
        </body>
      </html>
    `);
  }
});

// GET /api/auth/me
router.get('/auth/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.adminUser });
});

// POST /api/auth/logout
router.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('pioneer_admin_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

/* =========================================================================
   ADMIN MANAGEMENT ENDPOINTS (PROTECTED)
   ========================================================================= */

// GET /api/admin/overview
router.get('/admin/overview', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const allCreators = await db.getCreators({ enabledOnly: false });
    const liveStreams = allCreators.filter(c => !!c.currentStream?.isLive);
    const featured = allCreators.filter(c => c.featured);
    const totalViewers = liveStreams.reduce((acc, c) => acc + (c.currentStream?.viewerCount || 0), 0);
    const settings = db.getSettings();
    const analytics = db.getAnalyticsSummary();

    res.json({
      data: {
        totalCreators: allCreators.length,
        liveNow: liveStreams.length,
        featuredCount: featured.length,
        totalViewers,
        twitchConfigured: settings.twitchClientIdConfigured,
        lastSyncAt: settings.lastSyncAt,
        syncStatus: settings.syncStatus,
        syncErrorMessage: settings.syncErrorMessage,
        totalWatchClicks: analytics.totalWatchClicks,
        totalCodeClicks: analytics.totalCodeClicks,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve overview: ' + err.message });
  }
});

// GET /api/admin/streamers — All streamers with accounts
router.get('/admin/streamers', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: false });
    res.json({ data: creators });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve admin streamers.' });
  }
});

// POST /api/admin/streamers/resolve-twitch — Resolves Twitch account before creation
router.post('/admin/streamers/resolve-twitch', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Twitch username is required.' });
    }

    if (!twitchService.isConfigured()) {
      return res.status(400).json({
        error: 'Twitch API credentials are not configured yet. Configure TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in Admin Settings or .env.',
      });
    }

    const twitchUser = await twitchService.getUserByUsername(username);
    if (!twitchUser) {
      return res.status(404).json({ error: `Twitch account "${username}" not found on Twitch.` });
    }

    res.json({
      success: true,
      data: {
        userId: twitchUser.id,
        username: twitchUser.login,
        displayName: twitchUser.displayName,
        profileImageUrl: twitchUser.profileImageUrl,
        channelUrl: `https://twitch.tv/${twitchUser.login}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Twitch lookup error: ' + err.message });
  }
});

// POST /api/admin/streamers — Creates streamer
router.post('/admin/streamers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      username,
      displayName,
      characterName,
      gangName,
      bio,
      profileImageUrl,
      featured,
      featuredOrder,
      creatorCode,
      creatorCodeDescription,
      creatorStoreUrl,
      verified,
      enabled,
      platformUserId,
      channelUrl,
    } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Twitch username is required.' });
    }

    // Safe external URL verification (Spec item 92)
    if (creatorStoreUrl && !creatorStoreUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Creator store URL must start with https://' });
    }

    let resolvedUserId = platformUserId;
    let resolvedImage = profileImageUrl;
    let resolvedName = displayName || username;

    // If twitch service configured and no userId passed, resolve it
    if (!resolvedUserId && twitchService.isConfigured()) {
      try {
        const u = await twitchService.getUserByUsername(username);
        if (u) {
          resolvedUserId = u.id;
          resolvedImage = resolvedImage || u.profileImageUrl;
          resolvedName = displayName || u.displayName;
        }
      } catch (err) {
        console.warn('[Admin] Resolve on create warning:', err);
      }
    }

    const creator = await db.createCreator({
      username: username.trim(),
      displayName: resolvedName,
      platform: 'TWITCH',
      platformUserId: resolvedUserId || `twitch_${username.toLowerCase()}`,
      channelUrl: channelUrl || `https://twitch.tv/${username.trim()}`,
      profileImageUrl: resolvedImage,
      characterName,
      gangName,
      bio,
      featured: !!featured,
      featuredOrder: featuredOrder ? parseInt(featuredOrder, 10) : 999,
      creatorCode: creatorCode ? creatorCode.trim().toUpperCase() : undefined,
      creatorCodeDescription,
      creatorStoreUrl,
      verified: verified !== false,
      enabled: enabled !== false,
    });

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'ADD_STREAMER',
      entityType: 'CREATOR',
      entityId: creator.id,
      metadata: { username, displayName: creator.displayName },
    }).catch(() => {});

    // Trigger sync in background to check if newly added streamer is live right now!
    syncService.runSync().catch(() => {});

    res.status(201).json({ success: true, data: creator });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/admin/streamers/:id — Updates streamer & manual overrides
router.put('/admin/streamers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate store url if updated
    if (updates.creatorStoreUrl && !updates.creatorStoreUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Store URL must start with https://' });
    }

    if (updates.creatorCode) {
      updates.creatorCode = updates.creatorCode.trim().toUpperCase();
    }

    const updated = await db.updateCreator(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Streamer not found.' });
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'UPDATE_STREAMER',
      entityType: 'CREATOR',
      entityId: id,
      metadata: updates,
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update streamer: ' + err.message });
  }
});

// DELETE /api/admin/streamers/:id — Delete / deactivate streamer
router.delete('/admin/streamers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteCreator(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Streamer not found.' });
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'DELETE_STREAMER',
      entityType: 'CREATOR',
      entityId: id,
    }).catch(() => {});

    res.json({ success: true, message: 'Streamer removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete streamer.' });
  }
});

// PUT /api/admin/featured/reorder — Updates featured orders via drag-and-drop
router.put('/admin/featured/reorder', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body as { items: Array<{ id: string; featuredOrder: number; featured: boolean }> };
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required.' });
    }

    await db.updateFeaturedOrder(items);

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'REORDER_FEATURED',
      entityType: 'FEATURED',
      entityId: 'featured_list',
      metadata: { count: items.length },
    }).catch(() => {});

    res.json({ success: true, message: 'Featured order updated.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update featured order.' });
  }
});

// GET /api/admin/live — Live monitor table
router.get('/admin/live', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: false });
    const settings = db.getSettings();

    const monitorData = creators.map(c => ({
      id: c.id,
      displayName: c.displayName,
      username: c.platformAccount?.username || c.slug,
      platform: c.platformAccount?.platform || 'TWITCH',
      isLive: !!c.currentStream?.isLive,
      viewerCount: c.currentStream?.viewerCount || 0,
      title: c.currentStream?.title || '—',
      category: c.currentStream?.category || '—',
      startedAt: c.currentStream?.startedAt || null,
      lastSeenAt: c.currentStream?.lastSeenAt || null,
      featured: c.featured,
      enabled: c.enabled,
      channelUrl: c.platformAccount?.channelUrl || `https://twitch.tv/${c.platformAccount?.username}`,
    }));

    res.json({
      data: monitorData,
      lastSyncAt: settings.lastSyncAt,
      syncStatus: settings.syncStatus,
      syncErrorMessage: settings.syncErrorMessage,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load live monitor.' });
  }
});

// GET /api/admin/analytics — Detailed analytics
router.get('/admin/analytics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = db.getAnalyticsSummary();
    res.json({ data: summary });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

// GET /api/admin/settings — Full settings
router.get('/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// PUT /api/admin/settings — Update settings
router.put('/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body;
    const current = db.getSettings();
    const updated = db.updateSettings(updates);

    if (updates.twitchClientId || updates.twitchClientSecret) {
      twitchService.updateCredentials(
        updates.twitchClientId || process.env.TWITCH_CLIENT_ID || '',
        updates.twitchClientSecret || process.env.TWITCH_CLIENT_SECRET || ''
      );
    }

    if (
      updates.twitchPollingIntervalSeconds &&
      updates.twitchPollingIntervalSeconds !== current.twitchPollingIntervalSeconds
    ) {
      syncService.restartWithNewInterval();
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'UPDATE_SETTINGS',
      entityType: 'SETTINGS',
      entityId: 'global',
      metadata: updates,
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// POST /api/admin/twitch/test — Test Twitch credentials and Helix API
router.post('/admin/twitch/test', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const testResult = await twitchService.testConnection();
    res.json(testResult);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/discord/test — Test Discord webhook notification
router.post('/admin/discord/test', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { webhookUrl } = req.body;
    const result = await discordWebhook.sendTestNotification(webhookUrl);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/twitch/quick-connect — Save credentials and verify immediately
router.post('/admin/twitch/quick-connect', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Twitch Client ID and Client Secret are required.' });
    }

    twitchService.updateCredentials(clientId, clientSecret);
    const testRes = await twitchService.testConnection();
    if (!testRes.success) {
      return res.status(400).json({
        error: `Twitch verification failed: ${testRes.message}. Please check Client ID and Secret.`,
      });
    }

    // Save into database settings
    db.updateSettings({
      twitchClientIdConfigured: true,
      syncStatus: 'idle',
      syncErrorMessage: null,
    });

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'TWITCH_API_CONFIGURED',
      entityType: 'SETTINGS',
      entityId: 'twitch',
      metadata: { clientId: clientId.substring(0, 6) + '...' },
    }).catch(() => {});

    // Kick off an immediate sync
    syncService.runSync().catch(() => {});

    res.json({
      success: true,
      message: 'Twitch API verified and connected successfully! Real-time background sync is now active.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/sync-now — Manually trigger Twitch sync
router.post('/admin/sync-now', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await syncService.runSync();
    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'MANUAL_SYNC_TRIGGERED',
      entityType: 'SYNC',
      entityId: 'twitch',
      metadata: result,
    }).catch(() => {});

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Manual sync failed: ' + err.message });
  }
});

// GET /api/admin/audit-logs — Audit trail
router.get('/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.getAuditLogs(100);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// GET /api/admin/admins — List all administrators
router.get('/admin/admins', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const admins = await db.getAllAdmins();
    res.json({ data: admins });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve administrators.' });
  }
});

// POST /api/admin/admins — Create new administrator
router.post('/admin/admins', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const newAdmin = await db.createAdmin(email, username, password, role || 'admin');

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'CREATE_ADMIN_USER',
      entityType: 'ADMIN_USER',
      entityId: newAdmin.id,
      metadata: { username: newAdmin.username, email: newAdmin.email, role: newAdmin.role },
    }).catch(() => {});

    res.status(201).json({ success: true, data: newAdmin });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/admins/:id — Delete administrator
router.delete('/admin/admins/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.adminUser!.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
    }

    const success = await db.deleteAdmin(id);
    if (!success) {
      return res.status(404).json({ error: 'Administrator not found.' });
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'DELETE_ADMIN_USER',
      entityType: 'ADMIN_USER',
      entityId: id,
    }).catch(() => {});

    res.json({ success: true, message: 'Administrator removed successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/db/export — Export full database JSON backup
router.get('/admin/db/export', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const backup = db.exportFullDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pioneer_live_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export database: ' + err.message });
  }
});

// POST /api/admin/db/import — Restore or import full database JSON
router.post('/admin/db/import', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const importedData = req.body;
    const result = await db.importFullDatabase(importedData);

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'RESTORE_DATABASE_BACKUP',
      entityType: 'DATABASE',
      entityId: 'pioneer_live',
      metadata: { creatorCount: result.creatorCount },
    }).catch(() => {});

    res.json({
      message: `Database successfully restored! Loaded ${result.creatorCount} creators.`,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Import failed: ' + err.message });
  }
});

// GET /api/admin/clips — Admin moderation list of all clips
router.get('/admin/clips', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const clips = await db.getClips({ approvedOnly: false });
    res.json({ data: clips, total: clips.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load clips for moderation: ' + err.message });
  }
});

// PUT /api/admin/clips/:id — Approve, feature, or update clip
router.put('/admin/clips/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateClip(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'MODERATE_CLIP',
      entityType: 'COMMUNITY_CLIP',
      entityId: id,
      metadata: updates,
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update clip: ' + err.message });
  }
});

// DELETE /api/admin/clips/:id — Remove clip
router.delete('/admin/clips/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteClip(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: 'DELETE_CLIP',
      entityType: 'COMMUNITY_CLIP',
      entityId: id,
    }).catch(() => {});

    res.json({ success: true, message: 'Clip deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete clip: ' + err.message });
  }
});

// GET /api/admin/export/creators.csv — Export creators to CSV
router.get('/admin/export/creators.csv', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const creators = await db.getCreators({ enabledOnly: false });
    const headers = ['ID', 'Username', 'DisplayName', 'CharacterName', 'GangName', 'Faction', 'CreatorCode', 'Featured', 'Verified', 'Enabled', 'ChannelUrl'];
    
    const rows = creators.map(c => [
      `"${c.id || ''}"`,
      `"${c.platformAccount?.username || c.slug || ''}"`,
      `"${(c.displayName || '').replace(/"/g, '""')}"`,
      `"${(c.characterName || '').replace(/"/g, '""')}"`,
      `"${(c.gangName || '').replace(/"/g, '""')}"`,
      `"${c.faction || 'CIVILIAN'}"`,
      `"${c.creatorCode || ''}"`,
      c.featured ? 'YES' : 'NO',
      c.verified ? 'YES' : 'NO',
      c.enabled ? 'YES' : 'NO',
      `"${c.platformAccount?.channelUrl || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pioneer_creators_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export creators CSV: ' + err.message });
  }
});

// GET /api/admin/export/audit-logs.csv — Export audit logs to CSV
router.get('/admin/export/audit-logs.csv', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.getAuditLogs(500);
    const headers = ['ID', 'Timestamp', 'AdminEmail', 'Action', 'EntityType', 'EntityId', 'Metadata'];

    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.createdAt}"`,
      `"${l.adminEmail}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId}"`,
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pioneer_audit_logs_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export audit logs CSV: ' + err.message });
  }
});

// POST /api/streamer-requests/submit — Public stream application submission
router.post('/streamer-requests/submit', async (req: Request, res: Response) => {
  try {
    const { username, characterName, faction, bio, creatorCode } = req.body;
    if (!username || !characterName || !bio) {
      return res.status(400).json({ error: 'Twitch username, character name, and bio are required.' });
    }

    const requestObj = await db.submitStreamerRequest({
      username,
      characterName,
      faction,
      bio,
      creatorCode,
    });

    res.status(201).json({ success: true, message: 'Streamer application submitted successfully! An admin will review it soon.', data: requestObj });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed submitting application: ' + err.message });
  }
});

// GET /api/admin/streamer-requests — Admin get all streamer applications
router.get('/admin/streamer-requests', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await db.getStreamerRequests();
    res.json({ data: requests, total: requests.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load streamer applications: ' + err.message });
  }
});

// PUT /api/admin/streamer-requests/:id/moderate — Admin approve or reject application
router.put('/admin/streamer-requests/:id/moderate', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    const updated = await db.moderateStreamerRequest(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    db.logAudit({
      adminId: req.adminUser!.id,
      adminEmail: req.adminUser!.email,
      action: status === 'APPROVED' ? 'APPROVE_STREAMER_REQUEST' : 'REJECT_STREAMER_REQUEST',
      entityType: 'STREAMER_REQUEST',
      entityId: id,
      metadata: { username: updated.username, status },
    }).catch(() => {});

    res.json({ success: true, message: `Application ${status.toLowerCase()} successfully!`, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed moderating application: ' + err.message });
  }
});

export default router;
