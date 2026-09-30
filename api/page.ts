import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../server/db/database.js';
import { getPageSeo, injectSeoHead } from '../src/seo.js';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getRequestOrigin(req: VercelRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = firstValue(req.headers['x-forwarded-host']) || req.headers.host || 'localhost';
  const forwardedProtocol = firstValue(req.headers['x-forwarded-proto'])?.split(',')[0].trim();
  return `${forwardedProtocol || 'https'}://${host}`;
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  try {
    await db.init();
    const origin = getRequestOrigin(req);
    const requestedPath = firstValue(req.query?.path) || '/';
    const pathname = requestedPath.startsWith('/') ? requestedPath : `/${requestedPath}`;
    const profileMatch = pathname.match(/^\/(?:streamer|streamers)\/([^/]+)/);
    const creator = profileMatch ? await db.getCreatorBySlug(decodeURIComponent(profileMatch[1])) : null;
    const templatePath = path.join(process.cwd(), 'dist', 'index.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    const html = injectSeoHead(template, getPageSeo(pathname, origin, creator ? [creator] : []));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.end(html);
  } catch (error) {
    console.error('[SEO page render] Failed to render page metadata:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Unable to render page.');
  }
}