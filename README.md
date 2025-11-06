# Auxite Full Starter (Wallet + Webhook)
Next.js app; `/api/oracle-hook` endpoint'inden watcher verisini alır.
## Geliştirme
npm i
npm run dev
curl -X POST http://localhost:3000/api/oracle-hook -H 'content-type: application/json' --data '{"ts":1,"chainId":84532,"updates":[]}'
