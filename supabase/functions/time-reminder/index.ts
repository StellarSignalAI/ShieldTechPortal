// time-reminder — Friday cron: emails every technician who hasn't SUBMITTED
// any time entries for the current week (Mon–Fri). Drafts don't count — the
// email calls them out so the tech knows to hit Submit.
// Invoked by pg_cron with x-cron-secret; office roles may also trigger it
// manually (e.g. for a test run). POST {} — optional {dryRun:true} returns
// who WOULD be emailed without sending.
import { createClient } from "npm:@supabase/supabase-js@2";
import { timesheetReminderEmail } from "../_shared/email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Week window in the company's timezone (America/New_York): Monday..Friday of
// the week containing "now".
function weekWindow(): { start: string; end: string; label: string } {
  const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dow = (nowET.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(nowET); monday.setDate(nowET.getDate() - dow);
  const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const label = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${friday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return { start: iso(monday), end: iso(friday), label: `the week of ${label}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const cron = Deno.env.get("CRON_SECRET");
  const isCron = Boolean(cron && req.headers.get("x-cron-secret") === cron);
  if (!isCron) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    let role: string | null = null;
    if (jwt) {
      const { data } = await admin.auth.getUser(jwt);
      if (data?.user) {
        const { data: prof } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        role = prof?.role ?? null;
      }
    }
    if (!["Admin", "Staff", "Manager"].includes(role ?? "")) return json(403, { ok: false, error: "cron or office role required" });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json(503, { ok: false, error: "RESEND_API_KEY not configured" });

  let body: { dryRun?: boolean } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const { start, end, label } = weekWindow();

  const { data: techs, error: techErr } = await admin
    .from("profiles").select("id,name,email").eq("role", "Technician");
  if (techErr) return json(500, { ok: false, error: techErr.message });

  const { data: entries, error: entErr } = await admin
    .from("time_entries").select("tech_id,status")
    .gte("work_date", start).lte("work_date", end);
  if (entErr) return json(500, { ok: false, error: entErr.message });

  const SUBMITTED = new Set(["submitted", "approved", "synced", "paid"]);
  const submittedBy = new Set<string>();
  const draftsBy = new Map<string, number>();
  for (const e of entries ?? []) {
    if (SUBMITTED.has(String(e.status))) submittedBy.add(e.tech_id);
    else draftsBy.set(e.tech_id, (draftsBy.get(e.tech_id) ?? 0) + 1);
  }

  const pending = (techs ?? []).filter((t) => t.email && !submittedBy.has(t.id));
  if (body.dryRun) {
    return json(200, { ok: true, week: { start, end }, wouldRemind: pending.map((t) => ({ name: t.name, email: t.email, drafts: draftsBy.get(t.id) ?? 0 })) });
  }

  const from = Deno.env.get("INVITE_FROM_EMAIL") ?? "ShieldTech Security <no-reply@shieldtechsolutions.com>";
  const results: Array<{ email: string; ok: boolean; error?: string }> = [];
  for (const t of pending) {
    const mail = timesheetReminderEmail({ name: t.name, weekLabel: label, draftCount: draftsBy.get(t.id) ?? 0 });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [t.email], subject: mail.subject, html: mail.html, text: mail.text }),
    });
    const out = await res.json().catch(() => ({}));
    results.push({ email: t.email, ok: res.ok, error: res.ok ? undefined : (out?.message ?? `Resend ${res.status}`) });
  }

  return json(200, { ok: true, week: { start, end }, reminded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok), skippedSubmitted: (techs ?? []).length - pending.length });
});
