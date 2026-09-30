import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { Creator, PlatformAccount, LiveStream, AdminUser, SiteSettings, AuditLog, CommunityClip, StreamerRequest } from '../../src/types/index.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const { Pool } = pg;

interface DatabaseSchema {
  creators: Creator[];
  platformAccounts: PlatformAccount[];
  liveStreams: LiveStream[];
  adminUsers: (AdminUser & { passwordHash: string })[];
  settings: Record<string, string>;
  clips: CommunityClip[];
  streamerRequests: StreamerRequest[];
  analyticsEvents: Array<{
    id: string;
    eventType: string;
    creatorId?: string;
    metadata?: any;
    createdAt: string;
  }>;
  auditLogs: AuditLog[];
}

const DATA_DIR = process.env.VERCEL
  ? path.resolve('/tmp', 'data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pioneer_live.json');

// Initial 4 Seed Creators specified by Pioneer RP
const INITIAL_CREATORS_SEED = [
  {
    username: 'TJ_SINGH007',
    displayName: 'TJ SINGH',
    platform: 'TWITCH' as const,
    featured: true,
    featuredOrder: 1,
    creatorCode: 'INDIA',
    creatorCodeDescription: 'Use code INDIA for exclusive server rewards and discount at the store',
    creatorStoreUrl: 'https://pioneer-rp-18.tebex.io/',
    isPioneerStreamer: true,
    characterName: 'Tejinder "TJ" Singh',
    gangName: 'Purple Nine',
    bio: 'Lead officer and underworld kingpin in the streets of Pioneer RP. High-stakes chases and intense roleplay storylines.',
  },
  {
    username: 'apocalypticsith',
    displayName: 'ApocalypticSith',
    platform: 'TWITCH' as const,
    featured: false,
    featuredOrder: 2,
    isPioneerStreamer: true,
    characterName: 'Darth Silas',
    gangName: 'Syndicate',
    bio: 'Pioneer RP veteran roleplayer. Exploring tactical ops, business empires, and dramatic storylines.',
  },
  {
    username: 'ithebunny',
    displayName: 'ithebunny',
    platform: 'TWITCH' as const,
    featured: false,
    featuredOrder: 3,
    isPioneerStreamer: true,
    characterName: 'Bunny Foster',
    gangName: 'Civilian & EMS',
    bio: 'Medical dispatcher, civilian storylines, and EMS director in Pioneer RP.',
  },
  {
    username: 'moxiemoses',
    displayName: 'Moxie Moses',
    platform: 'TWITCH' as const,
    featured: false,
    featuredOrder: 4,
    isPioneerStreamer: true,
    characterName: 'Moxie Moses',
    gangName: 'Independent Crew',
    bio: 'High-speed getaways, street racing, and criminal enterprise storylines across Los Santos.',
  },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: 'Pioneer RP Live',
  siteTagline: 'The city is live. Watch the stories unfold.',
  discordUrl: process.env.PIONEER_DISCORD_URL || 'https://discord.gg/pioneerrp',
  storeUrl: process.env.PIONEER_STORE_URL || 'https://pioneer-rp-18.tebex.io/',
  serverJoinUrl: process.env.PIONEER_JOIN_URL || 'fivem://connect/cfx.re/join/pioneer-rp',
  serverStatusApiUrl: process.env.SERVER_STATUS_API_URL || '',
  twitchPollingIntervalSeconds: '45',
  liveRefreshIntervalSeconds: '30',
  seoTitle: 'Pioneer RP Live — Watch Pioneer RP Streamers',
  seoDescription: 'The official streaming and creator hub for Pioneer RP. Real-time Twitch stream monitoring, featured creators, creator codes, and FiveM community directory.',
  heroHeadline: 'PIONEER RP LIVE',
  heroSubheading: 'The city is live. Watch the stories unfold.',
  twitchClientId: process.env.TWITCH_CLIENT_ID || 'gp762nuuoqcoxypju8c569th9wz7q5',
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET || '',
  lastSyncAt: '',
  syncStatus: 'idle',
  syncErrorMessage: '',
};

class DatabaseManager {
  private memoryDb: DatabaseSchema = {
    creators: [],
    platformAccounts: [],
    liveStreams: [],
    adminUsers: [],
    settings: { ...DEFAULT_SETTINGS },
    clips: [],
    streamerRequests: [],
    analyticsEvents: [],
    auditLogs: [],
  };

  private pgPool: pg.Pool | null = null;
  private isPostgres = false;
  private saveTimeout: NodeJS.Timeout | null = null;
  private syncedLogIds = new Set<string>();

  get storageMode(): 'postgres' | 'embedded' {
    return this.isPostgres ? 'postgres' : 'embedded';
  }

