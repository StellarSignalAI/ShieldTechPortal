// bid-builder — AI bid construction for scraped opportunities.
//
// POST with Admin/Staff session or x-cron-secret:
//   {opportunityId}                  → (re)build the bid for one lead
//   {mode:"pending", limit?}         → build bids for leads that have none (cron)
//   {action:"proposal", bidId, tier} → generate the full proposal for a tier
//
// Build: reads the lead's source page (+ SAM.gov description via API when the
// lead came from sam-poll), prices against the qbo_items pricebook, and stores
// scope, line items, labor, and three pricing tiers (low/medium/aggressive).
// Every bid records its assumptions, missing info, and a confidence grade —
// the portal shows those next to the source URL for cross-referencing.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const LABOR_RATE = Number(Deno.env.get("BID_LABOR_RATE") ?? 145);
const TIER_MARGINS = { low: 0.18, medium: 0.30, aggressive: 0.42 };
const TIER_PITCH = {
  low: "Sharpest price — win-rate priority, lean scope, standard hardware.",
  medium: "Standard ShieldTech scope and margin — recommended baseline.",
  aggressive: "Premium scope and margin — top-tier hardware, extended warranty and service.",
};

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
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();

async function fetchText(url: string, timeoutMs = 15000): Promise<{ ok: boolean; text: string; note: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (ShieldTech bid builder)" } });
    clearTimeout(t);
    const ctype = res.headers.get("content-type") ?? "";
    if (!res.ok) return { ok: false, text: "", note: `HTTP ${res.status}` };
    if (/pdf|octet-stream|zip|msword/i.test(ctype)) return { ok: false, text: "", note: `binary attachment (${ctype.split(";")[0]}) — not parsed` };
    const body = await res.text();
    const text = /json/i.test(ctype) ? body : stripHtml(body);
    return { ok: true, text: text.slice(0, 24000), note: "fetched" };
  } catch (e) {
    return { ok: false, text: "", note: String(e).slice(0, 120) };
  }
}

async function openai(apiKey: string, system: string, user: string, asJson = true) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
      temperature: 0.2,
      ...(asJson ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out?.error?.message ?? `OpenAI ${res.status}`);
  return out.choices?.[0]?.message?.content ?? "";
}

const BUILD_PROMPT = `You are ShieldTech Solutions' senior estimator. ShieldTech is a licensed low-voltage security integrator (CCTV/video surveillance, access control, burglar/intrusion alarm, fire alarm, A/V, structured cabling, network infrastructure) serving NJ, PA, NY, MD, VA.
From the solicitation material provided, build the most complete bid the material supports.
Reply with JSON ONLY:
{"summary": string (3-5 sentence scope-of-work),
 "assumptions": string[] (every assumption you had to make),
 "exclusions": string[] (what this bid does NOT include),
 "missingInfo": string[] (information you could not obtain — attachments, drawings, walk-through details),
 "confidence": "high"|"medium"|"low" (high only if the material fully specifies the scope),
 "lineItems": [{"desc": string, "qty": number, "unit": string, "unitCost": number (contractor COST not sell price; use the pricebook when an item matches), "hours": number (install labor hours for the line, total not per unit)}],
 "laborHours": number (total labor incl. programming/commissioning/PM)}
Rules: quantities and items must be grounded in the solicitation text; where the text is silent, size a typical job of this kind for this buyer and record the assumption. Include permits/lifts/subcontract lines when clearly needed. Never invent contract values from thin air.`;

const PROPOSAL_PROMPT = `You write winning, professional proposals for ShieldTech Solutions LLC (licensed low-voltage security integrator — CCTV, access control, intrusion & fire alarm, A/V, structured cabling, network — serving NJ/PA/NY/MD/VA; 1234 Security Way, Philadelphia PA 19103; (215) 555-0100; billing@shieldtechsolutions.com; PA HIC #PA123456).
Produce the BODY CONTENT ONLY as clean HTML fragments (h2/h3/p/ul/table with inline styles kept minimal — no <html>, <head>, <body> tags) for a formal proposal with these sections:
1. Executive Summary  2. Understanding of Requirements  3. Scope of Work  4. Technical Approach  5. Project Schedule & Milestones  6. Pricing (a table of the line items provided, subtotal, and the single total price provided — present the price EXACTLY as given)  7. Assumptions & Exclusions  8. Why ShieldTech  9. Acceptance (signature block with name/title/date lines).
Professional, confident, specific to the solicitation. Never invent certifications, past-performance references, or customer names.`;

