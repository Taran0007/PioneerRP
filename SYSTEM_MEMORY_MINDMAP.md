# PIONEER RP LIVE — SYSTEM MEMORY & ARCHITECTURE MINDMAP
*Last Updated: 2026-09-30 | Local Memory Cache for AI Agent & Engineering Continuity*

```
                             [PIONEER RP LIVE]
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
[FRONTEND (React 19)]        [BACKEND (Express API)]      [PERSISTENCE & STORAGE]
    |                                |                                |
    +-- Navbar (NavLinks + Squad)   +-- /api/streamers & creators   +-- data/pioneer_live.json (Bundled)
    +-- HomePage (Hero + 3D Marquee)+-- /api/live & featured        +-- /tmp/data/pioneer_live.json (Vercel)
    +-- LiveStreamPlayer (Twitch)   +-- /api/vods (Helix API)       +-- PostgreSQL / Neon (DATABASE_URL)
    +-- Multi-Stream Squad Grid     +-- /api/auth & admin           +-- Cloud Firestore (ai-studio)
    +-- Streamers Directory         +-- /api/server-status (FiveM)  +-- /api/admin/db/export & import
    +-- Factions & Role Badges      +-- StreamSyncService (Twitch)
    +-- Admin Dashboard (/admin)    +-- Discord Webhook Service
```

---

## 15-Feature Implementation Matrix & Progress Tracker

| # | Feature Name | Status | Components / Files | Key Details |
|---|--------------|--------|---------------------|-------------|
| 1 | **Multi-Stream Squad Grid** | ✅ DONE | `src/pages/SquadStreamPage.tsx`, `Navbar.tsx` | 2, 3, 4 stream layouts, solo-audio switch, tabbed chat selector, URL sync |
| 2 | **FiveM Server Status Banner** | ✅ DONE | `src/components/FiveMStatusBar.tsx` | Dynamic player count (128/128), queue, ping, and quick actions |
| 3 | **Creator Factions & Roleplay Badging** | ✅ DONE | `src/types/index.ts`, `StreamerCard.tsx`, `StreamersPage.tsx` | Factions: LSPD, EMS, DOJ, Syndicate, Civilians with color tags & filters |
| 4 | **Interactive Los Santos Live Map** | ✅ DONE | `src/pages/CityMapPage.tsx`, `Navbar.tsx` | GTA V district pins, headquarters, live streamer location pings |
| 5 | **Community Stream Clips Portal** | ✅ DONE | `src/pages/ClipsPage.tsx`, `server/routes/api.ts` | Twitch clips showcase, clip submit modal, upvote counter, category tabs |
| 6 | **Discord Webhook Live Notifications** | ✅ DONE | `server/services/discordWebhook.ts`, `AdminDashboard.tsx` | Rich embed bot on creator live stream start + test trigger |
| 7 | **Roleplay Events & Court Schedule** | ✅ DONE | `src/pages/EventsPage.tsx`, `Navbar.tsx` | Community calendar: trial hearings, car meets, bank heists |
| 8 | **Creator Code Analytics & Leaderboard** | ✅ DONE | `src/pages/admin/AdminDashboard.tsx`, `server/routes/api.ts` | Tebex code click analytics with creator leaderboard |
| 9 | **Theme Switcher (Neon Purple/Cyan/OLED)** | ✅ DONE | `src/context/ThemeContext.tsx`, `Navbar.tsx` | Dynamic accent palette switch (Purple / Cyan / Emerald) |
| 10 | **Web Push & Notification Alerts** | 🟢 NEXT | `src/components/NotificationSubscribeModal.tsx` | Browser streamer live alerts simulation & push subscription |
| 11 | **Progressive Web App (PWA)** | 📋 PLANNED | `manifest.webmanifest`, service worker | Offline cache & home screen install |
| 12 | **Live Chat Badges & Pioneer VIPs** | 📋 PLANNED | `src/components/TwitchChatEmbed.tsx` | VIP custom badges in embedded chat |
| 13 | **VOD Bookmarks & Roleplay Timestamps** | 📋 PLANNED | `src/pages/VodsPage.tsx` | Jump to police chases, court verdicts, shootouts |
| 14 | **One-Click FiveM Direct Launcher** | ✅ DONE | `FiveMStatusBar.tsx` | Native deep-linking `fivem://connect/cfx.re/join/pioneer-rp` + F8 copy |
| 15 | **Audit Trail Export & DB Backups** | ✅ DONE | `server/routes/api.ts`, `AdminDashboard.tsx` | Export/Import JSON database backup |

---

## Active Memory Context (Save Tokens)
- **Superadmin Account**: `Trnjeet@gmail.com` / `TJSINGH` (Password: `Taran@&007`)
- **Twitch Helix Credentials**: Managed in database `settings` or `.env`
- **Default Streamers**:
  1. `creator_tjsingh007` (TJ SINGH / Purple Nine / Code: INDIA)
  2. `creator_apocalypticsith` (ApocalypticSith / Syndicate / Code: DEMON)
  3. `creator_ithebunny` (ithebunny / Civilian & Pillbox EMS)
  4. `creator_moxiemoses` (Moxie Moses / Independent Crew)
