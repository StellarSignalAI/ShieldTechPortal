// ingest-email — hands-free lane: portal alert emails auto-ingest as leads.
// Point a Resend/Mailgun/SendGrid INBOUND webhook at this function's URL with
// ?secret=<CRON_SECRET>. Forward every bid-alert email to your inbound address
// (e.g. bids@shieldtechsolutions.com) — the AI extracts the opportunities and
// each lead links back to the platform (links in the email are preserved).
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const EXTRACT_PROMPT = `You extract bid/RFP opportunities from a procurement alert EMAIL for a security integrator (CCTV, access control, intrusion/fire alarm, low-voltage, structured cabling, network).
Reply JSON ONLY: {"alerts":[{"title":string,"buyer":string,"sourceUrl":string|null,"solicitationId":string|null,"state":two-letter string|null,"trades":string[],"value":number|null,"dueAt":ISO-8601 string|null,"why":string}]}
Use links present in the email as sourceUrl. Never invent anything. No opportunities → {"alerts":[]}.`;

const SENDER_SOURCE: Record<string, string> = {
  "sam.gov": "sam-gov", "gsa.gov": "gsa-ebuy", "dla.mil": "dla-dibbs", "eva.virginia.gov": "eva-virginia",
  "maryland.gov": "emma-maryland", "njstart.gov": "njstart", "state.pa.us": "pa-emarketplace",
  "bonfirehub.com": "penn-bid", "nyscr.ny.gov": "nyscr", "dasny.org": "dasny", "bidnetdirect.com": "camelot",
};

const stripHtml = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<a\s+[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, " $2 [link: $1] ")
      .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  const secret = Deno.env.get("CRON_SECRET");
  const url = new URL(req.url);
  if (!secret || (url.searchParams.get("secret") !== secret && req.headers.get("x-cron-secret") !== secret)) {
    return json(401, { ok: false, error: "secret required" });
  }
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "OPENAI_API_KEY not configured" });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }
  // Field names across Resend/Mailgun/SendGrid inbound payloads
  const from = String(body.from ?? body.sender ?? (body as any).envelope?.from ?? "");
  const subject = String(body.subject ?? "");
  const text = String(body.text ?? (body as any)["body-plain"] ?? "") || stripHtml(String(body.html ?? (body as any)["body-html"] ?? ""));
  if (text.length < 30) return json(400, { ok: false, error: "empty email body" });

  const sourceId = Object.entries(SENDER_SOURCE).find(([dom]) => from.includes(dom))?.[1] ?? null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
      temperature: 0, response_format: { type: "json_object" },
      messages: [{ role: "system", content: EXTRACT_PROMPT }, { role: "user", content: `Subject: ${subject}\nFrom: ${from}\n\n${text.slice(0, 30_000)}` }],
    }),
  });
  const out = await res.json();
  if (!res.ok) return json(502, { ok: false, error: out?.error?.message ?? "extraction failed" });
  let alerts: any[] = [];
  try { alerts = JSON.parse(out.choices?.[0]?.message?.content ?? "{}").alerts ?? []; } catch { /* none */ }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  let inserted = 0, deduped = 0;
  for (const a of alerts) {
    if (!a?.title?.trim() || !a?.buyer?.trim()) continue;
    let dupe = null;
    if (a.sourceUrl) { const { data } = await admin.from("opportunities").select("id").eq("source_url", a.sourceUrl).maybeSingle(); dupe = data; }
    if (!dupe && a.solicitationId) { const { data } = await admin.from("opportunities").select("id").eq("solicitation_id", a.solicitationId).maybeSingle(); dupe = data; }
    if (!dupe) {
      const q = admin.from("opportunities").select("id").eq("title", a.title).eq("buyer", a.buyer);
      const { data } = a.dueAt ? await q.eq("due_at", a.dueAt).maybeSingle() : await q.is("due_at", null).maybeSingle();
      dupe = data;
    }
    if (dupe) { deduped++; continue; }
    const { error } = await admin.from("opportunities").insert({
      solicitation_id: a.solicitationId ?? null, source_id: sourceId, source_url: a.sourceUrl ?? null,
      title: a.title.trim(), buyer: a.buyer.trim(), state: a.state ?? null, territory: a.state ?? null,
      trades: a.trades ?? [], value_estimate: a.value ?? null, due_at: a.dueAt ?? null,
      why: a.why ?? `Email alert: ${subject}`.slice(0, 300), raw: { from: "ingest-email", sender: from },
    });
    if (!error) inserted++;
  }
  return json(200, { ok: true, data: { extracted: alerts.length, inserted, deduped, source: sourceId } });
});
