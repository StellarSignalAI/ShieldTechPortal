// stripe-webhook — Stripe calls this on checkout.session.completed.
// Verifies the Stripe-Signature HMAC (STRIPE_WEBHOOK_SECRET) and marks the
// matching invoice_links row paid; the portal then applies it to the local
// invoice via invoice-pay {action:'pending-apply'}.
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function verify(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t; const v1 = parts.v1;
  if (!t || !v1) return false;
  // Reject stale events (>5 min) to blunt replay.
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Constant-time compare — a char-by-char === leaks how many prefix bytes match.
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return json(503, { error: "webhook secret not configured" });

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  if (!(await verify(payload, sig, secret))) return json(400, { error: "bad signature" });

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(payload); } catch { return json(400, { error: "bad payload" }); }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const ref = meta.invoice_ref;
    if (ref && session.payment_status === "paid") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } },
      );
      // Never close an invoice off metadata alone — the paid amount and
      // currency must match the invoice_links row, or a smaller/replayed
      // payment would clear the full balance.
      const { data: link } = await admin.from("invoice_links")
        .select("id, amount").eq("invoice_ref", ref).eq("status", "sent").maybeSingle();
      const cents = Math.round((Number(link?.amount) || 0) * 100);
      const paidCents = Number(session.amount_total);
      const currency = String(session.currency ?? "").toLowerCase();
      if (link && paidCents === cents && cents > 0 && currency === "usd") {
        await admin.from("invoice_links").update({
          status: "paid", paid_at: new Date().toISOString(), paid_via: "stripe",
        }).eq("id", link.id);
      } else if (link) {
        await admin.from("invoice_links").update({
          status: "review", paid_via: "stripe",
        }).eq("id", link.id);
      }
    }
  }
  return json(200, { received: true });
});
