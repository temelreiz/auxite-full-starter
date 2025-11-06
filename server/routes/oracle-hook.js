// server/routes/oracle-hook.js
import express from "express";
import crypto from "crypto";
import db from "../lib/db.js";
import { broadcastPriceUpdates } from '../lib/ws.js';

const router = express.Router();

/**
 * Oracle webhook endpoint
 * watcher tarafından POST edilir
 * body = { ts, chainId, updates: [{ address, current, roundId, updatedAt }] }
 */
router.post("/oracle-hook", async (req, res) => {
  try {
    const sig = req.headers["x-oracle-signature"];
    const secret = process.env.WEBHOOK_SECRET || "auxite-shared-secret";
    const bodyRaw = JSON.stringify(req.body);

    // ✅ İmza doğrulama
    const expected = crypto.createHmac("sha256", secret).update(bodyRaw).digest("hex");
    if (sig !== expected) {
      console.warn("❌ invalid_signature", { sig, expected });
      return res.status(401).json({ ok: false, error: "invalid_signature" });
    }

    const { chainId, updates, ts } = req.body;
    if (!updates?.length) {
      console.log("⚠️  No updates received");
      return res.json({ ok: true, accepted: 0 });
    }

    let accepted = 0;

    // ✅ Veritabanına insert
    for (const u of updates) {
      try {
        await db.execute(
          `
          INSERT INTO oracle_updates (chain_id, address, current_e6, round_id, updated_at_ts)
          VALUES (?, UNHEX(REPLACE(?, '0x', '')), ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            current_e6 = VALUES(current_e6),
            updated_at_ts = VALUES(updated_at_ts)
        `,
          [chainId, u.address, u.current, u.roundId ?? 0, u.updatedAt]
        );
        accepted++;
      } catch (e) {
        console.error("❌ DB insert error:", e);
      }
    }

    const updatesForWs = updates.map(u => ({
  address: u.address,              // 0x... checksum/upper
  price: Number(u.current_e6) / 1e6,
  round_id: String(u.round_id ?? 0),
  updated_at_ts: String(u.updated_at_ts),
  chain_id: Number(chainId),
}));

broadcastPriceUpdates({
  chainId: Number(chainId),
  updates: updatesForWs
});

    console.log(`✅ Oracle hook received ${accepted}/${updates.length} updates`);
    res.json({ ok: true, accepted, ts });
  } catch (err) {
    console.error("❌ oracle-hook error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
