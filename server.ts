import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes/api.js';
import { db } from './server/db/database.js';
import { syncService } from './server/services/syncService.js';
import { buildRobotsTxt, buildSitemapXml, getPageSeo, injectSeoHead } from './src/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Initialize Database
  console.log('[Server] Initializing database...');
  await db.init();

  const getRequestOrigin = (req: express.Request) =>
    process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  const getRequestSeo = async (url: string, origin: string) => {
    const pathname = new URL(url, origin).pathname;
    const profileMatch = pathname.match(/^\/(?:streamer|streamers)\/([^/]+)/);
    const creator = profileMatch ? await db.getCreatorBySlug(decodeURIComponent(profileMatch[1])) : null;
    return getPageSeo(pathname, origin, creator ? [creator] : []);
  };

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(buildRobotsTxt(getRequestOrigin(req)));
  });

  app.get('/sitemap.xml', async (req, res, next) => {
    try {
      const creators = await db.getCreators({ enabledOnly: true });
      res.type('application/xml').send(buildSitemapXml(getRequestOrigin(req), creators));
    } catch (error) {
      next(error);
    }
  });

  // Initialize Stream Sync Service
  console.log('[Server] Starting Twitch Stream Sync Service...');
  syncService.init();

  // Mount API Router
  app.use('/api', apiRouter);

  // Serve static assets / generated images
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

  if (!isProd) {
    // Development mode with Vite dev server middlewares
    console.log('[Server] Mounting Vite dev middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const origin = getRequestOrigin(req);
        template = injectSeoHead(template, await getRequestSeo(url, origin));
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production mode: Serve built static client files.
    // When bundled to dist/server.js, __dirname is already the dist folder; when
    // run from source it is the project root, so resolve both layouts safely.
    const distPath = fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
      ? path.resolve(__dirname, 'dist')
      : __dirname;
    const renderPage = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
          res.status(404).send('Application build not found. Please run npm run build.');
          return;
        }
        const origin = getRequestOrigin(req);
        const template = fs.readFileSync(indexPath, 'utf-8');
        const html = injectSeoHead(template, await getRequestSeo(req.originalUrl, origin));
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (error) {
        next(error);
      }
    };
    app.get('/', renderPage);
    app.use(express.static(distPath));
    app.get('*', renderPage);
  }

  app.listen(PORT, () => {
    console.log(`[PIONEER RP LIVE] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
