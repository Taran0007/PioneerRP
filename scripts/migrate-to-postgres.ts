import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { db } from '../server/db/database.js';

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

async function main() {
  if (!DB_URL) {
    throw new Error('Set DATABASE_URL (or POSTGRES_URL) before running the migration.');
  }

  const file = path.resolve(process.cwd(), 'data', 'pioneer_live.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Embedded database not found at ${file}`);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

  // init() connects, creates the schema (if missing) and loads existing rows.
  await db.init();
  console.log('[Migrate] storage mode:', db.storageMode);
  if (db.storageMode !== 'postgres') {
    throw new Error('Postgres is not connected. Check the DATABASE_URL value.');
  }

  // Clear any rows so the embedded JSON becomes the authoritative snapshot.
  const pool = new pg.Pool({
    connectionString: DB_URL,
    ssl: DB_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  });
  await pool.query(
    'TRUNCATE creators, platform_accounts, live_streams, clips, streamer_requests, analytics_events, audit_logs, admin_users, settings RESTART IDENTITY CASCADE'
  );
  await pool.end();

  const result = await db.importFullDatabase(data);
  console.log('[Migrate] imported creators:', result.creatorCount);

  const admins = await db.getAllAdmins();
  console.log('[Migrate] admins:', admins.map(a => `${a.username}/${a.role}`).join(', ') || '(none)');
  process.exit(0);
}

main().catch(err => {
  console.error('[Migrate] failed:', err.message);
  process.exit(1);
});
