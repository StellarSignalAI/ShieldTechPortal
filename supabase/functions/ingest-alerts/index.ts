// ingest-alerts — structured bid-alert ingestion (API contract).
// POST {alerts: [{title, buyer, sourceId?, sourceUrl?, solicitationId?, state?,
//                 trades?, value?, dueAt?, siteWalkAt?, poc?, docs?, why?}]}
// Auth: signed-in Admin/Staff session OR x-cron-secret: CRON_SECRET header.
// Dedupe ladder: sourceUrl → solicitationId → (title, buyer, dueAt).
// Optional territory/trade filters via TERRITORIES / TRADES env (csv).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export async function authorize(req: Request, admin: ReturnType<typeof createClient>) {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return { ok: true, via: "cron" };
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return { ok: false };
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return { ok: false };
  const { data: p } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return { ok: p?.role === "Admin" || p?.role === "Staff", via: "session" };
}

export type AlertIn = {
  title?: string; buyer?: string; sourceId?: string; sourceUrl?: string; solicitationId?: string;
  state?: string; trades?: string[]; value?: number; dueAt?: string; siteWalkAt?: string;
  poc?: unknown; docs?: unknown; why?: string; fit?: number; raw?: unknown;
};

export function passesFilters(a: AlertIn): boolean {
  const territories = (Deno.env.get("TERRITORIES") ?? "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const trades = (Deno.env.get("TRADES") ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (territories.length && a.state && !territories.includes(a.state.toUpperCase())) return false;
  if (trades.length && a.trades?.length && !a.trades.some(t => trades.includes(t.toLowerCase()))) return false;
  return true;
}

export async function upsertAlerts(admin: ReturnType<typeof createClient>, alerts: AlertIn[]) {
  let inserted = 0, deduped = 0, filtered = 0, invalid = 0;
  for (const a of alerts) {
    if (!a || !a.title?.trim() || !a.buyer?.trim()) { invalid++; continue; }
    if (!passesFilters(a)) { filtered++; continue; }

    // Dedupe ladder
    let dupe = null;
    if (a.sourceUrl) {
      const { data } = await admin.from("opportunities").select("id").eq("source_url", a.sourceUrl).maybeSingle();
      dupe = data;
    }
    if (!dupe && a.solicitationId) {
      const { data } = await admin.from("opportunities").select("id").eq("solicitation_id", a.solicitationId).maybeSingle();
      dupe = data;
    }
    if (!dupe) {
      const q = admin.from("opportunities").select("id").eq("title", a.title).eq("buyer", a.buyer);
      const { data } = a.dueAt ? await q.eq("due_at", a.dueAt).maybeSingle() : await q.is("due_at", null).maybeSingle();
      dupe = data;
    }
    if (dupe) { deduped++; continue; }

    const { error } = await admin.from("opportunities").insert({
      solicitation_id: a.solicitationId ?? null,
      source_id: a.sourceId ?? null,
      source_url: a.sourceUrl ?? null,
      title: a.title.trim(),
      buyer: a.buyer.trim(),
      state: a.state ?? null,
      territory: a.state ?? null,
      trades: a.trades ?? [],
      value_estimate: a.value ?? null,
      due_at: a.dueAt ?? null,
      site_walk_at: a.siteWalkAt ?? null,
      poc: a.poc ?? null,
      docs: a.docs ?? null,
      raw: a.raw ?? null,
      fit_score: a.fit ?? null,
      why: a.why ?? null,
    });
    if (error) invalid++; else inserted++;
  }
  return { inserted, deduped, filtered, invalid };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const auth = await authorize(req, admin);
  if (!auth.ok) return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });

  let body: { alerts?: AlertIn[] };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  if (!Array.isArray(body.alerts) || !body.alerts.length) {
    return json(400, { ok: false, error: "alerts[] required" });
  }

  const result = await upsertAlerts(admin, body.alerts);
  return json(200, { ok: true, data: result });
});
