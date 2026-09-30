# 🧠 Pioneer RP Live Hub — Project Memory & Architectural Mindmap

> **Local Persistent Memory for AI Context & Operations**  
> *This document serves as a high-density, token-saving reference mindmap of the entire Pioneer RP Live codebase, architecture, schemas, and operational status.*

---

## 🗺️ Architectural Mindmap (Visual Topology)

```
                            ┌─────────────────────────────────────────┐
                            │        PIONEER RP LIVE ECOSYSTEM        │
                            └────────────────────┬────────────────────┘
                                                 │
         ┌──────────────────────────────┬────────┴──────────────┬──────────────────────────────┐
         │                              │                       │                              │
         ▼                              ▼                       ▼                              ▼
┌──────────────────┐          ┌───────────────────┐   ┌───────────────────┐          ┌──────────────────┐
│  DATA INGESTION  │          │   CORE BACKEND    │   │  FRONTEND (SPA)   │          │ CLOUD & DATABASE │
└────────┬─────────┘          └─────────┬─────────┘   └─────────┬─────────┘          └────────┬─────────┘
         │                              │                       │                             │
 ┌───────┴───────┐              ┌───────┴───────┐       ┌───────┴───────┐             ┌───────┴────────┐
 │ Twitch Helix  │              │ Express API   │       │ React 19/Vite │             │ File DB (JSON) │
 │ API & OAuth   │              │ /server/api.ts│       │ Tailwind CSS  │             │ pioneer_live   │
 ├───────────────┤              ├───────────────┤       ├───────────────┤             ├────────────────┤
 │ FiveM Server  │              │ SSE Updates   │       │ Multi-Stream  │             │ Vercel Postgres│
 │ Status (cfx)  │              │ /api/events   │       │ Squad Grid    │             │ Neon / Supabase│
 ├───────────────┤              ├───────────────┤       ├───────────────┤             ├────────────────┤
 │ Discord Live  │              │ JWT Admin     │       │ Los Santos    │             │ Cloud Firestore│
 │ Webhook Bot   │              │ Auth & RBAC   │       │ District Map  │             │ ai-studio-db   │
 ├───────────────┤              ├───────────────┤       ├───────────────┤             ├────────────────┤
 │ Tebex Store   │              │ Audit Logging │       │ PWA & Push    │             │ JSON & CSV     │
 │ Referral Clicks│             │ & Analytics   │       │ Notifications │             │ Backup Exports │
 └───────────────┘              └───────────────┘       └───────────────┘             └────────────────┘
```

---

## 🧭 Core Feature Matrix & Status

| # | Feature Name | Component / File | Backend Route | Status | Notes |
|---|--------------|------------------|---------------|--------|-------|
| 1 | **Multi-Stream Squad Grid** | `src/pages/SquadStreamPage.tsx` | N/A (Twitch Embed) | 🟢 Complete | Up to 4 simultaneous streams, audio switch, Twitch chat dock, URL sharing |
| 2 | **Interactive Los Santos Map** | `src/pages/CityMapPage.tsx` | N/A (Static + Live) | 🟢 Complete | Mission Row, Pillbox Hill, DOJ Courthouse, Rancho, LSIA with faction filter |
| 3 | **FiveM Server Live Status** | `src/components/FiveMStatusBar.tsx` | `GET /api/server-status` | 🟢 Complete | Player count (e.g. 124/128), ping, direct `fivem://connect` launch & IP copy |
| 4 | **Community Clips Portal** | `src/pages/ClipsPage.tsx` | `/api/clips`, `/api/admin/clips` | 🟢 Complete | Submit clip, category filter (Chase, Heist, etc.), upvoting, admin moderation |
| 5 | **Discord Live Webhook Bot** | `server/services/discordWebhook.ts` | `POST /api/admin/discord/test` | 🟢 Complete | Rich embeds with character, faction, viewer count, Tebex code, stream preview |
| 6 | **Creator & Faction Badges** | `src/components/StreamerCard.tsx` | `GET /api/streamers` | 🟢 Complete | Police (LSPD), EMS (Pillbox), DOJ, Syndicate, Civilian badging & filters |
| 7 | **Event Calendar & Schedule** | `src/pages/EventsPage.tsx` | N/A (Static Events) | 🟢 Complete | Court trials, turf wars, car meets, add to calendar & squad stream shortcut |
| 8 | **Creator Code & Tebex Analytics**| `src/pages/admin/AdminDashboard.tsx` | `POST /api/analytics` | 🟢 Complete | Click-through tracker for Tebex store codes, profile views, and watch clicks |
| 9 | **Theme Accent Color Switcher**| `src/context/ThemeContext.tsx` | N/A (Local Storage) | 🟢 Complete | Instant theme cycling: Neon Purple (`#9333ea`), Cyber Cyan, Emerald Green |
| 10 | **Web Push Notifications** | `public/sw.js` | Service Worker | 🟢 Complete | Browser push notifications for creator live broadcasts |
| 11 | **Progressive Web App (PWA)** | `public/manifest.webmanifest` | Service Worker | 🟢 Complete | Offline precache, mobile home screen installable, standalone app experience |
| 12 | **Twitch Chat Integration** | Embedded Twitch Chat | Twitch Embed API | 🟢 Complete | Dockable chat panel with streamer selector in Live and Squad view |
| 13 | **VOD Bookmarks & Timestamps** | `src/pages/VodsPage.tsx` | `GET /api/vods` | 🟢 Complete | Roleplay timestamp bookmarks (heist breaches, 10-80 pursuits) with quick jump |
| 14 | **One-Click FiveM Launcher** | `src/components/FiveMStatusBar.tsx`| Client Protocol | 🟢 Complete | Launches `fivem://connect/...` and automatically copies server IP to clipboard |
| 15 | **Database Backups & CSV Export**| `src/pages/admin/AdminDashboard.tsx`| `/api/admin/db/export`, CSV routes| 🟢 Complete | JSON full restore/export + Creator CSV and Audit Log CSV download |

