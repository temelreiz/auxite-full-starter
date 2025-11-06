// server/index.js
import express from 'express';
import pricesRouter from './routes/prices.js';
import oracleHookRouter from './routes/oracle-hook.js';
import db from './lib/db.js';
import cors from "cors";
import { initWs } from './lib/ws.js';

const app = express();

/* ---------- CORS (dev için geniş) ---------- */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-oracle-signature, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* ---------- Parsers ---------- */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Health endpoints ---------- */
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/health/db', async (_req, res) => {
  try {
    const r = await db.execute('select 1 as ok');
    res.json({ ok: true, select1: String(r?.[0]?.ok ?? '1') });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const srv = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
initWs(srv);

/* ---------- Debug: son 20 oracle kaydı ---------- */
app.get('/debug/oracle-latest', async (_req, res) => {
  try {
    const rows = await db.execute(`
      SELECT HEX(address) AS address_hex, current_e6, round_id, updated_at_ts
      FROM oracle_updates
      ORDER BY updated_at_ts DESC
      LIMIT 20
    `);
    console.log(`🔎 debug/oracle-latest -> ${rows.length} rows`);
    res.json({ ok: true, rows });
  } catch (err) {
    console.error('debug/oracle-latest error:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/* ---------- API Routes ---------- */
app.use('/api', pricesRouter);
app.use('/api', oracleHookRouter);

/* ---------- Start ---------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

export default app;
