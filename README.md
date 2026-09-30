# PIONEER RP LIVE
### Dedicated Twitch Streaming & Creator Hub for Pioneer RP

Pioneer RP Live is a high-performance, production-ready web application and creator hub built specifically for the **Pioneer RP FiveM** community. It continuously monitors registered Twitch creators, automatically detects live broadcasts, streams real-time titles, viewer counts, and thumbnails, highlights featured creators (such as **TJ_SINGH007**), and attributes official creator codes directly linked to the Pioneer RP Tebex store.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |   Admin Panel (/admin)      |
                      |  - Register Streamers       |
                      |  - Reorder Featured List    |
                      |  - Manage Creator Codes     |
                      +--------------+--------------+
                                     |
                                     v
+-----------------------+     +---------------+     +-----------------------+
|  Official Twitch API  |<--->| Server-Side   |<--->| Resilient DB Storage  |
|  - Helix Users        |     | Stream Sync   |     | - PostgreSQL / pg     |
|  - Helix Streams      |     | Service (45s) |     | - Embedded Fallback   |
+-----------------------+     +-------+-------+     +-----------------------+
                                      |
                                      v
                       +-----------------------------+
                       | Real-Time Event Bus (SSE)   |
                       | GET /api/events             |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |   React 19 + Tailwind v4    |
                       |  - Cinematic Hero & City    |
                       |  - LIVE NOW Section         |
                       |  - Large Featured Hero Card |
                       |  - Streamer Directory       |
                       |  - Streamer Profile Pages   |
                       +-----------------------------+
```

### Key Architectural Tenets:
1. **No Automatic Discovery of Random Streamers**: Only accounts explicitly registered by server administrators are tracked.
2. **Server-Side API Caching**: Website visitors never trigger Twitch API requests. The background synchronization worker batches Twitch Helix requests every 30–60 seconds and updates the database.
3. **Real-Time Client Updates**: Uses Server-Sent Events (`/api/events`) with polling fallbacks so the browser updates dynamically without full page refreshes.
4. **Resilient Database Layer**: Supports PostgreSQL when `DATABASE_URL` is set, and automatically falls back to an embedded, transactional atomic database file (`data/pioneer_live.json`) for zero-configuration deployments.
5. **Platform Abstraction**: Schema separates `creators` from `platform_accounts`, allowing Kick or other video platforms to be plugged in seamlessly in future versions.

---

## 2. Features Implemented

- **Automated Live Detection**: Instant detection of when registered streamers go live, fetching viewer count, title, game category, start time, and thumbnail.
- **Offline Behavior**: Offline streamers are cleanly removed from LIVE NOW while remaining accessible in the community directory with their bio, character, and creator code. No stale viewer counts.
- **Initial Seed Creators**:
  1. `TJ_SINGH007` (Featured: Yes, Order: 1, Code: `INDIA`, Store: `https://pioneer-rp-18.tebex.io/`)
  2. `apocalypticsith` (Pioneer RP Streamer: Yes)
  3. `ithebunny` (Pioneer RP Streamer: Yes)
  4. `moxiemoses` (Pioneer RP Streamer: Yes)
- **Large Featured Hero Spotlight**: Featured live creators (e.g. TJ SINGH) receive an expansive esports-style hero showcase card with quick-copy Creator Code and Tebex CTA.
- **Creator Codes & Attribution**: One-click code copying and store redirects, with anonymous analytics click tracking (`watch_click`, `creator_code_click`, `store_click`).
- **Pioneer RP Streamers Directory**: Full directory with real-time debounced search (by username, display name, in-city character, or gang) and interactive filter tabs (`ALL`, `LIVE`, `OFFLINE`, `FEATURED`).
- **Streamer Profile Pages** (`/streamer/:slug`): Individual creator portals featuring cover banners, avatar, live broadcast status, character name, gang affiliation, bio, creator code widget, and recent recorded stream history.
- **Server Status Widget**: FiveM status indicator that gracefully displays `SERVER STATUS UNAVAILABLE` when no FiveM endpoint is configured, strictly preventing fabricated player counts.
- **Complete Admin Suite** (`/admin`):
  - Overview telemetry & Twitch API health status
  - Streamer Management (Add, Edit, Feature, Enable/Disable, Delete)
  - Live Twitch Account Resolver (auto-resolves Twitch ID, avatar, and channel)
  - Manual Override System (override display names, avatars, or bios without losing Twitch sync)
  - Drag-and-drop / ranking Featured Order Manager
  - Engagement & Click Analytics
  - Platform Settings & Polling Interval configurator
  - Secure Audit Log trail
  - Protected manual sync trigger (`POST /api/admin/sync-now` and `POST /api/internal/sync`)

---

## 3. Database Schema

The database utilizes relational entities:

