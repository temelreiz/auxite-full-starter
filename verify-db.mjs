// verify-db.mjs
// Node 18+ (global fetch) + @planetscale/database gerektirir
import { connect } from "@planetscale/database";

/**
 * Ortam değişkenlerini 2 yoldan okur:
 *  A) Doğrudan @planetscale/database için:
 *     PSCALE_HOST, PSCALE_USERNAME, PSCALE_PASSWORD, (opsiyonel) PSCALE_DATABASE
 *  B) MySQL tarzı bağlantı dizesi:
 *     DATABASE_URL = mysql://USERNAME:PASSWORD@HOST/DATABASE?ssl={"rejectUnauthorized":true}
 */
function loadConfig() {
  const {
    PSCALE_HOST,
    PSCALE_USERNAME,
    PSCALE_PASSWORD,
    PSCALE_DATABASE,
    DATABASE_URL,
  } = process.env;

  // Yol A: PSCALE_* değişkenleri doluysa kullan
  if (PSCALE_HOST && PSCALE_USERNAME && PSCALE_PASSWORD) {
    return {
      mode: "env",
      cfg: {
        host: PSCALE_HOST,
        username: PSCALE_USERNAME,
        password: PSCALE_PASSWORD,
      },
      database: PSCALE_DATABASE || undefined,
    };
  }

  // Yol B: DATABASE_URL varsa parse et
  if (DATABASE_URL) {
    try {
      const u = new URL(DATABASE_URL);
      if (u.protocol !== "mysql:") {
        throw new Error(`DATABASE_URL mysql:// ile başlamalı (mevcut: ${u.protocol})`);
      }
      const host = u.host; // host:port (PlanetScale'de genelde port yok)
      const username = decodeURIComponent(u.username);
      const password = decodeURIComponent(u.password);
      const database = u.pathname?.replace(/^\//, "") || undefined;
      if (!host || !username || !password) {
        throw new Error("DATABASE_URL eksik: host / username / password ayrıştırılamadı.");
      }
      return {
        mode: "url",
        cfg: { host, username, password },
        database,
      };
    } catch (e) {
      throw new Error(`DATABASE_URL ayrıştırma hatası: ${e.message}`);
    }
  }

  throw new Error(
    "Bağlantı bilgisi bulunamadı. Ya PSCALE_HOST/PSCALE_USERNAME/PSCALE_PASSWORD ayarla ya da DATABASE_URL kullan."
  );
}

function mask(str = "") {
  if (!str) return "";
  if (str.length <= 6) return "*".repeat(str.length);
  return str.slice(0, 3) + "…" + str.slice(-3);
}

(async () => {
  console.log("🔎 PlanetScale bağlantısı doğrulanıyor…");

  const { mode, cfg, database } = loadConfig();

  console.log("⚙️  Yapılandırma kaynağı:", mode === "env" ? "PSCALE_* env" : "DATABASE_URL");
  console.log("➡️  Host:", cfg.host);
  console.log("➡️  Username:", cfg.username);
  console.log("➡️  Password:", mask(cfg.password));
  if (database) console.log("➡️  Database (hedef):", database);

  // @planetscale/database bağlantısı
  const conn = connect({
    host: cfg.host,
    username: cfg.username,
    password: cfg.password,
  });

  // 1) Basit sağlık sorguları
  const q1 = await conn.execute("SELECT 1 AS ok");
  console.log("✅ SELECT 1:", q1.rows);

  // 2) Sunucu zamanı, sürüm, aktif DB
  const qTime = await conn.execute("SELECT NOW() AS `now_value`");
  console.log("🕒 Zaman:", qTime.rows);

  const qVer  = await conn.execute("SELECT VERSION() AS `db_version`");
  console.log("🧩 Sürüm:", qVer.rows);

  const qDb   = await conn.execute("SELECT DATABASE() AS `db_name`");
  console.log("🗄️ DB:", qDb.rows);

  // 3) Mevcut veritabanı adı (PlanetScale’de keyspace adı genelde DB adınla eşleşir)
  const q3 = await conn.execute("SELECT DATABASE() AS db");
  console.log("🗄️  Aktif DATABASE():", q3.rows);

  // 4) İzinlerin/erişimin temel testi: tablo/ görünüm var mı bak
  const q4 = await conn.execute("SHOW FULL TABLES");
  const tables = q4.rows.map((r) => Object.values(r)[0]);
  console.log("📚 Tablolar:", tables);

  // 5) oracle_updates varsa bir örnek satır sayımı dene (yoksa hata vermez, sadece bilgi)
  if (tables.includes("oracle_updates")) {
    const q5 = await conn.execute(
      "SELECT COUNT(*) AS rows_total FROM oracle_updates"
    );
    console.log("🔢 oracle_updates rows_total:", q5.rows);
  } else {
    console.log("ℹ️  'oracle_updates' tablosu bulunamadı (normal olabilir).");
  }

  console.log("🎉 Bağlantı testi tamam — her şey yolunda görünüyor.");
})().catch((err) => {
  console.error("❌ DB doğrulama hatası:", err?.message || err);
  process.exit(1);
});