// deno-lint-ignore no-explicit-any
async function buildBid(admin: any, apiKey: string, opp: any) {
  await admin.from("bids").upsert(
    { opportunity_id: opp.id, status: "building", error: null },
    { onConflict: "opportunity_id" },
  );

  // ── Gather every readable source ──
  const docs: { url: string; fetched: boolean; note: string }[] = [];
  let material = `SOLICITATION RECORD\nTitle: ${opp.title}\nBuyer: ${opp.buyer}\nState: ${opp.state ?? "?"}\nDue: ${opp.due_at ?? "?"}\nTrades: ${(opp.trades ?? []).join(", ")}\nContext: ${opp.why ?? ""}\n`;

  if (opp.source_url) {
    const r = await fetchText(opp.source_url);
    docs.push({ url: opp.source_url, fetched: r.ok, note: r.note });
    if (r.ok) material += `\nSOURCE PAGE (${opp.source_url}):\n${r.text}\n`;
  }
  // SAM.gov leads: the raw record carries a description API link + attachments.
  const raw = opp.raw ?? {};
  if (raw.description && /^https?:/.test(String(raw.description))) {
    let key = Deno.env.get("SAM_GOV_API_KEY") ?? "";
    if (!key) { const { data } = await admin.rpc("get_sam_gov_api_key"); key = data ?? ""; }
    if (key) {
      const r = await fetchText(`${raw.description}${String(raw.description).includes("?") ? "&" : "?"}api_key=${key}`);
      docs.push({ url: String(raw.description), fetched: r.ok, note: r.ok ? "SAM.gov description" : r.note });
      if (r.ok) material += `\nSAM.GOV FULL DESCRIPTION:\n${stripHtml(r.text)}\n`;
    }
  }
  for (const link of (raw.resourceLinks ?? []).slice(0, 5)) {
    const r = await fetchText(String(link));
    docs.push({ url: String(link), fetched: r.ok, note: r.ok ? "attachment text" : r.note });
    if (r.ok) material += `\nATTACHMENT (${link}):\n${r.text.slice(0, 8000)}\n`;
  }

  // ── Pricebook context ──
  const { data: items } = await admin.from("qbo_items")
    .select("name, description, unit_price, type").eq("active", true).limit(80);
  const pricebook = (items ?? [])
    .map((i: any) => `${i.name} — $${Number(i.unit_price) || 0}${i.type ? ` (${i.type})` : ""}`)
    .join("\n");

  // ── AI build ──
  const parsed = JSON.parse(await openai(
    apiKey,
    BUILD_PROMPT,
    `${material.slice(0, 60000)}\n\nSHIELDTECH PRICEBOOK (use these costs when items match):\n${pricebook}\n\nLabor rate: $${LABOR_RATE}/hr.`,
  ));

  const lineItems = Array.isArray(parsed.lineItems) ? parsed.lineItems.filter((l: any) => l?.desc) : [];
  const materialCost = lineItems.reduce((s: number, l: any) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0);
  const lineHours = lineItems.reduce((s: number, l: any) => s + (Number(l.hours) || 0), 0);
  const laborHours = Math.max(Number(parsed.laborHours) || 0, lineHours);
  const cost = materialCost + laborHours * LABOR_RATE;

  const tier = (m: number) => Math.max(50, Math.round(cost / (1 - m) / 50) * 50);
  const tiers = Object.fromEntries(Object.entries(TIER_MARGINS).map(([k, m]) => [k, {
    price: tier(m), marginPct: Math.round(m * 100), pitch: TIER_PITCH[k as keyof typeof TIER_PITCH],
  }]));

  const scope = {
    summary: parsed.summary ?? "", assumptions: parsed.assumptions ?? [],
    exclusions: parsed.exclusions ?? [], missingInfo: parsed.missingInfo ?? [],
    confidence: parsed.confidence ?? "low",
  };
  await admin.from("bids").update({
    status: "ready", scope, line_items: lineItems, labor_hours: laborHours,
    labor_rate: LABOR_RATE, material_cost: materialCost, cost_total: cost,
    tiers, docs_read: docs, built_at: new Date().toISOString(), error: null,
  }).eq("opportunity_id", opp.id);

  return { opportunityId: opp.id, cost, tiers, confidence: scope.confidence };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "OPENAI_API_KEY not configured" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  if (!(await authorize(req, admin))) return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try { body = await req.json(); } catch { /* fine */ }

  try {
    // ── Generate the full proposal for a chosen tier ──
    if (body.action === "proposal") {
      const { data: bid } = await admin.from("bids").select("*, opportunities(*)").eq("id", body.bidId).maybeSingle();
      if (!bid) return json(404, { ok: false, error: "bid not found" });
      const tierKey = ["low", "medium", "aggressive"].includes(body.tier) ? body.tier : "medium";
      const t = bid.tiers?.[tierKey];
      if (!t) return json(400, { ok: false, error: "bid has no tiers yet — build it first" });
      const opp = bid.opportunities;
      const lines = (bid.line_items ?? []).map((l: { desc: string; qty: number; unit?: string }) =>
        `- ${l.desc} — qty ${l.qty}${l.unit ? " " + l.unit : ""}`).join("\n");
      const bodyHtml = await openai(apiKey, PROPOSAL_PROMPT,
        `Solicitation: ${opp.title}\nBuyer: ${opp.buyer}\nState: ${opp.state ?? ""}\nDue: ${opp.due_at ?? ""}\nSource: ${opp.source_url ?? ""}\n\nScope summary: ${bid.scope?.summary ?? ""}\nAssumptions: ${(bid.scope?.assumptions ?? []).join("; ")}\nExclusions: ${(bid.scope?.exclusions ?? []).join("; ")}\n\nLine items (present these in the pricing table WITHOUT per-line prices — one total only):\n${lines}\n\nTOTAL PRICE (${tierKey} tier): $${Number(t.price).toLocaleString()}\nLabor included: ${bid.labor_hours} hours.`,
        false);
      const proposalHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Proposal — ${opp.title}</title>
<style>body{font-family:Georgia,'Times New Roman',serif;max-width:760px;margin:0 auto;padding:48px 40px;color:#1a2330;line-height:1.55}
h1{font-size:24px;margin:0}h2{font-size:17px;border-bottom:2px solid #1d5c96;padding-bottom:4px;margin-top:28px;color:#123a5f}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:7px 10px;border-bottom:1px solid #d8dee6;text-align:left}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d5c96;padding-bottom:18px;margin-bottom:8px}
.brand{font-size:20px;font-weight:700;color:#123a5f}.meta{font-size:12px;color:#54636f;text-align:right}</style></head><body>
<div class="head"><div><div class="brand">ShieldTech Solutions LLC</div><div style="font-size:12px;color:#54636f">Security · Monitoring · Service · PA HIC #PA123456</div></div>
<div class="meta">1234 Security Way, Philadelphia, PA 19103<br/>(215) 555-0100 · billing@shieldtechsolutions.com<br/>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div></div>
<h1>Proposal — ${opp.title}</h1>
<p style="font-size:13px;color:#54636f">Prepared for ${opp.buyer}${opp.state ? " · " + opp.state : ""} · Tier: ${tierKey.toUpperCase()} · Ref: ${opp.solicitation_id ?? opp.id}</p>
${bodyHtml}
</body></html>`;
      await admin.from("bids").update({
        status: "proposal", selected_tier: tierKey, proposal_html: proposalHtml,
        proposal_at: new Date().toISOString(),
      }).eq("id", bid.id);
      return json(200, { ok: true, data: { bidId: bid.id, tier: tierKey, proposalHtml } });
    }

    // ── Build one ──
    if (body.opportunityId) {
      const { data: opp } = await admin.from("opportunities").select("*").eq("id", body.opportunityId).maybeSingle();
      if (!opp) return json(404, { ok: false, error: "opportunity not found" });
      const r = await buildBid(admin, apiKey, opp).catch(async (e) => {
        await admin.from("bids").upsert({ opportunity_id: opp.id, status: "error", error: String(e).slice(0, 400) }, { onConflict: "opportunity_id" });
        throw e;
      });
      return json(200, { ok: true, data: r });
    }

    // ── Build all leads with no bid yet (cron) ──
    const limit = Math.min(Number(body.limit) || 10, 25);
    const { data: opps } = await admin
      .from("opportunities")
      .select("*, bids(id)")
      .in("status", ["fresh", "accepted"])
      .order("created_at", { ascending: false })
      .limit(200);
    const todo = (opps ?? []).filter((o: { bids: unknown[] }) => !(o.bids && o.bids.length)).slice(0, limit);
    const results: Record<string, unknown>[] = [];
    for (const opp of todo) {
      try { results.push(await buildBid(admin, apiKey, opp)); }
      catch (e) {
        await admin.from("bids").upsert({ opportunity_id: opp.id, status: "error", error: String(e).slice(0, 400) }, { onConflict: "opportunity_id" });
        results.push({ opportunityId: opp.id, error: String(e).slice(0, 120) });
      }
    }
    return json(200, { ok: true, data: { built: results.length, results } });
  } catch (e) {
    return json(500, { ok: false, error: String(e).slice(0, 400) });
  }
});