  // When a database is configured (or we run serverless) but it is not connected,
  // writing to the ephemeral embedded file would silently lose data. Refuse instead.
  private assertPersistentWritable(): void {
    const dbConfigured = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL);
    if (!this.isPostgres && (dbConfigured || process.env.VERCEL)) {
      throw new Error(
        'Administrator storage is unavailable: the configured database is not connected, so the change would not be saved. Verify DATABASE_URL on the deployment.'
      );
    }
  }

  async init(): Promise<void> {
    const pgConnString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (pgConnString) {
      const attempts = 3;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          const pool = new Pool({
            connectionString: pgConnString,
            ssl: pgConnString.includes('localhost') ? false : { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
            max: 5,
          });
          const client = await pool.connect();
          client.release();
          this.pgPool = pool;
          this.isPostgres = true;
          console.log('[DB] Connected to PostgreSQL / Vercel Postgres instance.');
          await this.initPostgresSchema();
          await this.loadFromPostgres();
          break;
        } catch (err: any) {
          console.warn(`[DB] PostgreSQL connection attempt ${attempt}/${attempts} failed:`, err.message);
          this.isPostgres = false;
          this.pgPool = null;
          if (attempt < attempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }
      }
      if (!this.isPostgres) {
        console.error('[DB] A database is configured but unreachable; persistent writes cannot be saved.');
      }
    }

    if (!this.isPostgres) {
      this.initFileDb();
    }

    await this.seedInitialData();
  }

  private initFileDb() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const SEED_FILE = path.resolve(process.cwd(), 'data', 'pioneer_live.json');

    // If target DB_FILE does not exist (e.g. fresh Vercel serverless /tmp), seed from bundled data
    if (!fs.existsSync(DB_FILE) && fs.existsSync(SEED_FILE)) {
      try {
        fs.copyFileSync(SEED_FILE, DB_FILE);
        console.log('[DB] Seeded fresh instance from bundled pioneer_live.json');
      } catch (err) {
        console.warn('[DB] Could not copy seed file:', err);
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryDb = {
          ...this.memoryDb,
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
        // Backfill lastLiveAt if not present
        const sampleHoursAgo = [2.5, 6, 19, 41];
        this.memoryDb.creators.forEach((c, i) => {
          if (!c.lastLiveAt) {
            c.lastLiveAt = new Date(Date.now() - (sampleHoursAgo[i % sampleHoursAgo.length] * 3600 * 1000)).toISOString();
          }
        });
        console.log(`[DB] Loaded embedded database with ${this.memoryDb.creators.length} creators.`);
      } catch (err) {
        console.error('[DB] Failed reading DB file, creating fresh store:', err);
        this.saveToFileImmediate();
      }
    } else {
      this.saveToFileImmediate();
    }
  }

  private saveToFileImmediate() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed saving database to file:', err);
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToFileImmediate();
      if (this.isPostgres) {
        this.syncToPostgres().catch(err => console.error('[DB] Failed syncing to PostgreSQL:', err.message));
      }
    }, 100);
  }

  private async initPostgresSchema() {
    if (!this.pgPool) return;
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS creators (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(128) UNIQUE NOT NULL,
        display_name VARCHAR(128) NOT NULL,
        character_name VARCHAR(128),
        gang_name VARCHAR(128),
        bio TEXT,
        profile_image_url TEXT,
        banner_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        featured_order INT DEFAULT 999,
        creator_code VARCHAR(64),
        creator_code_description TEXT,
        creator_store_url TEXT,
        verified BOOLEAN DEFAULT TRUE,
        enabled BOOLEAN DEFAULT TRUE,
        is_pioneer_streamer BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS platform_accounts (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) REFERENCES creators(id) ON DELETE CASCADE,
        platform VARCHAR(32) NOT NULL,
        platform_user_id VARCHAR(128) NOT NULL,
        username VARCHAR(128) NOT NULL,
        display_name VARCHAR(128) NOT NULL,
        channel_url TEXT NOT NULL,
        profile_image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_platform_user UNIQUE (platform, platform_user_id)
      );

      CREATE TABLE IF NOT EXISTS live_streams (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) REFERENCES creators(id) ON DELETE CASCADE,
        platform_account_id VARCHAR(64) REFERENCES platform_accounts(id) ON DELETE CASCADE,
        platform VARCHAR(32) NOT NULL,
        platform_stream_id VARCHAR(128) NOT NULL,
        title TEXT NOT NULL,
        category VARCHAR(128) NOT NULL,
        viewer_count INT DEFAULT 0,
        thumbnail_url TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        ended_at TIMESTAMPTZ,
        is_live BOOLEAN DEFAULT FALSE,
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(128) UNIQUE NOT NULL,
        username VARCHAR(128) NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(32) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(128) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        creator_id VARCHAR(64),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        admin_id VARCHAR(64) NOT NULL,
        admin_email VARCHAR(128) NOT NULL,
        action VARCHAR(128) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clips (
        id VARCHAR(64) PRIMARY KEY,
        title TEXT NOT NULL,
        clip_url TEXT NOT NULL,
        embed_url TEXT NOT NULL,
        creator_id VARCHAR(64),
        creator_name VARCHAR(128),
        category VARCHAR(64),
        thumbnail_url TEXT,
        submitter_name VARCHAR(128),
        upvotes INT DEFAULT 1,
        approved BOOLEAN DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS streamer_requests (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(128) NOT NULL,
        character_name VARCHAR(128) NOT NULL,
        faction VARCHAR(64) NOT NULL,
        bio TEXT NOT NULL,
        creator_code VARCHAR(64),
        status VARCHAR(32) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  private async loadFromPostgres() {
    if (!this.pgPool) return;
    try {
      const settingsRes = await this.pgPool.query('SELECT key, value FROM settings');
      const pgSettings: Record<string, string> = { ...DEFAULT_SETTINGS };
      for (const row of settingsRes.rows) {
        pgSettings[row.key] = row.value;
      }
      this.memoryDb.settings = pgSettings;

      const creatorsRes = await this.pgPool.query('SELECT * FROM creators');
      const accountsRes = await this.pgPool.query('SELECT * FROM platform_accounts');
      const clipsRes = await this.pgPool.query('SELECT * FROM clips').catch(() => ({ rows: [] }));
      const reqsRes = await this.pgPool.query('SELECT * FROM streamer_requests').catch(() => ({ rows: [] }));
      const adminsRes = await this.pgPool.query('SELECT * FROM admin_users').catch(() => ({ rows: [] }));
      const auditRes = await this.pgPool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500').catch(() => ({ rows: [] }));

      if (creatorsRes.rows.length > 0) {
        this.memoryDb.creators = creatorsRes.rows.map((r: any) => ({
          id: r.id,
          slug: r.slug,
          displayName: r.display_name,
          characterName: r.character_name,
          gangName: r.gang_name,
          bio: r.bio,
          profileImageUrl: r.profile_image_url,
          bannerUrl: r.banner_url,
          featured: r.featured,
          featuredOrder: r.featured_order,
          creatorCode: r.creator_code,
          creatorCodeDescription: r.creator_code_description,
          creatorStoreUrl: r.creator_store_url,
          verified: r.verified,
          enabled: r.enabled,
          isPioneerStreamer: r.is_pioneer_streamer,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }

      if (accountsRes.rows.length > 0) {
        this.memoryDb.platformAccounts = accountsRes.rows.map((r: any) => ({
          id: r.id,
          creatorId: r.creator_id,
          platform: r.platform,
          platformUserId: r.platform_user_id,
          username: r.username,
          displayName: r.display_name,
          channelUrl: r.channel_url,
          profileImageUrl: r.profile_image_url,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }

      if (adminsRes.rows.length > 0) {
        this.memoryDb.adminUsers = adminsRes.rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          username: r.username,
          passwordHash: r.password_hash,
          role: r.role,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }

      if (clipsRes.rows.length > 0) {
        this.memoryDb.clips = clipsRes.rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          clipUrl: r.clip_url,
          embedUrl: r.embed_url,
          creatorId: r.creator_id,
          creatorName: r.creator_name,
          category: r.category,
          thumbnailUrl: r.thumbnail_url,
          submitterName: r.submitter_name,
          upvotes: r.upvotes,
          approved: r.approved,
          featured: r.featured,
          createdAt: r.created_at,
        }));
      }

      if (reqsRes.rows.length > 0) {
        this.memoryDb.streamerRequests = reqsRes.rows.map((r: any) => ({
          id: r.id,
          username: r.username,
          characterName: r.character_name,
          faction: r.faction,
          bio: r.bio,
          creatorCode: r.creator_code,
          status: r.status,
          createdAt: r.created_at,
        }));
      }

      if (auditRes.rows.length > 0) {
        this.memoryDb.auditLogs = auditRes.rows.map((r: any) => ({
          id: r.id,
          adminId: r.admin_id,
          adminEmail: r.admin_email,
          action: r.action,
          entityType: r.entity_type,
          entityId: r.entity_id,
          metadata: r.metadata,
          createdAt: r.created_at,
        }));
      }

      this.syncedLogIds = new Set((this.memoryDb.auditLogs || []).map(l => l.id));

      console.log(`[DB] Loaded ${this.memoryDb.creators.length} creators and settings from Supabase/PostgreSQL.`);
    } catch (err) {
      console.error('[DB] Failed loading from Postgres:', err);
    }
  }

  // Mirrors the in-memory dataset into PostgreSQL inside a single transaction.
  // This is the durable source of truth on serverless (Vercel), where the file DB is ephemeral.
  private async syncToPostgres(): Promise<void> {
    if (!this.pgPool || !this.isPostgres) return;
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      for (const [k, v] of Object.entries(this.memoryDb.settings || {})) {
        await client.query(
          `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [k, typeof v === 'string' ? v : JSON.stringify(v)]
        );
      }

      for (const a of this.memoryDb.adminUsers || []) {
        if (!a.passwordHash) continue;
        await client.query(
          `INSERT INTO admin_users (id, email, username, password_hash, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, username = EXCLUDED.username,
             password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = NOW()`,
          [a.id, a.email, a.username, a.passwordHash, a.role, a.createdAt || null]
        );
      }

      for (const c of this.memoryDb.creators || []) {
        await client.query(
          `INSERT INTO creators (id, slug, display_name, character_name, gang_name, bio, profile_image_url,
             banner_url, featured, featured_order, creator_code, creator_code_description, creator_store_url,
             verified, enabled, is_pioneer_streamer, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
             COALESCE($17::timestamptz, NOW()), COALESCE($18::timestamptz, NOW()))
           ON CONFLICT (id) DO UPDATE SET
             slug = EXCLUDED.slug, display_name = EXCLUDED.display_name, character_name = EXCLUDED.character_name,
             gang_name = EXCLUDED.gang_name, bio = EXCLUDED.bio, profile_image_url = EXCLUDED.profile_image_url,
             banner_url = EXCLUDED.banner_url, featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
             creator_code = EXCLUDED.creator_code, creator_code_description = EXCLUDED.creator_code_description,
             creator_store_url = EXCLUDED.creator_store_url, verified = EXCLUDED.verified, enabled = EXCLUDED.enabled,
             is_pioneer_streamer = EXCLUDED.is_pioneer_streamer, updated_at = NOW()`,
          [
            c.id, c.slug, c.displayName || c.slug, c.characterName ?? null, c.gangName ?? null, c.bio ?? null,
            c.profileImageUrl ?? null, c.bannerUrl ?? null, !!c.featured, c.featuredOrder ?? 999,
            c.creatorCode ?? null, c.creatorCodeDescription ?? null, c.creatorStoreUrl ?? null,
            c.verified !== false, c.enabled !== false, c.isPioneerStreamer !== false,
            c.createdAt || null, c.updatedAt || null,
          ]
        );
      }

      for (const pa of this.memoryDb.platformAccounts || []) {
        if (!this.memoryDb.creators.some(c => c.id === pa.creatorId)) continue;
        await client.query(
          `INSERT INTO platform_accounts (id, creator_id, platform, platform_user_id, username, display_name,
             channel_url, profile_image_url, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE($9::timestamptz, NOW()), COALESCE($10::timestamptz, NOW()))
           ON CONFLICT (id) DO UPDATE SET
             creator_id = EXCLUDED.creator_id, platform = EXCLUDED.platform, platform_user_id = EXCLUDED.platform_user_id,
             username = EXCLUDED.username, display_name = EXCLUDED.display_name, channel_url = EXCLUDED.channel_url,
             profile_image_url = EXCLUDED.profile_image_url, updated_at = NOW()`,
          [pa.id, pa.creatorId, pa.platform, pa.platformUserId, pa.username, pa.displayName,
           pa.channelUrl, pa.profileImageUrl ?? null, pa.createdAt || null, pa.updatedAt || null]
        );
      }

      for (const ls of this.memoryDb.liveStreams || []) {
        if (!this.memoryDb.creators.some(c => c.id === ls.creatorId)) continue;
        if (!this.memoryDb.platformAccounts.some(p => p.id === ls.platformAccountId)) continue;
        await client.query(
          `INSERT INTO live_streams (id, creator_id, platform_account_id, platform, platform_stream_id, title,
             category, viewer_count, thumbnail_url, started_at, ended_at, is_live, last_seen_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10::timestamptz, NOW()), $11::timestamptz, $12,
             COALESCE($13::timestamptz, NOW()), COALESCE($14::timestamptz, NOW()), COALESCE($15::timestamptz, NOW()))
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, category = EXCLUDED.category, viewer_count = EXCLUDED.viewer_count,
             thumbnail_url = EXCLUDED.thumbnail_url, is_live = EXCLUDED.is_live, ended_at = EXCLUDED.ended_at,
             last_seen_at = EXCLUDED.last_seen_at, updated_at = NOW()`,
          [ls.id, ls.creatorId, ls.platformAccountId, ls.platform, ls.platformStreamId, ls.title, ls.category,
           ls.viewerCount ?? 0, ls.thumbnailUrl ?? '', ls.startedAt || null, ls.endedAt ?? null, !!ls.isLive,
           ls.lastSeenAt || null, ls.createdAt || null, ls.updatedAt || null]
        );
      }

      for (const cl of this.memoryDb.clips || []) {
        await client.query(
          `INSERT INTO clips (id, title, clip_url, embed_url, creator_id, creator_name, category, thumbnail_url,
             submitter_name, upvotes, approved, featured, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, COALESCE($13::timestamptz, NOW()))
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, clip_url = EXCLUDED.clip_url, embed_url = EXCLUDED.embed_url,
             creator_name = EXCLUDED.creator_name, category = EXCLUDED.category, thumbnail_url = EXCLUDED.thumbnail_url,
             submitter_name = EXCLUDED.submitter_name, upvotes = EXCLUDED.upvotes, approved = EXCLUDED.approved,
             featured = EXCLUDED.featured`,
          [cl.id, cl.title, cl.clipUrl, cl.embedUrl, (cl as any).creatorId ?? null, cl.creatorName ?? null,
           cl.category ?? null, (cl as any).thumbnailUrl ?? null, cl.submitterName ?? null, cl.upvotes ?? 0,
           cl.approved !== false, !!cl.featured, cl.createdAt || null]
        );
      }

      for (const r of this.memoryDb.streamerRequests || []) {
        await client.query(
          `INSERT INTO streamer_requests (id, username, character_name, faction, bio, creator_code, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::timestamptz, NOW()))
           ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, character_name = EXCLUDED.character_name,
             faction = EXCLUDED.faction, bio = EXCLUDED.bio, creator_code = EXCLUDED.creator_code`,
          [r.id, r.username, r.characterName, r.faction, r.bio, r.creatorCode ?? null, r.status, r.createdAt || null]
        );
      }

      for (const ev of this.memoryDb.analyticsEvents || []) {
        if (this.syncedLogIds.has(ev.id)) continue;
        await client.query(
          `INSERT INTO analytics_events (id, event_type, creator_id, metadata, created_at)
           VALUES ($1,$2,$3,$4::jsonb, COALESCE($5::timestamptz, NOW())) ON CONFLICT (id) DO NOTHING`,
          [ev.id, ev.eventType, ev.creatorId ?? null, JSON.stringify(ev.metadata ?? {}), ev.createdAt || null]
        );
        this.syncedLogIds.add(ev.id);
      }

      for (const log of this.memoryDb.auditLogs || []) {
        if (this.syncedLogIds.has(log.id)) continue;
        await client.query(
          `INSERT INTO audit_logs (id, admin_id, admin_email, action, entity_type, entity_id, metadata, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb, COALESCE($8::timestamptz, NOW())) ON CONFLICT (id) DO NOTHING`,
          [log.id, log.adminId, log.adminEmail, log.action, log.entityType, log.entityId,
           JSON.stringify(log.metadata ?? {}), log.createdAt || null]
        );
        this.syncedLogIds.add(log.id);
      }

      await client.query('COMMIT');
    } catch (err: any) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    } finally {
      client.release();
    }
  }

  private async deleteCreatorFromPostgres(id: string): Promise<void> {
    if (!this.pgPool) return;
    await this.pgPool.query('DELETE FROM creators WHERE id = $1', [id]);
  }

  private async deleteClipFromPostgres(id: string): Promise<void> {
    if (!this.pgPool) return;
    await this.pgPool.query('DELETE FROM clips WHERE id = $1', [id]);
  }

  private async refreshAdminsFromPostgres(): Promise<void> {
    if (!this.pgPool) return;
    try {
      const adminsRes = await this.pgPool.query('SELECT * FROM admin_users');
      if (adminsRes.rows.length > 0) {
        this.memoryDb.adminUsers = adminsRes.rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          username: r.username,
          passwordHash: r.password_hash,
          role: r.role,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (err: any) {
      console.error('[DB] Failed refreshing administrators from Postgres:', err.message);
    }
  }

  private async persistAdminToPostgres(admin: AdminUser & { passwordHash: string }): Promise<void> {
    if (!this.pgPool) return;
    const updated = await this.pgPool.query(
      `UPDATE admin_users SET email = $2, username = $3, password_hash = $4, role = $5, updated_at = NOW() WHERE id = $1`,
      [admin.id, admin.email, admin.username, admin.passwordHash, admin.role]
    );
    if (updated.rowCount === 0) {
      await this.pgPool.query(
        `INSERT INTO admin_users (id, email, username, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = NOW()`,
        [admin.id, admin.email, admin.username, admin.passwordHash, admin.role]
      );
    }
  }

  private async deleteAdminFromPostgres(id: string): Promise<void> {
    if (!this.pgPool) return;
    await this.pgPool.query('DELETE FROM admin_users WHERE id = $1', [id]);
  }

  private async seedInitialData() {
    // 1. Ensure primary superadmin with email "Trnjeet@gmail.com" / "TJSINGH" and password "Taran@&007"
    const hasAdmin = this.memoryDb.adminUsers.some(
      a => a.email.toLowerCase() === 'trnjeet@gmail.com' || a.username.toLowerCase() === 'tjsingh'
    );

    // Remove obsolete old placeholder accounts
    this.memoryDb.adminUsers = this.memoryDb.adminUsers.filter(
      a => a.email.toLowerCase() !== 'admin@pioneerrp.live' && a.username.toLowerCase() !== 'pioneeradmin'
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Taran@&007', salt);

    if (!hasAdmin) {
      const tjAdmin: AdminUser & { passwordHash: string } = {
        id: 'admin_tjsingh_01',
        email: 'Trnjeet@gmail.com',
        username: 'TJSINGH',
        role: 'superadmin',
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.memoryDb.adminUsers.unshift(tjAdmin);
      this.scheduleSave();
      console.log('[DB] Superadmin account initialized: TJSINGH (Trnjeet@gmail.com)');
    } else {
      const tjAdmin = this.memoryDb.adminUsers.find(
        a => a.email.toLowerCase() === 'trnjeet@gmail.com' || a.username.toLowerCase() === 'tjsingh' || a.email.toLowerCase() === 'tjsingh@pioneerrp.live'
      );
      if (tjAdmin) {
        tjAdmin.email = 'Trnjeet@gmail.com';
        tjAdmin.username = 'TJSINGH';
        tjAdmin.passwordHash = passwordHash;
        tjAdmin.role = 'superadmin';
        this.scheduleSave();
        console.log('[DB] Superadmin updated to Trnjeet@gmail.com / TJSINGH');
      }
    }

    // Persist the seeded superadmin so a fresh Postgres instance can authenticate
    const seededSuperadmin = this.memoryDb.adminUsers.find(
      a => a.email.toLowerCase() === 'trnjeet@gmail.com' || a.username.toLowerCase() === 'tjsingh'
    );
    if (seededSuperadmin && this.isPostgres) {
      await this.persistAdminToPostgres(seededSuperadmin);
    }

    // 2. Seed initial creators if table is empty
    if (this.memoryDb.creators.length === 0) {
      console.log('[DB] Seeding initial Pioneer RP creators...');
      for (const item of INITIAL_CREATORS_SEED) {
        const creatorId = `creator_${item.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const slug = item.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const now = new Date().toISOString();

        const creator: Creator = {
          id: creatorId,
          slug,
          displayName: item.displayName,
          characterName: item.characterName,
          gangName: item.gangName,
          bio: item.bio,
          profileImageUrl: `https://avatar.vercel.sh/${item.username}.png`,
          bannerUrl: undefined,
          featured: item.featured,
          featuredOrder: item.featuredOrder,
          creatorCode: item.creatorCode,
          creatorCodeDescription: item.creatorCodeDescription,
          creatorStoreUrl: item.creatorStoreUrl,
          verified: true,
          enabled: true,
          isPioneerStreamer: item.isPioneerStreamer,
          createdAt: now,
          updatedAt: now,
        };

        const platformAccountId = `plat_twitch_${item.username.toLowerCase()}`;
        const platformAccount: PlatformAccount = {
          id: platformAccountId,
          creatorId,
          platform: 'TWITCH',
          platformUserId: `twitch_seed_${item.username.toLowerCase()}`,
          username: item.username,
          displayName: item.displayName,
          channelUrl: `https://twitch.tv/${item.username}`,
          profileImageUrl: creator.profileImageUrl,
          createdAt: now,
          updatedAt: now,
        };

        this.memoryDb.creators.push(creator);
        this.memoryDb.platformAccounts.push(platformAccount);
      }
      this.scheduleSave();
    }

    // 3. Seed initial community clips if empty
    this.memoryDb.clips = this.memoryDb.clips || [];
    if (this.memoryDb.clips.length === 0) {
      this.memoryDb.clips = [
        {
          id: 'clip_01',
          title: 'TJ SINGH Insane 100mph Police Pit Maneuver in Downtown',
          clipUrl: 'https://clips.twitch.tv/CautiousFuriousGuanacoLitFam',
          embedUrl: 'https://clips.twitch.tv/embed?clip=CautiousFuriousGuanacoLitFam',
          creatorId: 'creator_tjsingh007',
          creatorName: 'TJ SINGH',
          characterName: 'Tejinder "TJ" Singh',
          category: 'CHASE',
          submitterName: 'CityEditor99',
          upvotes: 42,
          approved: true,
          featured: true,
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        },
        {
          id: 'clip_02',
          title: 'Syndicate Warehouse Ambush Shootout at Docks',
          clipUrl: 'https://clips.twitch.tv/DignifiedPoliteSnailCoolStoryBro',
          embedUrl: 'https://clips.twitch.tv/embed?clip=DignifiedPoliteSnailCoolStoryBro',
          creatorId: 'creator_apocalypticsith',
          creatorName: 'ApocalypticSith',
          characterName: 'Darth Silas',
          category: 'GUNFIGHT',
          submitterName: 'SyndicateFan',
          upvotes: 38,
          approved: true,
          featured: true,
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        },
        {
          id: 'clip_03',
          title: 'Pillbox EMS Helicopter Rooftop Extraction in the Fog',
          clipUrl: 'https://clips.twitch.tv/ResourcefulBoredOpossumHeyGuys',
          embedUrl: 'https://clips.twitch.tv/embed?clip=ResourcefulBoredOpossumHeyGuys',
          creatorId: 'creator_ithebunny',
          creatorName: 'ithebunny',
          characterName: 'Bunny Foster',
          category: 'DRAMA',
          submitterName: 'MedicLover',
          upvotes: 29,
          approved: true,
          featured: false,
          createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        },
      ];
      this.scheduleSave();
    }
  }

  // --- CREATOR METHODS ---
  async getCreators(options?: {
    enabledOnly?: boolean;
    featuredOnly?: boolean;
    isLiveOnly?: boolean;
    platform?: string;
    search?: string;
  }): Promise<Creator[]> {
    let result = [...this.memoryDb.creators];

    if (options?.enabledOnly !== false) {
      result = result.filter(c => c.enabled);
    }

    if (options?.featuredOnly) {
      result = result.filter(c => c.featured);
    }

    // Enrich with platform account and live stream
    result = result.map(creator => {
      const platformAccount = this.memoryDb.platformAccounts.find(pa => pa.creatorId === creator.id);
      const currentStream = this.memoryDb.liveStreams.find(ls => ls.creatorId === creator.id && ls.isLive);
      return {
        ...creator,
        platformAccount,
        currentStream: currentStream || null,
      };
    });

    if (options?.isLiveOnly) {
      result = result.filter(c => !!c.currentStream?.isLive);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(c => {
        return (
          c.displayName.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.platformAccount?.username && c.platformAccount.username.toLowerCase().includes(q)) ||
          (c.characterName && c.characterName.toLowerCase().includes(q)) ||
          (c.gangName && c.gangName.toLowerCase().includes(q)) ||
          (c.creatorCode && c.creatorCode.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }

  async getCreatorBySlug(slug: string): Promise<Creator | null> {
    const creator = this.memoryDb.creators.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    if (!creator) return null;
    const platformAccount = this.memoryDb.platformAccounts.find(pa => pa.creatorId === creator.id);
    const currentStream = this.memoryDb.liveStreams.find(ls => ls.creatorId === creator.id && ls.isLive);
    return {
      ...creator,
      platformAccount,
      currentStream: currentStream || null,
    };
  }

  async getCreatorById(id: string): Promise<Creator | null> {
    const creator = this.memoryDb.creators.find(c => c.id === id);
    if (!creator) return null;
    const platformAccount = this.memoryDb.platformAccounts.find(pa => pa.creatorId === creator.id);
    const currentStream = this.memoryDb.liveStreams.find(ls => ls.creatorId === creator.id && ls.isLive);
    return {
      ...creator,
      platformAccount,
      currentStream: currentStream || null,
    };
  }

  async createCreator(data: {
    displayName: string;
    username: string;
    platform: 'TWITCH' | 'KICK';
    platformUserId: string;
    channelUrl: string;
    profileImageUrl?: string;
    characterName?: string;
    gangName?: string;
    faction?: any;
    bio?: string;
    featured?: boolean;
    featuredOrder?: number;
    creatorCode?: string;
    creatorCodeDescription?: string;
    creatorStoreUrl?: string;
    verified?: boolean;
    enabled?: boolean;
  }): Promise<Creator> {
    // Check if platform account already exists
    const existingAcct = this.memoryDb.platformAccounts.find(
      pa => pa.platform === data.platform && pa.username.toLowerCase() === data.username.toLowerCase()
    );
    if (existingAcct) {
      throw new Error(`Creator with ${data.platform} account "${data.username}" already exists.`);
    }

    const creatorId = `creator_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let baseSlug = (data.username || data.displayName).toLowerCase().replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let counter = 1;
    while (this.memoryDb.creators.some(c => c.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const now = new Date().toISOString();
    const creator: Creator = {
      id: creatorId,
      slug,
      displayName: data.displayName || data.username,
      characterName: data.characterName,
      gangName: data.gangName,
      bio: data.bio,
      profileImageUrl: data.profileImageUrl,
      featured: !!data.featured,
      featuredOrder: data.featuredOrder ?? 999,
      creatorCode: data.creatorCode,
      creatorCodeDescription: data.creatorCodeDescription,
      creatorStoreUrl: data.creatorStoreUrl,
      verified: data.verified !== false,
      enabled: data.enabled !== false,
      isPioneerStreamer: true,
      createdAt: now,
      updatedAt: now,
    };

    const platformAccount: PlatformAccount = {
      id: `plat_${data.platform.toLowerCase()}_${Date.now()}`,
      creatorId,
      platform: data.platform,
      platformUserId: data.platformUserId,
      username: data.username,
      displayName: data.displayName || data.username,
      channelUrl: data.channelUrl,
      profileImageUrl: data.profileImageUrl,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDb.creators.push(creator);
    this.memoryDb.platformAccounts.push(platformAccount);
    this.scheduleSave();

    return {
      ...creator,
      platformAccount,
      currentStream: null,
    };
  }

  async updateCreator(
    id: string,
    updates: Partial<Creator> & {
      username?: string;
      platformUserId?: string;
      channelUrl?: string;
    }
  ): Promise<Creator | null> {
    const creatorIndex = this.memoryDb.creators.findIndex(c => c.id === id);
    if (creatorIndex === -1) return null;

    const existing = this.memoryDb.creators[creatorIndex];
    const now = new Date().toISOString();

    const updatedCreator: Creator = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    this.memoryDb.creators[creatorIndex] = updatedCreator;

    // Update platform account if relevant
    const paIndex = this.memoryDb.platformAccounts.findIndex(pa => pa.creatorId === id);
    if (paIndex !== -1) {
      const pa = this.memoryDb.platformAccounts[paIndex];
      this.memoryDb.platformAccounts[paIndex] = {
        ...pa,
        username: updates.username || pa.username,
        channelUrl: updates.channelUrl || pa.channelUrl,
        platformUserId: updates.platformUserId || pa.platformUserId,
        profileImageUrl: updates.profileImageUrl || pa.profileImageUrl,
        updatedAt: now,
      };
    }

    this.scheduleSave();
    return this.getCreatorById(id);
  }

  async deleteCreator(id: string): Promise<boolean> {
    const initialLen = this.memoryDb.creators.length;
    this.memoryDb.creators = this.memoryDb.creators.filter(c => c.id !== id);
    this.memoryDb.platformAccounts = this.memoryDb.platformAccounts.filter(pa => pa.creatorId !== id);
    this.memoryDb.liveStreams = this.memoryDb.liveStreams.filter(ls => ls.creatorId !== id);
    this.scheduleSave();
    if (this.isPostgres) {
      await this.deleteCreatorFromPostgres(id);
    }
    return this.memoryDb.creators.length < initialLen;
  }

  // --- FEATURED MANAGEMENT ---
  async updateFeaturedOrder(orderList: Array<{ id: string; featuredOrder: number; featured: boolean }>): Promise<void> {
    for (const item of orderList) {
      const c = this.memoryDb.creators.find(x => x.id === item.id);
      if (c) {
        c.featuredOrder = item.featuredOrder;
        c.featured = item.featured;
        c.updatedAt = new Date().toISOString();
      }
    }
    this.scheduleSave();
  }

  // --- PLATFORM ACCOUNTS ---
  async getAllPlatformAccounts(platform: 'TWITCH' | 'KICK' = 'TWITCH'): Promise<Array<PlatformAccount & { creator: Creator }>> {
    return this.memoryDb.platformAccounts
      .filter(pa => pa.platform === platform)
      .map(pa => {
        const creator = this.memoryDb.creators.find(c => c.id === pa.creatorId)!;
        return {
          ...pa,
          creator,
        };
      })
      .filter(pa => !!pa.creator);
  }

  // --- LIVE STREAMS & SYNC ---
  async upsertLiveStream(streamData: {
    creatorId: string;
    platformAccountId: string;
    platform: 'TWITCH' | 'KICK';
    platformStreamId: string;
    title: string;
    category: string;
    viewerCount: number;
    thumbnailUrl: string;
    startedAt: string;
    isLive: boolean;
  }): Promise<LiveStream> {
    const now = new Date().toISOString();
    let stream = this.memoryDb.liveStreams.find(
      ls => ls.platformAccountId === streamData.platformAccountId && ls.isLive
    );

    if (stream) {
      stream.title = streamData.title;
      stream.category = streamData.category;
      stream.viewerCount = streamData.viewerCount;
      stream.thumbnailUrl = streamData.thumbnailUrl;
      stream.isLive = streamData.isLive;
      stream.lastSeenAt = now;
      stream.updatedAt = now;
    } else {
      stream = {
        id: `stream_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        creatorId: streamData.creatorId,
        platformAccountId: streamData.platformAccountId,
        platform: streamData.platform,
        platformStreamId: streamData.platformStreamId,
        title: streamData.title,
        category: streamData.category,
        viewerCount: streamData.viewerCount,
        thumbnailUrl: streamData.thumbnailUrl,
        startedAt: streamData.startedAt,
        isLive: streamData.isLive,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryDb.liveStreams.push(stream);
    }

    if (streamData.isLive) {
      const creator = this.memoryDb.creators.find(c => c.id === streamData.creatorId);
      if (creator) {
        creator.lastLiveAt = now;
      }
    }

    this.scheduleSave();
    return stream;
  }

  async markPlatformAccountOffline(platformAccountId: string): Promise<void> {
    const now = new Date().toISOString();
    const liveStreams = this.memoryDb.liveStreams.filter(
      ls => ls.platformAccountId === platformAccountId && ls.isLive
    );
    for (const ls of liveStreams) {
      ls.isLive = false;
      ls.endedAt = now;
      ls.lastSeenAt = now;
      ls.updatedAt = now;

      const creator = this.memoryDb.creators.find(c => c.id === ls.creatorId);
      if (creator) {
        creator.lastLiveAt = now;
      }
    }
    if (liveStreams.length > 0) {
      this.scheduleSave();
    }
  }

  async getRecentStreamHistory(creatorId: string, limit = 5): Promise<LiveStream[]> {
    return this.memoryDb.liveStreams
      .filter(ls => ls.creatorId === creatorId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  // --- SETTINGS ---
  getSettings(): SiteSettings {
    const s = this.memoryDb.settings;
    const clientId = s.twitchClientId || DEFAULT_SETTINGS.twitchClientId || '';
    const clientSecret = s.twitchClientSecret || DEFAULT_SETTINGS.twitchClientSecret || '';
    return {
      siteName: s.siteName || DEFAULT_SETTINGS.siteName,
      siteTagline: s.siteTagline || DEFAULT_SETTINGS.siteTagline,
      discordUrl: s.discordUrl || DEFAULT_SETTINGS.discordUrl,
      storeUrl: s.storeUrl || DEFAULT_SETTINGS.storeUrl,
      serverJoinUrl: s.serverJoinUrl || DEFAULT_SETTINGS.serverJoinUrl,
      serverStatusApiUrl: s.serverStatusApiUrl || '',
      twitchPollingIntervalSeconds: parseInt(s.twitchPollingIntervalSeconds || '45', 10),
      liveRefreshIntervalSeconds: parseInt(s.liveRefreshIntervalSeconds || '30', 10),
      seoTitle: s.seoTitle || DEFAULT_SETTINGS.seoTitle,
      seoDescription: s.seoDescription || DEFAULT_SETTINGS.seoDescription,
      heroHeadline: s.heroHeadline || DEFAULT_SETTINGS.heroHeadline,
      heroSubheading: s.heroSubheading || DEFAULT_SETTINGS.heroSubheading,
      twitchClientId: clientId,
      twitchClientSecret: clientSecret ? '••••••••••••••••' : '',
      twitchClientIdConfigured: !!(clientId && clientSecret),
      lastSyncAt: s.lastSyncAt || null,
      syncStatus: (s.syncStatus as any) || 'idle',
      syncErrorMessage: s.syncErrorMessage || null,
    };
  }

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        if (k === 'twitchClientSecret' && (v === '••••••••••••••••' || !v)) {
          continue;
        }
        if (k === 'twitchClientSecret') {
          this.memoryDb.settings[k] = encrypt(String(v));
        } else {
          this.memoryDb.settings[k] = String(v);
        }
      }
    }
    this.scheduleSave();
    return this.getSettings();
  }

  // --- ANALYTICS ---
  async trackAnalyticsEvent(eventType: string, creatorId?: string, metadata?: any): Promise<void> {
    this.memoryDb.analyticsEvents.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventType,
      creatorId,
      metadata,
      createdAt: new Date().toISOString(),
    });
    // Keep max 10000 events to prevent memory bloating
    if (this.memoryDb.analyticsEvents.length > 10000) {
      this.memoryDb.analyticsEvents = this.memoryDb.analyticsEvents.slice(-5000);
    }
    this.scheduleSave();
  }

  getAnalyticsSummary(): {
    totalCreators: number;
    liveCreators: number;
    featuredCreators: number;
    totalCurrentViewers: number;
    totalWatchClicks: number;
    totalProfileViews: number;
    totalCodeClicks: number;
    totalStoreClicks: number;
    topCreatorsByClicks: Array<{
      creatorId: string;
      displayName: string;
      username: string;
      watchClicks: number;
      codeClicks: number;
    }>;
  } {
    const creators = this.memoryDb.creators.filter(c => c.enabled);
    const liveStreams = this.memoryDb.liveStreams.filter(ls => ls.isLive);
    const totalViewers = liveStreams.reduce((acc, curr) => acc + (curr.viewerCount || 0), 0);

    const events = this.memoryDb.analyticsEvents;
    const watchClicks = events.filter(e => e.eventType === 'watch_click').length;
    const profileViews = events.filter(e => e.eventType === 'profile_view').length;
    const codeClicks = events.filter(e => e.eventType === 'creator_code_click').length;
    const storeClicks = events.filter(e => e.eventType === 'store_click').length;

    // Per creator stats
    const creatorStatsMap: Record<string, { watchClicks: number; codeClicks: number }> = {};
    for (const ev of events) {
      if (ev.creatorId) {
        if (!creatorStatsMap[ev.creatorId]) {
          creatorStatsMap[ev.creatorId] = { watchClicks: 0, codeClicks: 0 };
        }
        if (ev.eventType === 'watch_click') creatorStatsMap[ev.creatorId].watchClicks++;
        if (ev.eventType === 'creator_code_click') creatorStatsMap[ev.creatorId].codeClicks++;
      }
    }

    const topCreators = creators
      .map(c => {
        const pa = this.memoryDb.platformAccounts.find(p => p.creatorId === c.id);
        const stats = creatorStatsMap[c.id] || { watchClicks: 0, codeClicks: 0 };
        return {
          creatorId: c.id,
          displayName: c.displayName,
          username: pa?.username || c.slug,
          watchClicks: stats.watchClicks,
          codeClicks: stats.codeClicks,
        };
      })
      .sort((a, b) => b.watchClicks + b.codeClicks - (a.watchClicks + a.codeClicks))
      .slice(0, 10);

    return {
      totalCreators: creators.length,
      liveCreators: liveStreams.length,
      featuredCreators: creators.filter(c => c.featured).length,
      totalCurrentViewers: totalViewers,
      totalWatchClicks: watchClicks,
      totalProfileViews: profileViews,
      totalCodeClicks: codeClicks,
      totalStoreClicks: storeClicks,
      topCreatorsByClicks: topCreators,
    };
  }

  // --- AUDIT LOGS ---
  async logAudit(entry: {
    adminId: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
  }): Promise<void> {
    this.memoryDb.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      createdAt: new Date().toISOString(),
    });
    if (this.memoryDb.auditLogs.length > 500) {
      this.memoryDb.auditLogs = this.memoryDb.auditLogs.slice(0, 500);
    }
    this.scheduleSave();
  }

  getAuditLogs(limit = 50): AuditLog[] {
    return this.memoryDb.auditLogs.slice(0, limit);
  }

  // --- ADMIN AUTH ---
  async getAdminByEmail(email: string): Promise<(AdminUser & { passwordHash: string }) | null> {
    if (this.isPostgres) await this.refreshAdminsFromPostgres();
    return this.memoryDb.adminUsers.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getAdminByEmailOrUsername(identifier: string): Promise<(AdminUser & { passwordHash: string }) | null> {
    if (this.isPostgres) await this.refreshAdminsFromPostgres();
    const clean = identifier.trim().toLowerCase();
    return this.memoryDb.adminUsers.find(
      a => a.email.toLowerCase() === clean || a.username.toLowerCase() === clean
    ) || null;
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    if (this.isPostgres) await this.refreshAdminsFromPostgres();
    const a = this.memoryDb.adminUsers.find(u => u.id === id);
    if (!a) return null;
    const { passwordHash, ...rest } = a;
    return rest;
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    if (this.isPostgres) await this.refreshAdminsFromPostgres();
    return this.memoryDb.adminUsers.map(({ passwordHash, ...rest }) => rest);
  }

  async createAdmin(email: string, username: string, passwordPlain: string, role: string = 'admin'): Promise<AdminUser> {
    this.assertPersistentWritable();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const existingEmail = this.memoryDb.adminUsers.find(a => a.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      throw new Error('An admin with this email already exists.');
    }
    const existingUsername = this.memoryDb.adminUsers.find(a => a.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existingUsername) {
      throw new Error('An admin with this username already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);
    const resolvedRole = (role === 'superadmin' || role === 'moderator' ? role : 'admin') as 'superadmin' | 'admin' | 'moderator';
    const newAdmin: AdminUser & { passwordHash: string } = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      username: cleanUsername,
      role: resolvedRole,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryDb.adminUsers.push(newAdmin);
    this.scheduleSave();
    if (this.isPostgres) {
      await this.persistAdminToPostgres(newAdmin);
    }
    const { passwordHash: _, ...publicAdmin } = newAdmin;
    return publicAdmin;
  }

  async deleteAdmin(id: string): Promise<boolean> {
    this.assertPersistentWritable();
    const index = this.memoryDb.adminUsers.findIndex(a => a.id === id);
    if (index === -1) return false;
    if (this.memoryDb.adminUsers.length <= 1) {
      throw new Error('Cannot delete the last remaining administrator.');
    }
    this.memoryDb.adminUsers.splice(index, 1);
    this.scheduleSave();
    if (this.isPostgres) {
      await this.deleteAdminFromPostgres(id);
    }
    return true;
  }

  // --- COMMUNITY CLIPS METHODS ---
  async getClips(options?: { category?: string; creatorId?: string; approvedOnly?: boolean }): Promise<CommunityClip[]> {
    this.memoryDb.clips = this.memoryDb.clips || [];
    let list = [...this.memoryDb.clips];
    if (options?.approvedOnly !== false) {
      list = list.filter(c => c.approved);
    }
    if (options?.category && options.category !== 'ALL') {
      list = list.filter(c => c.category === options.category);
    }
    if (options?.creatorId) {
      list = list.filter(c => c.creatorId === options.creatorId);
    }
    return list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }

  async submitClip(data: {
    title: string;
    clipUrl: string;
    creatorName?: string;
    category?: 'CHASE' | 'HEIST' | 'COMEDY' | 'DRAMA' | 'GUNFIGHT';
    submitterName?: string;
  }): Promise<CommunityClip> {
    this.memoryDb.clips = this.memoryDb.clips || [];
    const clipId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Parse Twitch clip slug from URL
    let embedUrl = data.clipUrl;
    const match = data.clipUrl.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/) || data.clipUrl.match(/\/clip\/([A-Za-z0-9_-]+)/);
    if (match) {
      embedUrl = `https://clips.twitch.tv/embed?clip=${match[1]}&parent=${process.env.HOSTNAME || 'localhost'}`;
    }

    const newClip: CommunityClip = {
      id: clipId,
      title: data.title.trim(),
      clipUrl: data.clipUrl.trim(),
      embedUrl,
      creatorName: data.creatorName?.trim() || 'Pioneer Creator',
      category: data.category || 'CHASE',
      submitterName: data.submitterName?.trim() || 'Community Member',
      upvotes: 1,
      approved: true,
      featured: false,
      createdAt: new Date().toISOString(),
    };

    this.memoryDb.clips.unshift(newClip);
    this.scheduleSave();
    return newClip;
  }

  async upvoteClip(id: string): Promise<number | null> {
    this.memoryDb.clips = this.memoryDb.clips || [];
    const clip = this.memoryDb.clips.find(c => c.id === id);
    if (!clip) return null;
    clip.upvotes = (clip.upvotes || 0) + 1;
    this.scheduleSave();
    return clip.upvotes;
  }

  async deleteClip(id: string): Promise<boolean> {
    this.memoryDb.clips = this.memoryDb.clips || [];
    const idx = this.memoryDb.clips.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.memoryDb.clips.splice(idx, 1);
    this.scheduleSave();
    if (this.isPostgres) {
      await this.deleteClipFromPostgres(id);
    }
    return true;
  }

  async updateClip(id: string, updates: Partial<CommunityClip>): Promise<CommunityClip | null> {
    this.memoryDb.clips = this.memoryDb.clips || [];
    const clip = this.memoryDb.clips.find(c => c.id === id);
    if (!clip) return null;
    Object.assign(clip, updates);
    this.scheduleSave();
    return clip;
  }

  // --- STREAMER REQUESTS ---
  async getStreamerRequests(): Promise<StreamerRequest[]> {
    this.memoryDb.streamerRequests = this.memoryDb.streamerRequests || [];
    return [...this.memoryDb.streamerRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async submitStreamerRequest(data: {
    username: string;
    characterName: string;
    faction: string;
    bio: string;
    creatorCode?: string;
  }): Promise<StreamerRequest> {
    this.memoryDb.streamerRequests = this.memoryDb.streamerRequests || [];
    const reqId = `sreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReq: StreamerRequest = {
      id: reqId,
      username: data.username.trim().replace(/^@/, ''),
      characterName: data.characterName.trim(),
      faction: data.faction || 'CIVILIAN',
      bio: data.bio.trim(),
      creatorCode: data.creatorCode ? data.creatorCode.trim().toUpperCase() : undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.streamerRequests.unshift(newReq);
    this.scheduleSave();

    if (this.isPostgres && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO streamer_requests (id, username, character_name, faction, bio, creator_code, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
        [newReq.id, newReq.username, newReq.characterName, newReq.faction, newReq.bio, newReq.creatorCode || null, newReq.status, newReq.createdAt]
      ).catch(() => {});
    }

    return newReq;
  }

  async moderateStreamerRequest(id: string, status: 'APPROVED' | 'REJECTED'): Promise<StreamerRequest | null> {
    this.memoryDb.streamerRequests = this.memoryDb.streamerRequests || [];
    const req = this.memoryDb.streamerRequests.find(r => r.id === id);
    if (!req) return null;
    req.status = status;
    this.scheduleSave();

    if (this.isPostgres && this.pgPool) {
      this.pgPool.query(`UPDATE streamer_requests SET status = $1 WHERE id = $2`, [status, id]).catch(() => {});
    }

    if (status === 'APPROVED') {
      await this.createCreator({
        username: req.username,
        displayName: req.username,
        platform: 'TWITCH',
        platformUserId: `twitch_${req.username.toLowerCase()}`,
        channelUrl: `https://twitch.tv/${req.username}`,
        characterName: req.characterName,
        faction: req.faction as any,
        bio: req.bio,
        creatorCode: req.creatorCode,
        featured: false,
        featuredOrder: 999,
        verified: true,
        enabled: true,
      });
    }

    return req;
  }

  // --- DATABASE EXPORT / IMPORT (FOR VERCEL, LOCAL, OR CLOUD MIGRATIONS) ---
  exportFullDatabase(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.memoryDb));
  }

  async importFullDatabase(importedData: Partial<DatabaseSchema>): Promise<{ success: boolean; creatorCount: number }> {
    if (!importedData || typeof importedData !== 'object') {
      throw new Error('Invalid database format. Expected JSON object.');
    }

    if (Array.isArray(importedData.creators)) {
      this.memoryDb.creators = importedData.creators;
    }
    if (Array.isArray(importedData.platformAccounts)) {
      this.memoryDb.platformAccounts = importedData.platformAccounts;
    }
    if (Array.isArray(importedData.liveStreams)) {
      this.memoryDb.liveStreams = importedData.liveStreams;
    }
    if (Array.isArray(importedData.clips)) {
      this.memoryDb.clips = importedData.clips;
    }
    if (Array.isArray(importedData.streamerRequests)) {
      this.memoryDb.streamerRequests = importedData.streamerRequests;
    }
    if (Array.isArray(importedData.analyticsEvents)) {
      this.memoryDb.analyticsEvents = importedData.analyticsEvents;
    }
    if (Array.isArray(importedData.auditLogs)) {
      this.memoryDb.auditLogs = importedData.auditLogs;
    }
    if (Array.isArray(importedData.adminUsers) && importedData.adminUsers.length > 0) {
      this.memoryDb.adminUsers = importedData.adminUsers;
    }
    if (importedData.settings && typeof importedData.settings === 'object') {
      this.memoryDb.settings = { ...this.memoryDb.settings, ...importedData.settings };
    }

    await this.syncToPostgres();
    this.saveToFileImmediate();
    return {
      success: true,
      creatorCount: this.memoryDb.creators.length,
    };
  }
}

export const db = new DatabaseManager();
