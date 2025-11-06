// server/lib/db.js (örnek)
import { Client } from "@planetscale/database";

const client = new Client({ host: process.env.PSCALE_HOST, username: process.env.PSCALE_USERNAME, password: process.env.PSCALE_PASSWORD });

async function execute(sql, args = []) {
  const r = await client.execute(sql, args);
  return r.rows; // <-- daima dizi
}

export default { execute };
