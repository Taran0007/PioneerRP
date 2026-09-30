import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../server/db/database.js';
import { buildSitemapXml } from '../src/seo.js';

interface VercelRequest extends IncomingMessage {
  headers: IncomingMessage['headers'];
}

function getRequestOrigin(req: VercelRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const forwardedProtocol = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol;
  return `${protocol?.split(',')[0].trim() || 'https'}://${Array.isArray(host) ? host[0] : host}`;
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  try {
    await db.init();
    const creators = await db.getCreators({ enabledOnly: true });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    res.end(buildSitemapXml(getRequestOrigin(req), creators));
  } catch (error) {
    console.error('[SEO sitemap] Failed to build sitemap:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Unable to build sitemap.');
  }
}