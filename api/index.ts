import express from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from '../server/routes/api.js';
import { db } from '../server/db/database.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let initialized = false;

app.use(async (_req, _res, next) => {
  if (!initialized) {
    try {
      await db.init();
      initialized = true;
    } catch (err) {
      console.error('[Vercel Serverless] DB init error:', err);
    }
  }
  next();
});

// Mount router on /api and root fallback
app.use('/api', apiRouter);

export default app;
