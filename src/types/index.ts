export type Platform = 'TWITCH' | 'KICK';

export type FactionType = 'POLICE' | 'EMS' | 'DOJ' | 'SYNDICATE' | 'CIVILIAN';

export interface Creator {
  id: string;
  slug: string;
  displayName: string;
  characterName?: string;
  gangName?: string;
  faction?: FactionType;
  bio?: string;
  profileImageUrl?: string;
  bannerUrl?: string;
  featured: boolean;
  featuredOrder: number;
  creatorCode?: string;
  creatorCodeDescription?: string;
  creatorStoreUrl?: string;
  verified: boolean;
  enabled: boolean;
  isPioneerStreamer: boolean;
  lastLiveAt?: string | null;
  isLive?: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  platformAccount?: PlatformAccount;
  currentStream?: LiveStream | null;
}

export interface CreatorVOD {
  id: string;
  creatorId: string;
  creatorDisplayName: string;
  creatorSlug: string;
  creatorProfileImage?: string;
  characterName?: string;
  gangName?: string;
  title: string;
  url: string;
  embedUrl?: string;
  vodId?: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  viewCount?: number | null;
  hasArchivedVod?: boolean;
  isDirectChannelLink?: boolean;
}

export interface PlatformAccount {
  id: string;
  creatorId: string;
  platform: Platform;
  platformUserId: string;
  username: string;
  displayName: string;
  channelUrl: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveStream {
  id: string;
  creatorId: string;
  platformAccountId: string;
  platform: Platform;
  platformStreamId: string;
  title: string;
  category: string;
  viewerCount: number;
  thumbnailUrl: string;
  startedAt: string;
  endedAt?: string | null;
  isLive: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'superadmin' | 'admin' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  discordUrl: string;
  discordWebhookUrl?: string;
  storeUrl: string;
  serverJoinUrl: string;
  serverStatusApiUrl: string;
  twitchPollingIntervalSeconds: number;
  liveRefreshIntervalSeconds: number;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheading: string;
  twitchClientId?: string;
  twitchClientSecret?: string;
  twitchClientIdConfigured: boolean;
  lastSyncAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncErrorMessage?: string | null;
}

export interface AnalyticsSummary {
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
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: string;
}

export interface ServerStatusResponse {
  available: boolean;
  online: boolean;
  playerCount?: number;
  maxPlayers?: number;
  serverName?: string;
  message: string;
  checkedAt: string;
}

export interface CommunityClip {
  id: string;
  title: string;
  clipUrl: string;
  embedUrl: string;
  creatorId?: string;
  creatorName: string;
  characterName?: string;
  category: 'CHASE' | 'HEIST' | 'COMEDY' | 'DRAMA' | 'GUNFIGHT';
  thumbnailUrl?: string;
  submitterName: string;
  upvotes: number;
  approved: boolean;
  featured: boolean;
  createdAt: string;
}

export interface StreamerRequest {
  id: string;
  username: string;
  characterName: string;
  faction: string;
  bio: string;
  creatorCode?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
