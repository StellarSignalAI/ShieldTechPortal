// rippling-sync — two-way sync between ShieldTech time entries and Rippling.
// POST {direction?: 'push'|'pull'|'both'} with an Admin/Staff session or x-cron-secret.
//   Push: local 'approved' entries → Rippling POST /time-entries/ (idempotent).
//   Pull: Rippling workers/pay rates → rippling_workers; Rippling time-entry
//         status → local rows (PAID/FINALIZED ⇒ local status 'paid').
// All Rippling traffic goes through _shared/rippling.ts (HR instance
// credential: HR_RIPPLING_API_TOKEN with legacy RIPPLING_API_TOKEN fallback,
// SDK-verified paths, {results,next_link} pagination, categorized errors).
import { createClient } from "npm:@supabase/supabase-js@2";
import { RIPPLING_ENDPOINTS, RipplingError, ripplingConfigured, ripplingPaginate, ripplingRequest } from "../_shared/rippling.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

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

/* ── Pull: workers + pay rates ── */
async function pullWorkers(admin: ReturnType<typeof createClient>) {
  let upserted = 0;
  for await (const w of ripplingPaginate(RIPPLING_ENDPOINTS.workers, { instance: "hr" }) as AsyncGenerator<Record<string, any>>) {
    const email = w?.work_email ?? w?.user?.work_email ?? w?.email ?? null;
    let profileId: string | null = null;
    if (email) {
      const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      profileId = p?.id ?? null;
    }
    const rate = w?.compensation?.hourly_wage?.value ?? w?.compensation?.hourly_rate ?? null;
    const { error } = await admin.from("rippling_workers").upsert({
      rippling_worker_id: String(w.id),
      profile_id: profileId,
      name: w?.user?.display_name ?? w?.display_name ?? w?.name ?? null,
      email,
      pay_rate: rate != null ? Number(rate) : null,
      pay_currency: w?.compensation?.hourly_wage?.currency_type ?? "USD",
      employment_type: w?.employment_type ?? null,
      last_synced: new Date().toISOString(),
    });
    if (!error) upserted++;
  }
  return upserted;
}

/* ── Push: approved local entries → Rippling time entries ── */
async function pushEntries(admin: ReturnType<typeof createClient>) {
  const { data: entries } = await admin
    .from("time_entries")
    .select("id, tech_id, work_date, start_at, end_at, break_minutes, hours, job_ref, notes")
    .eq("status", "approved")
    .limit(200);
  let pushed = 0, skipped = 0, failed = 0;
  for (const e of entries ?? []) {
    const { data: w } = await admin
      .from("rippling_workers").select("rippling_worker_id").eq("profile_id", e.tech_id).maybeSingle();
    if (!w) {
      skipped++;
      await admin.from("time_entries").update({ sync_error: "No Rippling worker linked to this technician" }).eq("id", e.id);
      continue;
    }
    try {
      const payload: Record<string, unknown> = {
        worker_id: w.rippling_worker_id,
        status: "APPROVED",
        idempotency_key: e.id,
        comments: [e.job_ref, e.notes].filter(Boolean).join(" — ") || undefined,
      };
      if (e.start_at && e.end_at) {
        payload.job_shifts = [{ start_time: e.start_at, end_time: e.end_at }];
        if (e.break_minutes > 0) {
          const bStart = new Date(new Date(e.start_at).getTime() + 4 * 3600_000).toISOString();
          const bEnd = new Date(new Date(bStart).getTime() + e.break_minutes * 60_000).toISOString();
          payload.breaks = [{ start_time: bStart, end_time: bEnd }];
        }
      } else {
        payload.duration = Number(e.hours);
      }
      const created = await ripplingRequest(RIPPLING_ENDPOINTS.timeEntries, { method: "POST", body: JSON.stringify(payload), instance: "hr" }) as Record<string, any>;
      await admin.from("time_entries").update({
        status: "synced",
        rippling_entry_id: String(created?.id ?? ""),
        rippling_status: created?.status ?? "APPROVED",
        sync_error: null,
      }).eq("id", e.id);
      pushed++;
    } catch (err) {
      failed++;
      const msg = err instanceof RipplingError ? err.sanitized() : String(err).slice(0, 500);
      await admin.from("time_entries").update({ sync_error: msg }).eq("id", e.id);
    }
  }
  return { pushed, skipped, failed };
}

/* ── Pull: Rippling entry status back onto local rows ── */
async function pullStatuses(admin: ReturnType<typeof createClient>) {
  const { data: rows } = await admin
    .from("time_entries")
    .select("id, rippling_entry_id")
    .eq("status", "synced")
    .not("rippling_entry_id", "is", null)
    .limit(200);
  let updated = 0;
  for (const r of rows ?? []) {
    try {
      const remote = await ripplingRequest(RIPPLING_ENDPOINTS.timeEntry(String(r.rippling_entry_id)), { instance: "hr" }) as Record<string, any>;
      const rs = remote?.status ?? null;
      if (rs) {
        await admin.from("time_entries").update({
          rippling_status: rs,
          ...(rs === "PAID" || rs === "FINALIZED" ? { status: "paid" } : {}),
        }).eq("id", r.id);
        updated++;
      }
    } catch { /* keep last known status; next run retries */ }
  }
  return updated;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  if (!ripplingConfigured("hr")) {
    return json(503, { ok: false, error: "[RIPPLING_SECRET_MISSING] Rippling not configured for the hr instance (set HR_RIPPLING_API_TOKEN)", category: "RIPPLING_SECRET_MISSING" });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  if (!(await authorize(req, admin))) {
    return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });
  }

  let body: { direction?: string } = {};
  try { body = await req.json(); } catch { /* default both */ }
  const dir = body.direction ?? "both";

  try {
    const out: Record<string, unknown> = {};
    if (dir === "pull" || dir === "both") out.workers_upserted = await pullWorkers(admin);
    if (dir === "push" || dir === "both") Object.assign(out, await pushEntries(admin));
    if (dir === "pull" || dir === "both") out.statuses_updated = await pullStatuses(admin);
    return json(200, { ok: true, data: out });
  } catch (e) {
    const msg = e instanceof RipplingError ? e.sanitized() : String(e).slice(0, 400);
    return json(502, { ok: false, error: msg, category: e instanceof RipplingError ? e.category : "UNKNOWN" });
  }
});
