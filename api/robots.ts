import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildRobotsTxt } from '../src/seo.js';

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

export default function handler(req: VercelRequest, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.end(buildRobotsTxt(getRequestOrigin(req)));
}