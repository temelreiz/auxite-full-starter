import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(cors()); // prod'da origin'i daralt: { origin: ["https://wallet.auxite.io","https://auxite.io"] }
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// ---------------------------
// In-memory price store
// ---------------------------
let prices = {
  AUXG: { symbol: "AUXG", price: 2475.32, ts: Date.now() },
  AUXS: { symbol: "AUXS", price: 28.14,   ts: Date.now() },
  AUXPT:{ symbol: "AUXPT",price: 903.92,  ts: Date.now() },
  AUXPD:{ symbol: "AUXPD",price: 1058.63, ts: Date.now() },
};

// ---------------------------
// HTTP endpoints
// ---------------------------
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

app.get("/api/prices", (_req, res) => {
  res.json({
    ok: true,
    data: Object.values(prices),
    updatedAt: new Date().toISOString(),
  });
});

app.get("/api/prices/:symbol", (req, res) => {
  const key = String(req.params.symbol || "").toUpperCase();
  const row = prices[key];
  if (!row) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, data: row });
});

// Admin price update — watcher buraya POST eder
app.post("/api/admin/price", (req, res) => {
  const { symbol, price } = req.body || {};

  // Güvenlik header'ları (ikisinden biri kabul)
  const secret = req.header("x-webhook-secret") || req.header("x-admin-secret");
  if (process.env.ADMIN_SECRET && secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const key = String(symbol || "").toUpperCase();
  if (!["AUXG", "AUXS", "AUXPT", "AUXPD"].includes(key)) {
    return res.status(400).json({ ok: false, error: "invalid symbol" });
  }

  const p = Number(price);
  if (!Number.isFinite(p)) {
    return res.status(400).json({ ok: false, error: "invalid price" });
  }

  prices[key] = { symbol: key, price: +p.toFixed(2), ts: Date.now() };
  console.log(`[price-update] ${key} -> ${prices[key].price}`);

  // WS publish
  broadcastPrices();
  res.json({ ok: true, data: prices[key] });
});

// ---------------------------
/* WebSocket server @ /ws/prices */
// ---------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/prices" });

// Basit ping/pong (ALB idle timeout'a karşı)
const HEARTBEAT_MS = 25_000;

wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  // İlk bağlananda anlık snapshot gönder
  try {
    ws.send(JSON.stringify({ type: "prices", data: Object.values(prices) }));
  } catch {}

  console.log(`[ws] client connected ${req.socket.remoteAddress}`);
});

function broadcastPrices() {
  const payload = JSON.stringify({ type: "prices", data: Object.values(prices) });
  for (const client of wss.clients) {
    try {
      if (client.readyState === 1) client.send(payload);
    } catch {}
  }
}

// Health checker for WS clients
setInterval(() => {
  for (const ws of wss.clients) {
    // @ts-ignore
    if (ws.isAlive === false) return ws.terminate();
    // @ts-ignore
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, HEARTBEAT_MS);

// ---------------------------
// (Opsiyonel) Mock jitter (dev testi)
// ---------------------------
const ENABLE_JITTER = process.env.MOCK_JITTER !== "0";
if (ENABLE_JITTER) {
  setInterval(() => {
    for (const k of Object.keys(prices)) {
      const base = prices[k].price;
      const delta = k === "AUXS" ? (Math.random() - 0.5) * 0.05 : (Math.random() - 0.5) * 1.0;
      prices[k] = { symbol: k, price: +(base + delta).toFixed(2), ts: Date.now() };
    }
    broadcastPrices();
  }, 3000);
}

// ---------------------------
// Start
// ---------------------------
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[auxite-api] listening on port ${PORT} (HTTP + WS)`);
});
