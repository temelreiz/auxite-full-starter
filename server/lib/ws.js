// server/lib/ws.js (ESM)
import { WebSocketServer } from 'ws';

let wss;

/** HTTP server üstünde /ws/prices endpoint'i açar */
export function initWs(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws/prices' });
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
    socket.on('error', (e) => console.error('[WS] socket error:', e));
  });
  console.log('🔌 WS ready at path /ws/prices');
}

/** Canlı fiyat güncellemelerini tüm client’lara yollar */
export function broadcastPriceUpdates(payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'price_update', ...payload });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}
