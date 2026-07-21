// sam-poll — SAM.gov Get Opportunities v2 poller (api.data.gov key).
// POST {days?: number} with an Admin/Staff session or x-cron-secret header.
// Pulls recent opportunities matching security-integrator NAICS codes and
// feeds them through the same dedupe/insert pipeline as ingest-alerts.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Security-integrator trades: security systems, alarm, low-voltage electrical, fire.
const DEFAULT_NAICS = "561621,238210,922160,561612";

async function authorize(req: Request, admin: ReturnType<typeof createClient>) {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return false;
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return false;
  const { data: p } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return p?.role === "Admin" || p?.role === "Staff";
}

const mmddyyyy = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const apiKey = Deno.env.get("SAM_GOV_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "SAM_GOV_API_KEY not configured" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  if (!(await authorize(req, admin))) {
    return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });
  }

  let body: { days?: number } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }
  const days = Math.min(Math.max(body.days ?? 7, 1), 30);
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);

  const territories = (Deno.env.get("TERRITORIES") ?? "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const naics = (Deno.env.get("SAM_NAICS") ?? DEFAULT_NAICS).split(",").map(s => s.trim()).filter(Boolean);

  // ── Fetch from SAM.gov ──
  type SamOpp = Record<string, any>;
  const opps: SamOpp[] = [];
  try {
    for (const code of naics) {
      const params = new URLSearchParams({
        api_key: apiKey,
        postedFrom: mmddyyyy(from),
        postedTo: mmddyyyy(to),
        ncode: code,
        ptype: "o,p,k",           // solicitations, presolicitations, combined synopsis
        limit: "100",
      });
      const res = await fetch(`https://api.sam.gov/opportunities/v2/search?${params}`);
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error?.message ?? out?.message ?? `SAM.gov error ${res.status}`);
      opps.push(...(out.opportunitiesData ?? []));
    }
  } catch (e) {
    return json(502, { ok: false, error: `SAM.gov fetch failed: ${String(e)}` });
  }

  // ── Map + dedupe/insert (same ladder as ingest-alerts) ──
  let inserted = 0, deduped = 0, filtered = 0, invalid = 0;
  const seen = new Set<string>();
  for (const o of opps) {
    const solId = o.solicitationNumber || o.noticeId;
    if (solId && seen.has(solId)) continue;   // cross-NAICS duplicates in one run
    if (solId) seen.add(solId);

    const title = (o.title ?? "").trim();
    const buyer = (o.fullParentPathName ?? o.department ?? o.organizationName ?? "").split(".")[0].trim();
    if (!title || !buyer) { invalid++; continue; }
    const state = (o.placeOfPerformance?.state?.code ?? o.officeAddress?.state ?? "").toUpperCase() || null;
    if (territories.length && state && !territories.includes(state)) { filtered++; continue; }

    const sourceUrl = o.uiLink ?? (o.noticeId ? `https://sam.gov/opp/${o.noticeId}/view` : null);
    let dupe = null;
    if (sourceUrl) {
      const { data } = await admin.from("opportunities").select("id").eq("source_url", sourceUrl).maybeSingle();
      dupe = data;
    }
    if (!dupe && solId) {
      const { data } = await admin.from("opportunities").select("id").eq("solicitation_id", solId).maybeSingle();
      dupe = data;
    }
    if (dupe) { deduped++; continue; }

    const { error } = await admin.from("opportunities").insert({
      solicitation_id: solId ?? null,
      source_id: "sam-gov",
      source_url: sourceUrl,
      title,
      buyer,
      state,
      territory: state,
      trades: ["security"],
      due_at: o.responseDeadLine ? new Date(o.responseDeadLine).toISOString() : null,
      poc: o.pointOfContact ?? null,
      raw: o,
      why: `SAM.gov ${o.type ?? "notice"} · NAICS ${o.naicsCode ?? "?"}`,
    });
    if (error) invalid++; else inserted++;
  }

  await admin.from("sources").update({
    last_checked: new Date().toISOString(), last_ok: true, last_error: null,
  }).eq("id", "sam-gov");

  return json(200, { ok: true, data: { fetched: opps.length, inserted, deduped, filtered, invalid, days } });
});
