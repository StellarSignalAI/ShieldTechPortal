// ingest-report-text — raw BD report text → OpenAI extraction → alert pipeline.
// POST {text: "..."} with an Admin/Staff session or x-cron-secret header.
// Fails whole-cloth on extraction problems: no partial/fabricated records.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type AlertIn = {
  title?: string; buyer?: string; sourceId?: string; sourceUrl?: string; solicitationId?: string;
  state?: string; trades?: string[]; value?: number; dueAt?: string; why?: string; raw?: unknown;
};

const EXTRACT_PROMPT = `You extract government/commercial bid opportunities from business-development report text for a security integrator (CCTV, access control, alarm, fire, low-voltage).
Reply with JSON ONLY in this exact shape: {"alerts": [{"title": string, "buyer": string, "sourceUrl": string|null, "solicitationId": string|null, "state": two-letter string|null, "trades": string[], "value": number|null, "dueAt": ISO-8601 string|null, "why": string}]}
Rules: only include opportunities explicitly present in the text. Never invent buyers, values, dates, or URLs. If the text contains no opportunities, reply {"alerts": []}.`;

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

function passesFilters(a: AlertIn): boolean {
  const territories = (Deno.env.get("TERRITORIES") ?? "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const trades = (Deno.env.get("TRADES") ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (territories.length && a.state && !territories.includes(a.state.toUpperCase())) return false;
  if (trades.length && a.trades?.length && !a.trades.some(t => trades.includes(t.toLowerCase()))) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "OPENAI_API_KEY not configured" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  if (!(await authorize(req, admin))) {
    return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });
  }

  let body: { text?: string };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  const text = (body.text ?? "").trim();
  if (text.length < 20) return json(400, { ok: false, error: "text too short" });

  // ── Extraction ──
  let alerts: AlertIn[];
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACT_PROMPT },
          { role: "user", content: text.slice(0, 40_000) },
        ],
      }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.error?.message ?? `OpenAI error ${res.status}`);
    const parsed = JSON.parse(out.choices?.[0]?.message?.content ?? "{}");
    if (!Array.isArray(parsed.alerts)) throw new Error("Extraction returned no alerts array");
    alerts = parsed.alerts;
  } catch (e) {
    // Whole-cloth failure — never insert partial or guessed records.
    return json(502, { ok: false, error: `Extraction failed: ${String(e)}` });
  }

  // ── Same pipeline as ingest-alerts ──
  let inserted = 0, deduped = 0, filtered = 0, invalid = 0;
  for (const a of alerts) {
    if (!a?.title?.trim() || !a?.buyer?.trim()) { invalid++; continue; }
    if (!passesFilters(a)) { filtered++; continue; }
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
      source_url: a.sourceUrl ?? null,
      title: a.title.trim(), buyer: a.buyer.trim(),
      state: a.state ?? null, territory: a.state ?? null,
      trades: a.trades ?? [], value_estimate: a.value ?? null,
      due_at: a.dueAt ?? null, why: a.why ?? null,
      raw: { from: "ingest-report-text" },
    });
    if (error) invalid++; else inserted++;
  }
  return json(200, { ok: true, data: { extracted: alerts.length, inserted, deduped, filtered, invalid } });
});
