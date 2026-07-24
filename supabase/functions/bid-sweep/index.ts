// bid-sweep — scheduled AI sweep of every bid platform's PUBLIC listing page.
// POST (no body) with Admin/Staff session or x-cron-secret. For each source
// with a listing_url: fetch the page, strip to text, OpenAI-extracts low-voltage
// opportunities (CCTV, access control, fire, network, cabling), dedupes, and
// stores each lead with a link back to the platform (detail URL when the page
// exposes one, otherwise the platform's listing page).
import { createClient } from "npm:@supabase/supabase-js@2";
import { getRegions } from "../_shared/leadConfig.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EXTRACT_PROMPT = `You extract opportunities from a public page's text for a security integrator (CCTV/video surveillance, access control, intrusion alarm, fire alarm, low-voltage electrical, structured cabling, network infrastructure).
Capture TWO kinds of items:
1. Bid/RFP solicitations plausibly involving those trades (security, camera, CCTV, access, alarm, fire, low voltage, cabling, network, electronic safety).
2. GRANT / FUNDING PROGRAMS that pay for physical security equipment (e.g. nonprofit/house-of-worship security grants, school-safety grants, homeland-security grants). For a grant, the "buyer" is the funding body and "why" should note it's grant-funded security work ShieldTech can help applicants spec + install.
Ignore everything unrelated (roads, food, janitorial...).
Reply with JSON ONLY: {"alerts":[{"title":string,"buyer":string,"sourceUrl":string|null,"solicitationId":string|null,"state":two-letter string|null,"trades":string[],"value":number|null,"dueAt":ISO-8601 string|null,"why":string}]}
Rules: only items explicitly present in the text; never invent buyers, values, dates, or URLs; sourceUrl only if an absolute link appears in the text. Empty page → {"alerts":[]}.`;

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

const stripHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<a\s+[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, " $2 [link: $1] ")
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();

async function extract(apiKey: string, text: string, extraSystem = "") {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
      temperature: 0, response_format: { type: "json_object" },
      messages: [{ role: "system", content: EXTRACT_PROMPT + extraSystem }, { role: "user", content: text.slice(0, 30_000) }],
    }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out?.error?.message ?? `OpenAI ${res.status}`);
  const parsed = JSON.parse(out.choices?.[0]?.message?.content ?? "{}");
  return Array.isArray(parsed.alerts) ? parsed.alerts : [];
}

// deno-lint-ignore no-explicit-any
async function insertAlerts(admin: any, alerts: any[], sourceId: string, fallbackUrl: string) {
  let inserted = 0, deduped = 0;
  for (const a of alerts) {
    if (!a?.title?.trim() || !a?.buyer?.trim()) continue;
    const url = a.sourceUrl || fallbackUrl;
    let dupe = null;
    if (a.solicitationId) {
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
      solicitation_id: a.solicitationId ?? null, source_id: sourceId,
      source_url: url, title: a.title.trim(), buyer: a.buyer.trim(),
      state: a.state ?? null, territory: a.state ?? null, trades: a.trades ?? [],
      value_estimate: a.value ?? null, due_at: a.dueAt ?? null,
      why: a.why ?? `AI sweep of ${sourceId}`, raw: { from: "bid-sweep" },
    });
    if (!error) inserted++;
  }
  return { inserted, deduped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "OPENAI_API_KEY not configured" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  if (!(await authorize(req, admin))) return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });

  const regions = await getRegions(admin);
  const regionRule = `\nPRIORITY REGION: this integrator serves ${regions.join(", ")}. Prefer solicitations whose place of performance is in those states; you may still include a clearly high-value out-of-region item, but favor in-region. Grants/funding programs are national — include regardless of state.`;

  const { data: sources } = await admin.from("sources").select("id, listing_url").in("lane", ["bid", "grant"]).not("listing_url", "is", null);
  const results: Record<string, unknown>[] = [];
  for (const s of sources ?? []) {
    const now = new Date().toISOString();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(s.listing_url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (ShieldTech bid monitor)" } });
      clearTimeout(t);
      const text = stripHtml(await res.text());
      if (text.length < 200) throw new Error("page too small / blocked");
      const alerts = await extract(apiKey, text, regionRule);
      const r = await insertAlerts(admin, alerts, s.id, s.listing_url);
      await admin.from("sources").update({ last_checked: now, last_ok: true, last_error: null, last_found: r.inserted }).eq("id", s.id);
      results.push({ id: s.id, ...r, extracted: alerts.length });
    } catch (e) {
      await admin.from("sources").update({ last_checked: now, last_ok: false, last_error: String(e).slice(0, 300) }).eq("id", s.id);
      results.push({ id: s.id, error: String(e).slice(0, 120) });
    }
  }
  return json(200, { ok: true, data: { swept: results.length, results } });
});
