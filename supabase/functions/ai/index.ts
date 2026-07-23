// ai — the single ShieldTech AI service layer (OpenAI-backed).
// POST {action:'status'}                  → {ok, data:{configured, model}}
// POST {feature, messages, context?}      → {ok, data:{text, model}}
// Auth: signed-in user required for chat; status is public (no key exposure).
// Response shape follows the platform API contract: {ok, data|error}.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const BASE_RULES =
  "You are ShieldTech AI, the assistant inside ShieldTech Solutions' security-integrator platform " +
  "(CCTV, access control, alarm, fire, low-voltage). Be concise, concrete, and honest about missing data. " +
  "Never invent customers, invoices, jobs, or numbers that are not in the provided context — if the context " +
  "is empty, say the workspace has no data for that yet and explain what to do next. " +
  "When a diagram would communicate better than prose — a wiring/riser diagram, network topology, site " +
  "floor flow, process/approval flowchart, org chart, Gantt-style schedule, or sequence of events — include " +
  "it as a fenced ```mermaid code block using valid Mermaid syntax (flowchart, sequenceDiagram, gantt, " +
  "mindmap, etc.). The app renders these as real visuals. Keep labels short; put any explanation outside the block.";

const FEATURES: Record<string, string> = {
  assistant: BASE_RULES + " You answer questions across customers, tickets, jobs, monitoring and bids.",
  finance: BASE_RULES + " You are the Financial Co-pilot: books, cash flow, AR/AP, profitability, collections. " +
    "When asked for drafts (reminders, journal entries) produce them ready to send.",
  "tech-copilot": BASE_RULES + " You assist field technicians: wiring, RTSP/ONVIF, panel programming, " +
    "diagnostics. Prefer step-by-step runbooks. Cite the device/manual you are drawing on when known.",
  concierge: BASE_RULES + " You are the customer-facing concierge for a ShieldTech client. You can propose " +
    "actions (book a visit, bypass a zone, explain an alarm) as suggestions the platform will confirm.",
  bid: BASE_RULES + " You support the bid engine: scope narratives, conflict explanations, go/no-go " +
    "recommendations, and proposal cover drafts from the structured bid data provided.",
  digest: BASE_RULES + " You write crisp operational digests from the structured data provided.",
  extract: "You extract structured data exactly as instructed and reply with JSON only.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

  let body: {
    action?: string;
    feature?: string;
    messages?: Array<{ role: string; content: string }>;
    context?: unknown;
  };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }

  if (body.action === "status") {
    return json(200, { ok: true, data: { configured: Boolean(apiKey), model: apiKey ? model : null } });
  }

  if (!apiKey) return json(503, { ok: false, error: "OPENAI_API_KEY not configured" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller } = jwt ? await admin.auth.getUser(jwt) : { data: null };
  if (!caller?.user) return json(401, { ok: false, error: "Sign in to use ShieldTech AI" });

  // Basic rate limit: 30 runs / 5 minutes / user (via ai_runs table).
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const { count } = await admin
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", caller.user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 30) return json(429, { ok: false, error: "Rate limit — try again in a few minutes" });

  const feature = body.feature ?? "assistant";
  const system = FEATURES[feature] ?? FEATURES.assistant;
  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (!messages.length) return json(400, { ok: false, error: "messages required" });

  const contextBlock = body.context
    ? [{ role: "system", content: "Workspace context (JSON):\n" + JSON.stringify(body.context).slice(0, 24_000) }]
    : [];

  const payload = {
    model,
    messages: [{ role: "system", content: system }, ...contextBlock, ...messages],
    max_tokens: 900,
    temperature: feature === "extract" ? 0 : 0.4,
  };

  let text = "";
  let ok = true;
  let errMsg: string | null = null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (!res.ok) { ok = false; errMsg = out?.error?.message ?? `OpenAI error ${res.status}`; }
    else text = out.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    ok = false; errMsg = String(e);
  }

  await admin.from("ai_runs").insert({
    user_id: caller.user.id,
    feature,
    model,
    prompt_chars: JSON.stringify(payload.messages).length,
    completion_chars: text.length,
    ok,
    error: errMsg,
  });

  if (!ok) return json(502, { ok: false, error: errMsg });
  return json(200, { ok: true, data: { text, model } });
});