---

## 🔐 Credentials & Session Management

- **Superadmin Email**: `Trnjeet@gmail.com` (case-insensitive)
- **Superadmin Username**: `TJSINGH`
- **Superadmin Password**: `Taran@&007`
- **JWT Cookie**: `pioneer_admin_token` (HTTP-only, SameSite=Strict, 7-day expiration)
- **Twitch API Keys**:
  - Saved directly in database settings (`pioneer_live.json`) or `.env`:
  - `twitchClientId` & `twitchClientSecret`
  - Automated app access token retrieval with token refresh caching.

---

## 🗄️ Database Schemas & Persistence

1. **Storage Engine Abstraction** (`server/db/database.ts`):
   - **Local / Default**: `/data/pioneer_live.json` (auto-created from seed if missing)
   - **Vercel Serverless**: `/tmp/data/pioneer_live.json` (auto-seeded from repository on cold start)
   - **Postgres / Neon / Supabase**: Activated automatically when `DATABASE_URL`, `POSTGRES_URL`, or `POSTGRES_PRISMA_URL` is set.
2. **Key Collections**:
   - `creators`: Streamer profiles, slug, Twitch usernames, factions, character names, Tebex codes.
   - `platformAccounts`: Twitch/Kick account links, channel URLs, user IDs.
   - `liveStreams`: Stream status, category, viewer counts, thumbnails, start times.
   - `clips`: Community clips, category, embed URLs, upvotes, approved/featured flags.
   - `analyticsEvents`: Watch clicks, code clicks, store clicks, profile views.
   - `auditLogs`: Administrative change logs with admin ID, action, timestamp, and metadata.
   - `adminUsers`: Admin accounts with bcrypt password hashes.
   - `settings`: Site branding, Twitch keys, FiveM server URL, Discord webhook.

---

## 🚀 API Endpoint Reference Map

- **Public**:
  - `GET /api/health` — System status & uptime
  - `GET /api/live` — Live creators list
  - `GET /api/featured` — Featured creators
  - `GET /api/streamers` & `GET /api/creators` — Directory with filters (`filter`, `search`, `platform`)
  - `GET /api/streamers/:slug` — Streamer profile & stream history
  - `GET /api/vods` — Past broadcasts directly from Twitch Helix
  - `GET /api/clips` — Approved community clips
  - `POST /api/clips/submit` — Submit community clip
  - `POST /api/clips/:id/upvote` — Upvote clip
  - `GET /api/server-status` — FiveM server player count and online state
  - `GET /api/settings` — Public site configuration
  - `POST /api/analytics` — Record click events (`watch_click`, `creator_code_click`, etc.)
  - `GET /api/events` — Server-Sent Events (SSE) live updates
- **Admin (Protected by `requireAdmin`)**:
  - `POST /api/auth/login` — Login with email/username + password
  - `POST /api/auth/logout` — Invalidate session
  - `GET /api/auth/me` — Verify session token
  - `GET /api/admin/overview` — Dashboard summary cards
  - `GET /api/admin/streamers` — Full streamer list with controls
  - `POST /api/admin/streamers` — Add new streamer (auto-resolves Twitch profile)
  - `PUT /api/admin/streamers/:id` — Update streamer info & manual overrides
  - `DELETE /api/admin/streamers/:id` — Remove streamer
  - `PUT /api/admin/featured/reorder` — Reorder featured carousel
  - `GET /api/admin/clips` — Moderation list of all community clips
  - `PUT /api/admin/clips/:id` — Approve, feature, or edit clip
  - `DELETE /api/admin/clips/:id` — Remove clip
  - `GET /api/admin/settings` — Get sensitive settings including Twitch keys
  - `PUT /api/admin/settings` — Update site settings & Twitch credentials
  - `POST /api/admin/sync-now` — Trigger immediate Twitch live status sync
  - `GET /api/admin/analytics` — Click metrics and top creator referrals
  - `GET /api/admin/audit-logs` — Audit trail
  - `GET /api/admin/admins` — Admin user management
  - `POST /api/admin/admins` — Create secondary admin
  - `DELETE /api/admin/admins/:id` — Delete admin
  - `POST /api/admin/discord/test` — Test Discord webhook delivery
  - `GET /api/admin/db/export` — Download full database JSON backup
  - `POST /api/admin/db/import` — Restore full database from JSON
  - `GET /api/admin/export/creators.csv` — Download creators list as CSV
  - `GET /api/admin/export/audit-logs.csv` — Download audit logs as CSV
