// rippling-sync — two-way sync between ShieldTech time entries and Rippling.
// POST {direction?: 'push'|'pull'|'both'} with an Admin/Staff session or x-cron-secret.
//   Push: local 'approved' entries → Rippling POST /time-entries (idempotent).
//   Pull: Rippling workers/pay rates → rippling_workers; Rippling time-entry
//         status → local rows (PAID/FINALIZED ⇒ local status 'paid').
// Requires RIPPLING_API_TOKEN (Rippling → Settings → API access). 503 when absent.
import { createClient } from "npm:@supabase/supabase-js@2";

const RIPPLING_BASE = Deno.env.get("RIPPLING_API_BASE") ?? "https://rest.ripplingapis.com";

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

async function rippling(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${RIPPLING_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Rippling ${path} → ${res.status}: ${body?.message ?? JSON.stringify(body).slice(0, 200)}`);
  return body;
}

/* ── Pull: workers + pay rates ── */
async function pullWorkers(token: string, admin: ReturnType<typeof createClient>) {
  let upserted = 0;
  let cursor: string | null = null;
  do {
    const page = await rippling(token, `/workers?limit=100${cursor ? `&cursor=${cursor}` : ""}`);
    const workers = page?.results ?? page?.data ?? [];
    for (const w of workers) {
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
    cursor = page?.next_cursor ?? null;
  } while (cursor);
  return upserted;
}

/* ── Push: approved local entries → Rippling time entries ── */
async function pushEntries(token: string, admin: ReturnType<typeof createClient>) {
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
      const created = await rippling(token, "/time-entries", { method: "POST", body: JSON.stringify(payload) });
      await admin.from("time_entries").update({
        status: "synced",
        rippling_entry_id: String(created?.id ?? ""),
        rippling_status: created?.status ?? "APPROVED",
        sync_error: null,
      }).eq("id", e.id);
      pushed++;
    } catch (err) {
      failed++;
      await admin.from("time_entries").update({ sync_error: String(err).slice(0, 500) }).eq("id", e.id);
    }
  }
  return { pushed, skipped, failed };
}

/* ── Pull: Rippling entry status back onto local rows ── */
async function pullStatuses(token: string, admin: ReturnType<typeof createClient>) {
  const { data: rows } = await admin
    .from("time_entries")
    .select("id, rippling_entry_id")
    .eq("status", "synced")
    .not("rippling_entry_id", "is", null)
    .limit(200);
  let updated = 0;
  for (const r of rows ?? []) {
    try {
      const remote = await rippling(token, `/time-entries/${r.rippling_entry_id}`);
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

  const token = Deno.env.get("RIPPLING_API_TOKEN");
  if (!token) return json(503, { ok: false, error: "RIPPLING_API_TOKEN not configured" });

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
    if (dir === "pull" || dir === "both") out.workers_upserted = await pullWorkers(token, admin);
    if (dir === "push" || dir === "both") Object.assign(out, await pushEntries(token, admin));
    if (dir === "pull" || dir === "both") out.statuses_updated = await pullStatuses(token, admin);
    return json(200, { ok: true, data: out });
  } catch (e) {
    return json(502, { ok: false, error: String(e) });
  }
});