### `creators`
- `id` (VARCHAR PRIMARY KEY)
- `slug` (VARCHAR UNIQUE)
- `displayName` (VARCHAR)
- `characterName` (VARCHAR, optional)
- `gangName` (VARCHAR, optional)
- `bio` (TEXT, optional)
- `profileImageUrl` (TEXT, optional)
- `bannerUrl` (TEXT, optional)
- `featured` (BOOLEAN DEFAULT FALSE)
- `featuredOrder` (INT DEFAULT 999)
- `creatorCode` (VARCHAR, optional)
- `creatorCodeDescription` (TEXT, optional)
- `creatorStoreUrl` (TEXT, optional)
- `verified` (BOOLEAN DEFAULT TRUE)
- `enabled` (BOOLEAN DEFAULT TRUE)
- `isPioneerStreamer` (BOOLEAN DEFAULT TRUE)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)

### `platform_accounts`
- `id` (VARCHAR PRIMARY KEY)
- `creatorId` (VARCHAR REFERENCES creators)
- `platform` (`'TWITCH' | 'KICK'`)
- `platformUserId` (VARCHAR)
- `username` (VARCHAR)
- `displayName` (VARCHAR)
- `channelUrl` (TEXT)
- `profileImageUrl` (TEXT)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)
- *Constraint*: `UNIQUE(platform, platformUserId)`

### `live_streams`
- `id` (VARCHAR PRIMARY KEY)
- `creatorId` (VARCHAR REFERENCES creators)
- `platformAccountId` (VARCHAR REFERENCES platform_accounts)
- `platform` (`'TWITCH' | 'KICK'`)
- `platformStreamId` (VARCHAR)
- `title` (TEXT)
- `category` (VARCHAR)
- `viewerCount` (INT)
- `thumbnailUrl` (TEXT)
- `startedAt` (TIMESTAMPTZ)
- `endedAt` (TIMESTAMPTZ, optional)
- `isLive` (BOOLEAN)
- `lastSeenAt` (TIMESTAMPTZ)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)

### `admin_users`
- `id` (VARCHAR PRIMARY KEY)
- `email` (VARCHAR UNIQUE)
- `username` (VARCHAR)
- `passwordHash` (TEXT - bcrypt)
- `role` (`'superadmin' | 'admin'`)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)

### `analytics_events` & `audit_logs`
- Stores anonymous click events and administrative changes.

---

## 4. Environment Variables

Create or configure `.env` (or Replit Secrets):

```bash
# Database (PostgreSQL URL; falls back to embedded atomic store if empty)
DATABASE_URL=

# Session Security
SESSION_SECRET=your_super_secret_session_key

# Twitch Developer Credentials (https://dev.twitch.tv/console)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Pioneer RP Links
PIONEER_STORE_URL=https://pioneer-rp-18.tebex.io/
PIONEER_DISCORD_URL=https://discord.gg/pioneerrp
PIONEER_JOIN_URL=fivem://connect/cfx.re/join/pioneer-rp

# FiveM Server Status API (Optional; leave empty to show 'SERVER STATUS UNAVAILABLE')
SERVER_STATUS_API_URL=

# Internal Sync Secret (For external cron jobs)
INTERNAL_SYNC_SECRET=pioneer_cron_secret_key
```

---

## 5. Twitch API Setup Instructions

1. Visit the [Twitch Developer Console](https://dev.twitch.tv/console).
2. Log in with your Twitch account and click **Register Your Application**.
3. Set **Name** to: `Pioneer RP Live`.
4. Set **OAuth Redirect URLs** to: `http://localhost:3000` (or your live app URL).
5. Set **Category** to: `Website Integration`.
6. Click **Create**.
7. Copy the generated **Client ID**.
8. Click **New Secret** to generate and copy the **Client Secret**.
9. Add them to your environment variables (`TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`) or input them directly into the **Admin Panel -> Settings** tab.

---

## 6. Admin Setup & Security

The database initializes with a default superadmin account:
- **Email**: `admin@pioneerrp.live`
- **Password**: `pioneerAdmin2026!`

To log in:
1. Navigate to `/admin` or click **Admin** in the navigation bar.
2. Enter your credentials.
3. You can change your password or add additional admins directly from the database or via environment variables.

---

## 7. Background Synchronization & Cron Setup

The backend synchronization engine runs continuously while the server is active, checking live status every 45 seconds (configurable between 20–600 seconds in Settings).

For serverless or sleeping Replit environments, you can also trigger synchronization using any standard cron service:
```bash
curl -X POST https://your-domain.com/api/internal/sync \
     -H "x-sync-secret: pioneer_cron_secret_key"
```

---

## 8. Deployment on Replit / Cloud Run

1. Clone or import the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests to verify all core logic:
   ```bash
   npm test
   ```
4. Build the application:
   ```bash
   npm run build
   ```
5. Start the full-stack server on port 3000:
   ```bash
   npm start
   ```

---

## 9. Testing Performed

The automated test suite (`tests/core.test.ts`) verifies:
- Initial seeding of the exact 4 Pioneer RP creators.
- Prevention of duplicate platform accounts.
- Search and filtering across streamers, gangs, and characters.
- Live stream detection, database upserting, and offline state transitions.
- Preservation of stream history across sessions.
- Dynamic drag-and-drop featured ordering.
- Accurate click tracking for watch clicks and creator code interactions.
- Admin password verification and role-based authorization.
