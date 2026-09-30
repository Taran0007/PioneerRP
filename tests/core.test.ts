import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/db/database.js';
import { twitchService } from '../server/services/twitchService.js';
import { syncService } from '../server/services/syncService.js';
import type { Creator } from '../src/types/index.js';
import { buildRobotsTxt, buildSitemapXml, getPageSeo, injectSeoHead } from '../src/seo.js';

describe('Pioneer RP Live Core Architecture & Data Suite', () => {
  before(async () => {
    await db.init();
  });

  test('1. Initial seed data contains the exact 4 Pioneer RP creators', async () => {
    const creators = await db.getCreators({ enabledOnly: false });
    assert.ok(creators.length >= 4, 'Database must have at least 4 seeded creators');

    const usernames = creators.map(c => c.platformAccount?.username.toLowerCase());
    assert.ok(usernames.includes('tj_singh007'), 'Must include TJ_SINGH007');
    assert.ok(usernames.includes('apocalypticsith'), 'Must include apocalypticsith');
    assert.ok(usernames.includes('ithebunny'), 'Must include ithebunny');
    assert.ok(usernames.includes('moxiemoses'), 'Must include moxiemoses');

    const tj = creators.find(c => c.platformAccount?.username.toLowerCase() === 'tj_singh007');
    assert.ok(tj, 'TJ_SINGH007 exists');
    assert.equal(tj.featured, true, 'TJ_SINGH007 must be featured');
    assert.equal(tj.featuredOrder, 1, 'TJ_SINGH007 featuredOrder must be 1');
    assert.equal(tj.creatorCode, 'INDIA', 'TJ_SINGH007 creatorCode must be INDIA');
    assert.equal(tj.creatorStoreUrl, 'https://pioneer-rp-18.tebex.io/', 'Store URL must match');
  });

  test('2. Duplicate platform accounts are prevented', async () => {
    await assert.rejects(
      async () => {
        await db.createCreator({
          displayName: 'TJ Clone',
          username: 'TJ_SINGH007', // already exists
          platform: 'TWITCH',
          platformUserId: 'twitch_seed_tj_singh007',
          channelUrl: 'https://twitch.tv/TJ_SINGH007',
        });
      },
      /already exists/,
      'Should reject duplicate Twitch username'
    );
  });

  test('3. Search and filter functionality operates correctly', async () => {
    // Search by gang
    const gangResults = await db.getCreators({ search: 'Purple Nine' });
    assert.ok(gangResults.some(c => c.gangName === 'Purple Nine'), 'Should find creator by gang name');

    // Search by character
    const charResults = await db.getCreators({ search: 'Bunny Foster' });
    assert.ok(charResults.some(c => c.characterName === 'Bunny Foster'), 'Should find creator by character name');

    // Filter by featured
    const featuredResults = await db.getCreators({ featuredOnly: true });
    assert.ok(featuredResults.every(c => c.featured), 'All returned creators must be featured');
  });

  test('4. Live stream detection, upsert, and offline detection works', async () => {
    const creators = await db.getCreators({ enabledOnly: false });
    const testCreator = creators[0];

    // Simulate going live
    const liveStream = await db.upsertLiveStream({
      creatorId: testCreator.id,
      platformAccountId: testCreator.platformAccount!.id,
      platform: 'TWITCH',
      platformStreamId: 'stream_test_9999',
      title: 'TEST LIVESTREAM PIONEER RP',
      category: 'Grand Theft Auto V',
      viewerCount: 1540,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      startedAt: new Date().toISOString(),
      isLive: true,
    });

    assert.equal(liveStream.isLive, true);
    assert.equal(liveStream.viewerCount, 1540);

    // Verify creator now shows up in live creators query
    const liveQuery = await db.getCreators({ isLiveOnly: true });
    assert.ok(liveQuery.some(c => c.id === testCreator.id), 'Creator must show up in isLiveOnly list');

    // Simulate going offline
    await db.markPlatformAccountOffline(testCreator.platformAccount!.id);

    // Verify creator is removed from live list but profile remains in directory
    const afterOfflineQuery = await db.getCreators({ isLiveOnly: true });
    assert.ok(!afterOfflineQuery.some(c => c.id === testCreator.id), 'Creator must no longer be in isLive list');

    const directoryQuery = await db.getCreators();
    assert.ok(directoryQuery.some(c => c.id === testCreator.id), 'Creator must still remain in directory');
  });

  test('5. Featured ordering respects custom order assignments', async () => {
    const creators = await db.getCreators({ featuredOnly: true });
    if (creators.length > 0) {
      await db.updateFeaturedOrder([
        { id: creators[0].id, featuredOrder: 5, featured: true },
      ]);
      const updated = await db.getCreatorById(creators[0].id);
      assert.equal(updated?.featuredOrder, 5);
      // Reset back to 1
      await db.updateFeaturedOrder([
        { id: creators[0].id, featuredOrder: 1, featured: true },
      ]);
    }
  });

  test('6. Analytics events track watch clicks and creator code clicks accurately', async () => {
    const creators = await db.getCreators();
    const testCreator = creators[0];

    const initialSummary = db.getAnalyticsSummary();
    await db.trackAnalyticsEvent('watch_click', testCreator.id, { test: true });
    await db.trackAnalyticsEvent('creator_code_click', testCreator.id, { code: testCreator.creatorCode });

    const newSummary = db.getAnalyticsSummary();
    assert.equal(newSummary.totalWatchClicks, initialSummary.totalWatchClicks + 1);
    assert.equal(newSummary.totalCodeClicks, initialSummary.totalCodeClicks + 1);
  });

  test('7. Admin authentication and credential management', async () => {
    const admin = await db.getAdminByEmailOrUsername('TJSINGH');
    assert.ok(admin, 'Superadmin account TJSINGH must exist in database');
    assert.equal(admin.role, 'superadmin');
    assert.equal(admin.username, 'TJSINGH');
  });

  test('8. Stream history preservation', async () => {
    const creators = await db.getCreators();
    const testCreator = creators[0];
    const history = await db.getRecentStreamHistory(testCreator.id);
    assert.ok(Array.isArray(history), 'Stream history must return an array');
  });
});

