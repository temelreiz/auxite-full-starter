import { connect } from '@planetscale/data' // alias of @planetscale/database
import { config } from 'node:process';

const {
  DATABASE_URL,
  PLANETSCALE_HOST,
  PLANETSCALE_USERNAME,
  PLANETSCALE_PASSWORD,
} = process.env;

let conn;

if (DATABASE_URL) {
  conn = connect({ url: DATABASE_URL });
} else if (PLANETSCALE_HOST && PLANETSCALE_USERNAME && PLANETSCALE_PASSWORD) {
  conn = connect({
    host: PLANETSCALE_HOST,
    username: PLANETSCALE_USERNAME,
    password: PLANETSCALE_PASSWORD,
  });
} else {
  console.warn('[DB] No PlanetScale credentials provided. Writes will fail.');
}

export async function insertUpdates({ chainId, ts, updates }) {
  if (!conn) throw new Error('DB not configured');

  // bulk insert
  const values = updates.map(u => ([
    chainId,
    u.address.toLowerCase(),
    BigInt(u.current),
    BigInt(u.roundId || 0),
    BigInt(u.updatedAt || 0),
    BigInt(ts || 0),
    'webhook',
  ]));

  // Using multi-row insert
  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
  const flat = values.flat();

  const sql = `
    INSERT INTO oracle_updates
      (chain_id, address, price_e6, round_id, updated_at_ts, ts_sent, source, received_at)
    VALUES ${placeholders}
  `;

  return await conn.execute(sql, flat);
}

export async function getLatestByAddress(addr) {
  if (!conn) throw new Error('DB not configured');
  const { rows } = await conn.execute(
    `SELECT address, chain_id, price_e6, round_id, updated_at_ts, ts_sent, received_at
     FROM oracle_updates
     WHERE address = ?
     ORDER BY updated_at_ts DESC
     LIMIT 1`,
    [addr.toLowerCase()]
  );
  return rows?.[0] || null;
}

export async function getLatestAll(limit = 50) {
  if (!conn) throw new Error('DB not configured');
  const { rows } = await conn.execute(
    `SELECT address, chain_id, price_e6, round_id, updated_at_ts, ts_sent, received_at
     FROM (
       SELECT *,
         ROW_NUMBER() OVER (PARTITION BY address ORDER BY updated_at_ts DESC) AS rn
       FROM oracle_updates
     ) t
     WHERE t.rn = 1
     ORDER BY received_at DESC
     LIMIT ?`, [limit]
  );
  return rows || [];
}
