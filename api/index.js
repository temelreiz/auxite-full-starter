// api/index.js

// CommonJS kullanıyoruz. Eğer projede "type": "module" varsa, require yerine import'a uyarlarsın.
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const app = express();

// Production CORS: sadece bizim domainler
app.use(
  cors({
    origin: [
      "https://wallet.auxite.io",
      "https://auxite.io",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  })
);

app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

let prices = {};
let lastUpdate = null;

// ---------------------------
// WebSocket → api.auxite.io
// ---------------------------

const WS_URL =
  process.env.PRICES_WS_URL || "wss://api.auxite.io/ws/prices";

let ws = null;
let wsConnected = false;
let reconnectTimeout = null;

function connectPriceFeed() {
  if (ws) {
    try {
      ws.terminate();
    } catch (_) {}
    ws = null;
  }

  console.log("[Auxite] Connecting to price feed:", WS_URL);

  ws = new WebSocket(WS_URL, {
    headers: {
      // Cloudflare / backend Origin kontrolü için:
      Origin: "https://wallet.auxite.io",
    },
  });

  ws.on("open", () => {
    wsConnected = true;
    console.log("[Auxite] Price feed connected ✅");
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      // Beklenen format: { type: "prices", data: [ { symbol, price, ...}, ... ] }
      if (msg && msg.type === "prices" && Array.isArray(msg.data)) {
        msg.data.forEach((p) => {
          if (!p || !p.symbol || p.price == null) return;
          prices[p.symbol] = {
            symbol: p.symbol,
            price: Number(p.price),
            ts: p.ts || Date.now(),
          };
        });
        lastUpdate = Date.now();
        // console.log("[Auxite] prices updated", prices);
      }
    } catch (err) {
      console.error("[Auxite] WS message parse error:", err.message);
    }
  });

  ws.on("error", (err) => {
    console.error("[Auxite] WS error:", err.message);
  });

  ws.on("close", (code, reason) => {
    wsConnected = false;
    console.warn(
      "[Auxite] WS closed",
      code,
      reason && reason.toString ? reason.toString() : ""
    );
    // Otomatik reconnect
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectPriceFeed();
      }, 5000);
    }
  });
}

// İlk bağlantı
connectPriceFeed();

// ---------------------------
// HTTP endpoints
// ---------------------------

// Basit healthcheck
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    wsConnected,
    lastUpdate,
    symbols: Object.keys(prices),
  });
});

// Frontend’in kullanacağı endpoint
app.get("/api/prices", (req, res) => {
  const list = Object.values(prices);

  res.json({
    source: "auxite-watcher-ws",
    wsConnected,
    lastUpdate,
    count: list.length,
    prices: list,
  });
});

// ---------------------------

app.listen(PORT, () => {
  console.log(`[Auxite API] listening on port ${PORT}`);
});