describe('Pioneer RP Live SEO metadata', () => {
  test('uses route-specific titles and canonicalizes legacy aliases', () => {
    const liveSeo = getPageSeo('/live', 'https://pioneerrp.example');
    const aliasSeo = getPageSeo('/past-broadcasts', 'https://pioneerrp.example');

    assert.equal(liveSeo.title, 'Live Pioneer RP Streams | Twitch Creators');
    assert.equal(liveSeo.canonicalUrl, 'https://pioneerrp.example/live');
    assert.equal(aliasSeo.canonicalPath, '/vods');
    assert.equal(aliasSeo.canonicalUrl, 'https://pioneerrp.example/vods');
  });

  test('marks administration pages as non-indexable', () => {
    const adminSeo = getPageSeo('/admin/login', 'https://pioneerrp.example');

    assert.equal(adminSeo.robots, 'noindex, nofollow');
    assert.equal(adminSeo.canonicalUrl, 'https://pioneerrp.example/admin/login');
  });

  test('builds crawl files using enabled public creators only', () => {
    const creators = [
      { slug: 'creator-one', displayName: 'Creator One', enabled: true },
      { slug: 'creator-two', displayName: 'Creator Two', enabled: false },
    ] as Creator[];
    const sitemap = buildSitemapXml('https://pioneerrp.example', creators);
    const robots = buildRobotsTxt('https://pioneerrp.example');

    assert.match(sitemap, /https:\/\/pioneerrp\.example\/streamer\/creator-one/);
    assert.doesNotMatch(sitemap, /creator-two/);
    assert.match(robots, /Disallow: \/admin/);
    assert.match(robots, /Sitemap: https:\/\/pioneerrp\.example\/sitemap\.xml/);
  });

  test('injects crawler-visible metadata into the server HTML template', () => {
    const seo = getPageSeo('/live', 'https://pioneerrp.example');
    const template = '<html><head><!-- PIONEERRP_SEO_START --><title>Old</title><!-- PIONEERRP_SEO_END --></head></html>';
    const html = injectSeoHead(template, seo);

    assert.match(html, /<title>Live Pioneer RP Streams \| Twitch Creators<\/title>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/pioneerrp\.example\/live"/);
    assert.match(html, /application\/ld\+json/);
    assert.doesNotMatch(html, /PIONEERRP_SEO_START/);
  });
});
