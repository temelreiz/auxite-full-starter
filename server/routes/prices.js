// server/routes/prices.js
import { Router } from 'express';
import db from '../lib/db.js';

const router = Router();

/**
 * GET /api/prices?chain=84532
 * Dönen örnek:
 * [
 *   { address:"0xABC...", price: 132.5, round_id:"0", updated_at_ts:"17618...", dir:"up" }
 * ]
 */
router.get('/prices', async (req, res) => {
  try {
    const chainId = Number(req.query.chain || req.query.chainId);
    if (!chainId) {
      return res.status(400).json({ ok: false, error: 'missing chain (e.g. ?chain=84532)' });
    }

    // 1) Adres başına EN SON kaydı bul (QUALIFY/WINDOW yok; alt-sorgu + join)
    const latestRows = await db.execute(
      `
      SELECT
        HEX(u.address)      AS address_hex,
        u.current_e6        AS current_e6,
        u.round_id          AS round_id,
        u.updated_at_ts     AS updated_at_ts
      FROM oracle_updates AS u
      JOIN (
        SELECT address, MAX(updated_at_ts) AS max_ts
        FROM oracle_updates
        WHERE chain_id = ?
        GROUP BY address
      ) AS m
        ON m.address = u.address
       AND m.max_ts  = u.updated_at_ts
      WHERE u.chain_id = ?
      ORDER BY u.updated_at_ts DESC
      `,
      [chainId, chainId]
    );

    if (!latestRows.length) {
      return res.json([]);
    }

    // 2) Aynı adresler için "bir önceki" ts'i bul
    const prevTsRows = await db.execute(
      `
      SELECT
        x.address           AS address_bin,
        MAX(x.updated_at_ts) AS prev_ts
      FROM oracle_updates x
      JOIN (
        SELECT address, MAX(updated_at_ts) AS max_ts
        FROM oracle_updates
        WHERE chain_id = ?
        GROUP BY address
      ) mx
        ON mx.address = x.address
      WHERE x.chain_id = ?
        AND x.updated_at_ts < mx.max_ts
      GROUP BY x.address
      `,
      [chainId, chainId]
    );

    // prev_ts -> current_e6 almak için tek seferde fetch
    // (adres, prev_ts) ikililerinden bir sorgu daha ile değerleri çekiyoruz
    const prevLookup = new Map(); // key: hexAddress => { prev_ts, prev_e6 }
    if (prevTsRows.length) {
      // küçük bir toplu get: (address, ts) eşleşmesine göre
      // Vitess parametre limitine takılmamak için tek tek alacağız (kayıt sayısı az)
      for (const r of prevTsRows) {
        const prev = await db.execute(
          `
          SELECT current_e6
          FROM oracle_updates
          WHERE address = ? AND updated_at_ts = ? AND chain_id = ?
          LIMIT 1
          `,
          [r.address_bin, r.prev_ts, chainId]
        );
        const hex = Buffer.from(r.address_bin).toString('hex').toUpperCase();
        prevLookup.set(hex, {
          prev_ts: String(r.prev_ts),
          prev_e6: prev.length ? Number(prev[0].current_e6) : undefined,
        });
      }
    }

    // 3) Çıktıyı hazırlayalım
    const out = latestRows.map((row) => {
      const hex = row.address_hex.toUpperCase();
      const prev = prevLookup.get(hex);
      let dir = 'flat';
      if (prev && typeof prev.prev_e6 === 'number') {
        if (Number(row.current_e6) > prev.prev_e6) dir = 'up';
        else if (Number(row.current_e6) < prev.prev_e6) dir = 'down';
      }
      return {
        address: '0x' + hex,
        price: Number(row.current_e6) / 1e6,
        round_id: String(row.round_id),
        updated_at_ts: String(row.updated_at_ts),
        dir,
      };
    });

    res.json(out);
  } catch (err) {
    console.error('GET /api/prices error:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
