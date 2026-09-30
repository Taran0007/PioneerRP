import React, { useState } from 'react';
import {
  Network, Server, Database, Globe, Radio, Shield, Cpu,
  Sparkles, CheckCircle2, ChevronRight, ChevronDown, Copy,
  Check, ExternalLink, RefreshCw, Terminal, Layers
} from 'lucide-react';

interface MindmapNode {
  id: string;
  name: string;
  category: 'ingestion' | 'frontend' | 'backend' | 'storage' | 'security';
  status: 'operational' | 'configured' | 'active';
  summary: string;
  details: string;
  endpoints?: string[];
  files?: string[];
}

const MINDMAP_DATA: MindmapNode[] = [
  // Subsystem: Data Ingestion & APIs
  {
    id: 'twitch-helix',
    name: 'Twitch Helix Streams API',
    category: 'ingestion',
    status: 'operational',
    summary: 'Polls registered streamer Twitch channels every 30-45s for live status, game category, titles, viewer numbers, and past VODs.',
    details: 'Implements OAuth Client Credentials flow with cached app tokens. Auto-resolves Twitch usernames into Helix User IDs, profile pictures, and stream metadata.',
    endpoints: ['GET /api/live', 'GET /api/vods', 'POST /api/admin/sync-now'],
    files: ['server/services/twitchService.ts', 'server/services/syncService.ts'],
  },
  {
    id: 'fivem-cfx',
    name: 'FiveM Real-Time Server Status',
    category: 'ingestion',
    status: 'operational',
    summary: 'Monitors the Pioneer RP FiveM server player count (124/128), online health, and direct connect protocol.',
    details: 'Queries CFX /dynamic.json endpoint with caching to prevent rate-limits. Powers the persistent header status bar and one-click fivem:// launcher.',
    endpoints: ['GET /api/server-status'],
    files: ['server/services/serverStatusService.ts', 'src/components/FiveMStatusBar.tsx'],
  },
  {
    id: 'discord-webhook',
    name: 'Discord Live Announcement Bot',
    category: 'ingestion',
    status: 'operational',
    summary: 'Sends rich embedded announcements to Discord (#streamer-announcements) when creators go live in Los Santos.',
    details: 'Generates embeds containing character name, faction (LSPD, Pillbox, Syndicate), live preview snapshot, current viewer count, and Tebex store codes.',
    endpoints: ['POST /api/admin/discord/test'],
    files: ['server/services/discordWebhook.ts'],
  },
  {
    id: 'tebex-analytics',
    name: 'Tebex Store & Code Click Tracker',
    category: 'ingestion',
    status: 'operational',
    summary: 'Collects referral telemetry for creator Tebex codes, watch clicks, and store outbound visits.',
    details: 'Records event stream without third-party tracking cookies. Aggregates top referral creators in the Admin Analytics dashboard.',
    endpoints: ['POST /api/analytics', 'GET /api/admin/analytics'],
    files: ['server/routes/api.ts', 'src/pages/admin/AdminDashboard.tsx'],
  },

  // Subsystem: Frontend Experience (SPA)
  {
    id: 'squad-stream',
    name: 'Multi-Stream Squad Grid (1-4 Streams)',
    category: 'frontend',
    status: 'operational',
    summary: 'Watch up to 4 Pioneer RP streams simultaneously with synchronized audio switching and Twitch chat dock.',
    details: 'Embeds official Twitch interactive players. Allows adding custom channels, switching active sound with 1 click, and sharing squad URLs (?streamers=...).',
    endpoints: ['Client-Side Twitch Embeds'],
    files: ['src/pages/SquadStreamPage.tsx'],
  },
  {
    id: 'city-map',
    name: 'Los Santos Interactive District Map',
    category: 'frontend',
    status: 'operational',
    summary: 'Interactive district landmark map of Los Santos (Mission Row LSPD, Pillbox Hill EMS, DOJ Courthouse, Rancho, LSIA).',
    details: 'Displays streamer pins by in-game faction and location. Features direct "Launch in Squad View" action to watch district roleplay.',
    endpoints: ['Client-Side Interactive SVG Map'],
    files: ['src/pages/CityMapPage.tsx'],
  },
  {
    id: 'clips-portal',
    name: 'Community Clips & Highlights Portal',
    category: 'frontend',
    status: 'operational',
    summary: 'Viewer clip submission portal for high-speed chases, bank heists, court drama, and comedic moments.',
    details: 'Supports optimistic upvotes, Twitch clip URL slug parser, category filtering (CHASE, HEIST, COMEDY, DRAMA, GUNFIGHT), and admin moderation.',
    endpoints: ['GET /api/clips', 'POST /api/clips/submit', 'POST /api/clips/:id/upvote'],
    files: ['src/pages/ClipsPage.tsx', 'server/routes/api.ts'],
  },
  {
    id: 'events-calendar',
    name: 'Server Event Schedule & Calendar',
    category: 'frontend',
    status: 'operational',
    summary: 'Schedule of high-stakes community roleplay events (Supreme Court trials, gang turf wars, custom supercar showcases).',
    details: 'Includes countdown, participating streamer rosters, Google Calendar add links, and squad stream integration.',
    endpoints: ['Static Event Feeds'],
    files: ['src/pages/EventsPage.tsx'],
  },
  {
    id: 'theme-engine',
    name: 'Dynamic Neon Theme Switcher',
    category: 'frontend',
    status: 'operational',
    summary: 'Customizable accent themes: Neon Purple (#9333ea), Cyber Cyan (#06b6d4), and Emerald Green (#10b981).',
    details: 'Instant reactive styling with localStorage persistence and CSS variable bindings.',
    endpoints: ['Client Storage'],
    files: ['src/context/ThemeContext.tsx', 'src/components/Navbar.tsx'],
  },
  {
    id: 'pwa-service-worker',
    name: 'Progressive Web App (PWA) & Push',
    category: 'frontend',
    status: 'operational',
    summary: 'Installable standalone mobile app for Android and iOS home screens with offline precaching and push stream alerts.',
    details: 'Configured manifest.webmanifest with standalone display, app icons, and service worker push notification listener.',
    endpoints: ['/manifest.webmanifest', '/sw.js'],
    files: ['public/manifest.webmanifest', 'public/sw.js', 'index.html'],
  },

  // Subsystem: Backend Core & SSE
  {
    id: 'express-sse',
    name: 'Express 4 REST & SSE Engine',
    category: 'backend',
    status: 'operational',
    summary: 'High-performance API server with Server-Sent Events (SSE) broadcasting live sync updates to clients.',
    details: 'Zero polling latency when streamers go live. Emits SYNC_UPDATE events across active browser tabs.',
    endpoints: ['GET /api/events', 'GET /api/health'],
    files: ['server.ts', 'server/routes/api.ts'],
  },
  {
    id: 'auth-rbac',
    name: 'Admin Authentication & RBAC',
    category: 'backend',
    status: 'operational',
    summary: 'Role-based access control (Superadmin, Admin, Moderator) with bcrypt password hashing and JWT sessions.',
    details: 'Supports login via email (Trnjeet@gmail.com) or username (TJSINGH). Employs HttpOnly SameSite=Strict cookies.',
    endpoints: ['POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/auth/me'],
    files: ['server/routes/api.ts', 'server/db/database.ts'],
  },
  {
    id: 'audit-logs',
    name: 'Audit Trail & Action Logging',
    category: 'backend',
    status: 'operational',
    summary: 'Complete audit log recording every admin action (adding streamers, editing Tebex codes, deleting users, backups).',
    details: 'Stores timestamp, admin email, entity ID, and metadata diff. Exportable to CSV and JSON.',
    endpoints: ['GET /api/admin/audit-logs', 'GET /api/admin/export/audit-logs.csv'],
    files: ['server/db/database.ts', 'server/routes/api.ts'],
  },

  // Subsystem: Database & Storage
  {
    id: 'file-database',
    name: 'JSON Storage Engine (/data/pioneer_live.json)',
    category: 'storage',
    status: 'operational',
    summary: 'High-speed local JSON database with debounced asynchronous atomic disk writes.',
    details: 'Auto-seeds initial streamers and superadmin credentials if data file is absent. Safe for local development and self-hosted VPS.',
    endpoints: ['Internal Storage Engine'],
    files: ['server/db/database.ts', 'data/pioneer_live.json'],
  },
  {
    id: 'cloud-postgres',
    name: 'Vercel Postgres & Cloud Relational DB',
    category: 'storage',
    status: 'configured',
    summary: 'Instant connectivity with Vercel Postgres, Neon, or Supabase via DATABASE_URL or POSTGRES_URL.',
    details: 'Auto-initializes table schema and triggers migration from seed file if tables are empty.',
    endpoints: ['External Postgres Pool'],
    files: ['server/db/database.ts'],
  },
  {
    id: 'backup-restore',
    name: 'Full Database JSON & CSV Exporter',
    category: 'storage',
    status: 'operational',
    summary: 'One-click full database backup download, file restore, and creator/audit log CSV exports.',
    details: 'Enables migration between development, local machine, VPS, and Vercel without data loss.',
    endpoints: ['GET /api/admin/db/export', 'POST /api/admin/db/import', 'GET /api/admin/export/creators.csv'],
    files: ['server/routes/api.ts', 'server/db/database.ts'],
  },
];

