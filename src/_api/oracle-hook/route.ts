import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_json" }, { status: 400 });

  // (opsiyonel) HMAC doğrulaması
  const secret = process.env.WEBHOOK_SECRET || "";
  if (secret) {
    const sig = req.headers.get("x-oracle-signature") || "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(body)));
    const hex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,"0")).join("");
    if (sig !== `sha256=${hex}`) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  console.log("✅ Webhook data received:", body);
  return NextResponse.json({ ok: true, accepted: Array.isArray(body.updates) ? body.updates.length : 0 });
}
