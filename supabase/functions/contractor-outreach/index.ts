// contractor-outreach — scheduled AI sweep of PUBLIC state electrical-contractor
// license directories (lane='contractor'). For each source: fetch the public
// results page, AI-extracts contractor company records, drops any company on the
// NECA/IBEW signatory list (public.union_contractors), and stores each remaining
// NON-UNION electrical contractor as an outreach opportunity — a lead to cold-call
// and pitch subcontracting our low-voltage / Div 28 scope. Shows on the Bid Board
// and Secret Weapon next to bids.
// POST (no body) with Admin/Staff session or x-cron-secret.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EXTRACT_PROMPT = `You extract ELECTRICAL CONTRACTOR company records from a US state licensing directory's public results page text.
Reply with JSON ONLY: {"contractors":[{"name":string,"licenseId":string|null,"city":string|null,"state":two-letter string|null,"phone":string|null,"sourceUrl":string|null}]}
Rules: only companies explicitly present in the text; a "name" is required; never invent license numbers, phones, or URLs; sourceUrl only if an absolute link appears in the text. Skip individuals that are clearly not a company (bare person names with no business). Empty page → {"contractors":[]}.`;

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

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

async function extract(apiKey: string, text: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
      temperature: 0, response_format: { type: "json_object" },
      messages: [{ role: "system", content: EXTRACT_PROMPT }, { role: "user", content: text.slice(0, 30_000) }],
    }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out?.error?.message ?? `OpenAI ${res.status}`);
  const parsed = JSON.parse(out.choices?.[0]?.message?.content ?? "{}");
  return Array.isArray(parsed.contractors) ? parsed.contractors : [];
}

// deno-lint-ignore no-explicit-any
async function insertContractors(admin: any, rows: any[], sourceId: string, fallbackUrl: string, unionNorms: Set<string>) {
  let inserted = 0, deduped = 0, excludedUnion = 0;
  for (const c of rows) {
    const name = (c?.name ?? "").trim();
    if (!name) continue;
    const cn = norm(name);
    // Union exclusion: drop if the normalized name contains, or is contained by,
    // any signatory name (handles "Rosendin" vs "Rosendin Electric Inc").
    if ([...unionNorms].some((u) => u && (cn.includes(u) || u.includes(cn)))) { excludedUnion++; continue; }

    const buyer = name;                                   // the contractor is who we pitch
    const title = `Outreach: ${name}${c.city ? " — " + c.city : ""}`;
    // Dedupe on (title, buyer, null due) — same ladder the Bid Board uses.
    const { data: dupe } = await admin.from("opportunities")
      .select("id").eq("title", title).eq("buyer", buyer).is("due_at", null).maybeSingle();
    if (dupe) { deduped++; continue; }

    const { error } = await admin.from("opportunities").insert({
      source_id: sourceId, source_url: c.sourceUrl || fallbackUrl,
      title, buyer, state: c.state ?? null, territory: c.state ?? null,
      trades: ["Electrical", "Low Voltage"], value_estimate: null, due_at: null,
      why: "Non-union electrical contractor — cold-call to pitch subcontracting our low-voltage / Div 28 scope on their jobs.",
      poc: c.phone ? { phone: c.phone } : null,
      raw: { from: "contractor-outreach", licenseId: c.licenseId ?? null, city: c.city ?? null },
    });
    if (!error) inserted++;
  }
  return { inserted, deduped, excludedUnion };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "OPENAI_API_KEY not configured" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  if (!(await authorize(req, admin))) return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });

  const { data: unionRows } = await admin.from("union_contractors").select("norm");
  const unionNorms = new Set<string>((unionRows ?? []).map((r: { norm: string }) => r.norm).filter(Boolean));

  const { data: sources } = await admin.from("sources").select("id, listing_url").eq("lane", "contractor").not("listing_url", "is", null);
  const results: Record<string, unknown>[] = [];
  for (const s of sources ?? []) {
    const now = new Date().toISOString();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(s.listing_url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (ShieldTech contractor scout)" } });
      clearTimeout(t);
      const text = stripHtml(await res.text());
      if (text.length < 200) throw new Error("page too small / blocked (directory may need a results URL with query params)");
      const rows = await extract(apiKey, text);
      const r = await insertContractors(admin, rows, s.id, s.listing_url, unionNorms);
      await admin.from("sources").update({ last_checked: now, last_ok: true, last_error: null, last_found: r.inserted }).eq("id", s.id);
      results.push({ id: s.id, ...r, extracted: rows.length });
    } catch (e) {
      await admin.from("sources").update({ last_checked: now, last_ok: false, last_error: String(e).slice(0, 300) }).eq("id", s.id);
      results.push({ id: s.id, error: String(e).slice(0, 120) });
    }
  }
  return json(200, { ok: true, data: { swept: results.length, results } });
});