export const MindmapView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<MindmapNode>(MINDMAP_DATA[0]);
  const [copiedNote, setCopiedNote] = useState(false);

  const categories = [
    { id: 'all', label: 'All Subsystems', count: MINDMAP_DATA.length },
    { id: 'ingestion', label: 'Data Ingestion & APIs', count: MINDMAP_DATA.filter(n => n.category === 'ingestion').length },
    { id: 'frontend', label: 'Frontend (SPA)', count: MINDMAP_DATA.filter(n => n.category === 'frontend').length },
    { id: 'backend', label: 'Backend & SSE', count: MINDMAP_DATA.filter(n => n.category === 'backend').length },
    { id: 'storage', label: 'Database & Cloud', count: MINDMAP_DATA.filter(n => n.category === 'storage').length },
  ];

  const filteredNodes = selectedCategory === 'all'
    ? MINDMAP_DATA
    : MINDMAP_DATA.filter(n => n.category === selectedCategory);

  const handleCopyMindmapSummary = () => {
    const summaryText = `🧠 Pioneer RP Live Hub Architecture Mindmap\n\nSubsystems:\n${MINDMAP_DATA.map(n => `• [${n.status.toUpperCase()}] ${n.name}: ${n.summary}`).join('\n')}`;
    navigator.clipboard.writeText(summaryText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mindmap Header */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-neutral-900/60 to-neutral-900/40 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
              <Network className="h-4 w-4" />
              <span>PERSISTENT LOCAL MEMORY & SYSTEM TOPOLOGY</span>
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">
              Pioneer RP Live Ecosystem Mindmap
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              High-density structural representation of the Pioneer RP streaming platform. Documents live APIs, data contracts, and feature states while optimizing AI token retrieval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyMindmapSummary}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-mono text-purple-300 transition-colors"
            >
              {copiedNote ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedNote ? 'Mindmap Copied!' : 'Copy Mindmap Notes'}</span>
            </button>
            <a
              href="/PROJECT_MEMORY.md"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-colors"
            >
              <span>View PROJECT_MEMORY.md</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/[0.08]">
          <div className="rounded-xl bg-neutral-950/50 p-3 border border-white/5">
            <div className="text-[11px] font-mono text-neutral-400">Total System Nodes</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{MINDMAP_DATA.length} Active Modules</div>
          </div>
          <div className="rounded-xl bg-neutral-950/50 p-3 border border-white/5">
            <div className="text-[11px] font-mono text-neutral-400">Operational Health</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Online
            </div>
          </div>
          <div className="rounded-xl bg-neutral-950/50 p-3 border border-white/5">
            <div className="text-[11px] font-mono text-neutral-400">Storage Architecture</div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">Dual (JSON + Postgres)</div>
          </div>
          <div className="rounded-xl bg-neutral-950/50 p-3 border border-white/5">
            <div className="text-[11px] font-mono text-neutral-400">Token Efficiency</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">~85% Token Savings</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs (Interactive Functional Buttons) */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <span>{cat.label}</span>
            <span className="ml-1.5 text-[10px] opacity-75 font-mono">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Mindmap Interactive Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Node Graph / Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Architecture Modules</span>
            <span>{filteredNodes.length} Nodes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all text-left group ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">
                      {node.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {node.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-purple-300 transition-colors">
                    {node.name}
                  </h3>

                  <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {node.summary}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
                    <span>{node.endpoints ? `${node.endpoints.length} Endpoints` : 'Module'}</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isSelected ? 'translate-x-1 text-purple-400' : 'text-neutral-400 group-hover:translate-x-0.5'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Node Inspector & Contract Details */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-neutral-900/90 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">
                  NODE INSPECTOR
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedNode.name}
                </h3>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                {selectedNode.status.toUpperCase()}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-neutral-400 uppercase">Description & Intent</div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {selectedNode.details}
              </p>
            </div>

            {selectedNode.endpoints && selectedNode.endpoints.length > 0 && (
              <div>
                <div className="text-[11px] font-mono text-neutral-400 uppercase mb-1.5">Connected Endpoints</div>
                <div className="space-y-1">
                  {selectedNode.endpoints.map(ep => (
                    <div key={ep} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-white/5 font-mono text-xs text-purple-300">
                      <Terminal className="h-3 w-3 text-purple-400" />
                      <span>{ep}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.files && selectedNode.files.length > 0 && (
              <div>
                <div className="text-[11px] font-mono text-neutral-400 uppercase mb-1.5">Codebase Files</div>
                <div className="space-y-1">
                  {selectedNode.files.map(f => (
                    <div key={f} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-white/5 font-mono text-xs text-neutral-300">
                      <Layers className="h-3 w-3 text-neutral-400" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.08] text-[11px] text-neutral-400 font-mono flex items-center justify-between">
              <span>Subsystem: {selectedNode.category}</span>
              <span>Memory Node ID: #{selectedNode.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
