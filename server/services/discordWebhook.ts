import { Creator, LiveStream } from '../../src/types/index.js';
import { db } from '../db/database.js';

class DiscordWebhookService {
  async sendLiveNotification(creator: Creator, stream: LiveStream, webhookUrlOverride?: string): Promise<{ success: boolean; message: string }> {
    const settings = db.getSettings();
    const webhookUrl = (webhookUrlOverride || settings.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL || '').trim();

    if (!webhookUrl) {
      return { success: false, message: 'No Discord webhook URL configured.' };
    }

    const channelUrl = creator.platformAccount?.channelUrl || `https://twitch.tv/${creator.slug}`;
    const avatar = creator.profileImageUrl || `https://avatar.vercel.sh/${creator.slug}.png`;
    const previewImage = stream.thumbnailUrl || avatar;

    const embed = {
      title: `🚨 ${creator.displayName} is LIVE in Pioneer RP!`,
      url: channelUrl,
      description: `**${stream.title || 'Roleplay Broadcast'}**\n\nStreaming **${stream.category || 'Grand Theft Auto V'}** on Pioneer RP.`,
      color: 0x9333ea, // Pioneer Purple
      fields: [
        {
          name: '👤 Character',
          value: creator.characterName || 'Unknown Citizen',
          inline: true,
        },
        {
          name: '⚔️ Gang / Faction',
          value: creator.gangName || creator.faction || 'Civilian',
          inline: true,
        },
        {
          name: '👥 Viewers',
          value: `${stream.viewerCount || 1} watching`,
          inline: true,
        },
      ],
      author: {
        name: `${creator.displayName} (@${creator.platformAccount?.username || creator.slug})`,
        icon_url: avatar,
        url: channelUrl,
      },
      image: {
        url: previewImage,
      },
      footer: {
        text: 'Pioneer RP Live Hub · Stream Notifications',
        icon_url: 'https://avatar.vercel.sh/pioneer-rp.png',
      },
      timestamp: new Date().toISOString(),
    };

    if (creator.creatorCode) {
      embed.fields.push({
        name: '🎟️ Store Code',
        value: `Use code **${creator.creatorCode}** at the Tebex store!`,
        inline: false,
      });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📢 **${creator.displayName}** just went live in Los Santos! Come watch at ${channelUrl}`,
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Discord API returned ${response.status}: ${errorText}` };
      }

      return { success: true, message: 'Discord notification delivered successfully!' };
    } catch (err: any) {
      return { success: false, message: 'Failed to send Discord webhook: ' + err.message };
    }
  }

  async sendTestNotification(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    const dummyCreator: Creator = {
      id: 'test_creator',
      slug: 'tj-singh007',
      displayName: 'TJ SINGH',
      characterName: 'Tejinder "TJ" Singh',
      gangName: 'Purple Nine',
      faction: 'SYNDICATE',
      creatorCode: 'INDIA',
      featured: true,
      featuredOrder: 1,
      verified: true,
      enabled: true,
      isPioneerStreamer: true,
      profileImageUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/93257e18-d1ea-4b74-bb3b-c93e136ad8e2-profile_image-300x300.jpeg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      platformAccount: {
        id: 'plat_test',
        creatorId: 'test_creator',
        platform: 'TWITCH',
        platformUserId: '234975883',
        username: 'TJ_SINGH007',
        displayName: 'TJ SINGH',
        channelUrl: 'https://twitch.tv/TJ_SINGH007',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const dummyStream: LiveStream = {
      id: 'stream_test',
      creatorId: 'test_creator',
      platformAccountId: 'plat_test',
      platform: 'TWITCH',
      platformStreamId: 'test_123',
      title: '🟣TJ SINGH got FEATURED!! Code: INDIA in PioneerRP STORE! | Pioneer RP',
      category: 'Grand Theft Auto V',
      viewerCount: 42,
      thumbnailUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_tj_singh007-1280x720.jpg',
      startedAt: new Date().toISOString(),
      isLive: true,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.sendLiveNotification(dummyCreator, dummyStream, webhookUrl);
  }
}

export const discordWebhook = new DiscordWebhookService();
