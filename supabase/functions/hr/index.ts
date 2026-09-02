// hr — server-side API for the Rippling HR / Payroll / BI system.
// POST { action, ... } with an office (Admin/Staff/Manager) session, or
// x-cron-secret for scheduled work. All Rippling traffic goes through
// _shared/rippling.ts; the token never reaches the browser.
//
// Actions
//   status                            connection, flags, recent sync runs
//   set_flags {flags}                 Admin — feature flags (dangerous writes default OFF)
//   sync_workers {email?}             pull Rippling workers → rippling_workers (full or one)
//   link_worker {workerId, profileId} Admin — manual employee↔worker link
//   exceptions_run {weeks?}           compute payroll exceptions
//   payroll_prepare {periodStart, periodEnd}  build + store a payroll snapshot
//   action_approve|action_reject|action_execute {id}  Admin — proposed-action lifecycle
//   metrics_run                       compute financial metric snapshots (+ recommendations if enabled)
//   brief                             daily business brief (grounded, provenance-carrying)
//
// PAYROLL SAFETY: nothing here submits payroll or changes compensation in
// Rippling. Approval is recorded server-side from the authenticated JWT; an
// "approved" flag in a request body is ignored. Execution of hire/payroll
// kinds produces a validated hand-off package + deep link into Rippling —
// no undocumented endpoint is ever called (see docs/rippling-integration.md).
import { createClient } from "npm:@supabase/supabase-js@2";
import { RIPPLING_ENDPOINTS, RipplingError, ripplingConfigured, ripplingCredentialStatus, ripplingPaginate, ripplingRequest } from "../_shared/rippling.ts";
import { summarizePayrollRuns } from "../_shared/payroll-runs.ts";
import { nyToday } from "../_shared/dates.ts";

type Admin = ReturnType<typeof createClient>;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface Caller { id: string | null; name: string; role: string; cron: boolean }

async function authenticate(req: Request, admin: Admin): Promise<Caller | null> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) {
    return { id: null, name: "cron", role: "Cron", cron: true };
  }
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return null;
  const { data: p } = await admin.from("profiles").select("name,role").eq("id", data.user.id).maybeSingle();
  if (!p || !["Admin", "Staff", "Manager"].includes(p.role ?? "")) return null;
  return { id: data.user.id, name: p.name ?? data.user.email ?? "", role: p.role, cron: false };
}

async function audit(admin: Admin, caller: Caller, action: string, subjectType?: string, subjectId?: string, details?: Record<string, unknown>) {
  await admin.from("audit_events").insert({
    actor: caller.id, actor_name: caller.name, actor_role: caller.role,
    action, subject_type: subjectType ?? null, subject_id: subjectId ?? null,
    details: details ?? {},
  });
}

async function getFlags(admin: Admin): Promise<Record<string, boolean>> {
  const { data } = await admin.from("integration_connections").select("config").eq("provider", "rippling").maybeSingle();
  return (data?.config ?? {}) as Record<string, boolean>;
}

/* ── Worker sync ─────────────────────────────────────────────────────────── */
async function syncWorkers(admin: Admin, caller: Caller, onlyEmail?: string) {
  const { data: run } = await admin.from("integration_sync_runs").insert({
    provider: "rippling", kind: onlyEmail ? "worker" : "workers", triggered_by: caller.id ?? "cron",
  }).select().single();
  const stats = { seen: 0, upserted: 0, linked: 0, conflicts: 0 };
  try {
    for await (const w of ripplingPaginate(RIPPLING_ENDPOINTS.workers, { instance: "hr" })) {
      const email = String(
        (w as Record<string, Record<string, unknown>>)?.work_email ??
        (w?.user as Record<string, unknown>)?.work_email ?? w?.email ?? "",
      ).toLowerCase() || null;
      if (onlyEmail && email !== onlyEmail.toLowerCase()) continue;
      stats.seen++;

      const { data: existing } = await admin.from("rippling_workers")
        .select("profile_id, match_method").eq("rippling_worker_id", String(w.id)).maybeSingle();
      let profileId = existing?.profile_id ?? null;
      let matchMethod = existing?.match_method ?? null;
      let conflict: string | null = null;
      if (email) {
        const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
        if (p?.id) {
          if (existing?.match_method === "manual" && existing.profile_id && existing.profile_id !== p.id) {
            // Never silently overwrite a manual link — log the disagreement.
            conflict = `Email matches profile ${p.id} but worker is manually linked to ${existing.profile_id}`;
            stats.conflicts++;
          } else {
            if (profileId !== p.id) stats.linked++;
            profileId = p.id;
            matchMethod = existing?.match_method === "manual" ? "manual" : "email";
          }
        }
      }
      const comp = (w?.compensation ?? {}) as Record<string, Record<string, unknown>>;
      const rate = (comp?.hourly_wage?.value ?? (comp as Record<string, unknown>)?.hourly_rate) as number | undefined;
      const user = (w?.user ?? {}) as Record<string, unknown>;
      const { error } = await admin.from("rippling_workers").upsert({
        rippling_worker_id: String(w.id),
        profile_id: profileId,
        match_method: matchMethod,
        name: (user?.display_name ?? w?.display_name ?? w?.name ?? null) as string | null,
        email,
        pay_rate: rate != null ? Number(rate) : null,
        pay_currency: (comp?.hourly_wage?.currency_type as string) ?? "USD",
        employment_type: (w?.employment_type as string) ?? null,
        title: (w?.title ?? w?.job_title ?? null) as string | null,
        department: ((w?.department as Record<string, unknown>)?.name ?? w?.department ?? null) as string | null,
        status: (w?.status as string) ?? null,
        start_date: (w?.start_date as string) ?? null,
        end_date: (w?.end_date ?? w?.termination_date ?? null) as string | null,
        sync_error: conflict,
        last_synced: new Date().toISOString(),
      });
      if (!error) stats.upserted++;
    }
    await admin.from("integration_sync_runs").update({
      status: "ok", finished_at: new Date().toISOString(), stats,
    }).eq("id", run?.id);
    await admin.from("integration_connections").update({
      status: "connected", last_ok_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString(),
    }).eq("provider", "rippling");
    await audit(admin, caller, "rippling.sync.workers", "sync_run", run?.id, stats);
    return { ok: true, data: stats };
  } catch (e) {
    const msg = e instanceof RipplingError ? e.sanitized() : String(e).slice(0, 400);
    const connStatus = e instanceof RipplingError && e.category === "RIPPLING_SECRET_MISSING" ? "not_configured" : "error";
    await admin.from("integration_sync_runs").update({
      status: "error", finished_at: new Date().toISOString(), stats, error: msg.slice(0, 500),
    }).eq("id", run?.id);
    await admin.from("integration_connections").update({
      status: connStatus, last_error: msg.slice(0, 500), updated_at: new Date().toISOString(),
    }).eq("provider", "rippling");
    await audit(admin, caller, "rippling.sync.error", "sync_run", run?.id, { error: msg.slice(0, 300) });
    return { ok: false, error: msg, category: e instanceof RipplingError ? e.category : "UNKNOWN", status: e instanceof RipplingError ? e.status : 500 };
  }
}

/* Read-only connection probe: one GET /companies/ with the HR
   credential. Updates integration_connections truthfully — connected +
   last_ok_at only after a real 2xx; otherwise a categorized, sanitized error
   (missing secret / 401 / 403 / 429 / timeout / network) that the UI and MCP
   diagnostics surface instead of pretending the company is empty. */
async function testConnection(admin: Admin, caller: Caller) {
  const now = new Date().toISOString();
  try {
    const body = await ripplingRequest(RIPPLING_ENDPOINTS.companies, { instance: "hr" }) as Record<string, unknown>;
    const count = ((body?.results ?? body?.data ?? []) as unknown[]).length;
    await admin.from("integration_connections").update({
      status: "connected", last_ok_at: now, last_error: null, updated_at: now,
    }).eq("provider", "rippling");
    await audit(admin, caller, "rippling.connection.tested", undefined, undefined, { ok: true, companies_seen: count });
    return { ok: true, data: { connection_status: "connected", last_ok_at: now, companies_seen: count } };
  } catch (e) {
    const isR = e instanceof RipplingError;
    const msg = isR ? e.sanitized() : String(e).slice(0, 400);
    const connStatus = isR && e.category === "RIPPLING_SECRET_MISSING" ? "not_configured" : "error";
    await admin.from("integration_connections").update({
      status: connStatus, last_error: msg, updated_at: now,
    }).eq("provider", "rippling");
    await audit(admin, caller, "rippling.connection.tested", undefined, undefined, { ok: false, category: isR ? e.category : "UNKNOWN" });
    return { ok: false, error: msg, category: isR ? e.category : "UNKNOWN", data: { connection_status: connStatus } };
  }
}

/* Live time-card read (READ-ONLY): GET /time-cards/ with the HR credential,
   cursor-paginated (verified 2026-09-02: official docs + SDK, entitlement
   "API Tier 2"). Rippling's pay_period and summary objects are passed
   through UNMODIFIED — their subfields are Rippling's contract, and we do not
   rename or invent fields. Worker identity is joined to the local mirror by
   worker_id for readable names. Nothing is written to Rippling. */
async function timecardsLive(admin: Admin, caller: Caller) {
  const cards: Record<string, unknown>[] = [];
  for await (const c of ripplingPaginate(RIPPLING_ENDPOINTS.timeCards, { instance: "hr", maxPages: 20 })) {
    cards.push({
      id: c.id, worker_id: c.worker_id ?? null,
      pay_period: c.pay_period ?? null, summary: c.summary ?? null,
      created_at: c.created_at ?? null, updated_at: c.updated_at ?? null,
    });
  }
  const { data: mirror } = await admin.from("rippling_workers").select("rippling_worker_id, name, profile_id");
  const names = new Map((mirror ?? []).map((w) => [w.rippling_worker_id, { name: w.name, profile_id: w.profile_id }]));
  for (const c of cards) {
    const m = names.get(String(c.worker_id));
    (c as Record<string, unknown>).worker_name = m?.name ?? null;
    (c as Record<string, unknown>).profile_id = m?.profile_id ?? null;
  }
  const now = new Date().toISOString();
  await admin.from("integration_connections").update({
    status: "connected", last_ok_at: now, last_error: null, updated_at: now,
  }).eq("provider", "rippling");
  await audit(admin, caller, "rippling.timecards.read", undefined, undefined, { count: cards.length });
  return { ok: true, data: { time_cards: cards, count: cards.length, data_source: "rippling_live", as_of: now } };
}

/* Live payroll-run read (READ-ONLY): GET /payroll-runs/ with the HR
   credential, ordered by check_date, paginated via next_link. Contract
   verified 2026-09-02 against the official @rippling/rippling-sdk
   0.2.0-alpha.85 generated client (requires the "Global Payroll"
   entitlement). Fields pass through unmodified; current/most-recent-completed
   selection and the derived schedule live in _shared/payroll-runs.ts (pure,
   tested). Per-worker payroll records (tax/deduction/garnishment line items)
   are deliberately NOT fetched here. Nothing is written to Rippling. */
async function payrollRunsLive(admin: Admin, caller: Caller) {
  const raw: Record<string, unknown>[] = [];
  for await (const r of ripplingPaginate(`${RIPPLING_ENDPOINTS.payrollRuns}?order_by=-check_date`, { instance: "hr", maxPages: 5 })) {
    raw.push(r);
    if (raw.length >= 100) break;
  }
  const summary = summarizePayrollRuns(raw, nyToday());
  const now = new Date().toISOString();
  await admin.from("integration_connections").update({
    status: "connected", last_ok_at: now, last_error: null, updated_at: now,
  }).eq("provider", "rippling");
  await audit(admin, caller, "rippling.payroll_runs.read", undefined, undefined, { count: summary.runs.length });
  return { ok: true, data: { ...summary, count: summary.runs.length, data_source: "rippling_live_rest", as_of: now } };
}

/* ── Payroll math (deterministic; mirrors packages/shared/labor-calc.js) ── */
const OT_WEEKLY_THRESHOLD = 40; // hours/week before 1.5× — federal FLSA default; per-state config belongs in labor_cost_config

function mondayOf(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

interface Component { key: string; label: string; type: "percent" | "per_hour" | "per_period"; value: number; enabled?: boolean }

function loadedCost(gross: number, hours: number, periods: number, components: Component[]) {
  let extra = 0;
  const breakdown: Record<string, number> = {};
  for (const c of components) {
    if (c?.enabled === false) continue;
    const v = Number(c.value) || 0;
    const amt = c.type === "percent" ? gross * (v / 100) : c.type === "per_hour" ? hours * v : periods * v;
    breakdown[c.key] = Math.round(amt * 100) / 100;
    extra += amt;
  }
  return { loaded: Math.round((gross + extra) * 100) / 100, breakdown };
}

async function ratesByTech(admin: Admin): Promise<Map<string, number>> {
  const [{ data: profiles }, { data: workers }] = await Promise.all([
    admin.from("profiles").select("id, hourly_rate"),
    admin.from("rippling_workers").select("profile_id, pay_rate"),
  ]);
  const map = new Map<string, number>();
  for (const w of workers ?? []) if (w.profile_id && w.pay_rate != null) map.set(w.profile_id, Number(w.pay_rate));
  for (const p of profiles ?? []) if (p.hourly_rate != null) map.set(p.id, Number(p.hourly_rate)); // portal-set rate wins
  return map;
}

async function payrollPrepare(admin: Admin, caller: Caller, periodStart: string, periodEnd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd ?? "")) {
    return { ok: false, error: "periodStart/periodEnd must be YYYY-MM-DD" };
  }
  const [{ data: entries, error: eErr }, rates, { data: cfg }, { data: profiles }] = await Promise.all([
    admin.from("time_entries").select("tech_id, work_date, hours, status")
      .gte("work_date", periodStart).lte("work_date", periodEnd).limit(5000),
    ratesByTech(admin),
    admin.from("labor_cost_config").select("components").eq("id", 1).maybeSingle(),
    admin.from("profiles").select("id, name"),
  ]);
  if (eErr) return { ok: false, error: eErr.message };
  const components = ((cfg?.components ?? []) as Component[]);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.name ?? ""]));
  const counted = new Set(["submitted", "approved", "synced", "paid"]);

  // hours per tech per week → OT split at the weekly threshold
  const perTechWeek = new Map<string, Map<string, number>>();
  let unapproved = 0;
  for (const e of entries ?? []) {
    if (!counted.has(e.status)) continue;
    if (e.status === "submitted") unapproved++;
    const wk = mondayOf(e.work_date);
    const m = perTechWeek.get(e.tech_id) ?? new Map();
    m.set(wk, (m.get(wk) ?? 0) + (Number(e.hours) || 0));
    perTechWeek.set(e.tech_id, m);
  }
  const perWorker: Record<string, unknown>[] = [];
  const totals = { hours: 0, regular: 0, overtime: 0, gross: 0, loaded: 0, workers: 0, missing_rates: 0, unapproved_entries: unapproved };
  for (const [techId, weeks] of perTechWeek) {
    let hours = 0, otHours = 0;
    for (const h of weeks.values()) { hours += h; otHours += Math.max(0, h - OT_WEEKLY_THRESHOLD); }
    const rate = rates.get(techId) ?? null;
    const flags: string[] = [];
    if (rate == null) { flags.push("no_rate"); totals.missing_rates++; }
    const regular = hours - otHours;
    const gross = rate != null ? regular * rate + otHours * rate * 1.5 : null;
    const load = gross != null ? loadedCost(gross, hours, 1, components) : null;
    perWorker.push({
      tech_id: techId, name: names.get(techId) ?? "",
      hours: r2(hours), ot_hours: r2(otHours), rate, gross: gross != null ? r2(gross) : null,
      loaded: load?.loaded ?? null, burden: load?.breakdown ?? null, flags,
    });
    totals.hours += hours; totals.regular += regular; totals.overtime += otHours;
    if (gross != null) { totals.gross += gross; totals.loaded += load!.loaded; }
    totals.workers++;
  }
  for (const k of ["hours", "regular", "overtime", "gross", "loaded"] as const) totals[k] = r2(totals[k]);
  const snapshot = {
    kind: "upcoming", period_start: periodStart, period_end: periodEnd,
    totals: { ...totals, completeness: totals.missing_rates === 0 && unapproved === 0 ? "complete" : "partial" },
    per_worker: perWorker.sort((a, b) => String(a.name).localeCompare(String(b.name))),
    source: "time_entries", created_by: caller.id,
  };
  const { data: saved, error } = await admin.from("payroll_snapshots").insert(snapshot).select().single();
  if (error) return { ok: false, error: error.message };
  await audit(admin, caller, "payroll.prepared", "payroll_snapshot", saved.id, { periodStart, periodEnd, totals: snapshot.totals });
  return { ok: true, data: saved };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/* ── Payroll exception engine (configurable via labor_cost_config-adjacent
      thresholds stored in integration_connections.config.exception_rules) ── */
async function exceptionsRun(admin: Admin, caller: Caller, weeks = 3) {
  const flags = await getFlags(admin);
  const rules = ((flags as Record<string, unknown>).exception_rules ?? {}) as Record<string, number | boolean>;
  const otThreshold = Number(rules.high_overtime_hours ?? 10);       // OT hours/week that trip a warning
  const deltaPct = Number(rules.big_delta_pct ?? 50);                // week-over-week swing %
  const maxDailyHours = Number(rules.max_daily_hours ?? 16);
  const since = new Date(); since.setUTCDate(since.getUTCDate() - (weeks + 1) * 7);
  const sinceISO = since.toISOString().slice(0, 10);

  const [{ data: entries, error }, rates, { data: workers }] = await Promise.all([
    admin.from("time_entries").select("id, tech_id, work_date, hours, status").gte("work_date", sinceISO).limit(5000),
    ratesByTech(admin),
    admin.from("rippling_workers").select("profile_id, status, end_date"),
  ]);
  if (error) return { ok: false, error: error.message };
  const terminated = new Set((workers ?? []).filter((w) => w.profile_id && (w.status === "TERMINATED" || (w.end_date && w.end_date < new Date().toISOString().slice(0, 10)))).map((w) => w.profile_id));

  type Ex = { rule: string; severity: string; tech_id: string; week_start: string | null; details: Record<string, unknown> };
  const found: Ex[] = [];
  const perTechWeek = new Map<string, Map<string, { hours: number; submitted: number; byDay: Map<string, number> }>>();
  const seenDay = new Map<string, string[]>(); // tech|date|hours signature → entry ids (duplicates)

  for (const e of entries ?? []) {
    if (!["submitted", "approved", "synced", "paid"].includes(e.status)) continue;
    const h = Number(e.hours) || 0;
    if (h < 0 || h > 24) {
      found.push({ rule: "implausible_hours", severity: "critical", tech_id: e.tech_id, week_start: mondayOf(e.work_date), details: { entry_id: e.id, hours: h, work_date: e.work_date } });
    }
    const sig = `${e.tech_id}|${e.work_date}|${h}`;
    seenDay.set(sig, [...(seenDay.get(sig) ?? []), e.id]);
    const wk = mondayOf(e.work_date);
    const m = perTechWeek.get(e.tech_id) ?? new Map();
    const rec = m.get(wk) ?? { hours: 0, submitted: 0, byDay: new Map() };
    rec.hours += h;
    if (e.status === "submitted") rec.submitted++;
    rec.byDay.set(e.work_date, (rec.byDay.get(e.work_date) ?? 0) + h);
    m.set(wk, rec); perTechWeek.set(e.tech_id, m);
  }
  for (const [sig, ids] of seenDay) {
    if (ids.length > 1 && Number(sig.split("|")[2]) > 0) {
      const [tech, date] = sig.split("|");
      found.push({ rule: "duplicate", severity: "warn", tech_id: tech, week_start: mondayOf(date), details: { work_date: date, entry_ids: ids } });
    }
  }
  const lastFullWeek = mondayOf(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  for (const [tech, weeksMap] of perTechWeek) {
    for (const [wk, rec] of weeksMap) {
      const ot = Math.max(0, rec.hours - OT_WEEKLY_THRESHOLD);
      if (ot >= otThreshold) found.push({ rule: "high_overtime", severity: "warn", tech_id: tech, week_start: wk, details: { hours: r2(rec.hours), ot_hours: r2(ot), threshold: otThreshold } });
      if (rec.submitted > 0 && wk <= lastFullWeek) found.push({ rule: "unapproved", severity: "warn", tech_id: tech, week_start: wk, details: { submitted_entries: rec.submitted } });
      for (const [d, dh] of rec.byDay) if (dh > maxDailyHours) found.push({ rule: "implausible_hours", severity: "critical", tech_id: tech, week_start: wk, details: { work_date: d, day_hours: r2(dh), max: maxDailyHours } });
      const prev = weeksMap.get(mondayOf(new Date(new Date(`${wk}T00:00:00Z`).getTime() - 7 * 86400000).toISOString().slice(0, 10)));
      if (prev && prev.hours > 0) {
        const pct = Math.abs(rec.hours - prev.hours) / prev.hours * 100;
        if (pct >= deltaPct && wk <= lastFullWeek) found.push({ rule: "big_delta", severity: "info", tech_id: tech, week_start: wk, details: { hours: r2(rec.hours), prev_hours: r2(prev.hours), delta_pct: r2(pct) } });
      }
    }
    if (rates.get(tech) == null) found.push({ rule: "rate_missing", severity: "warn", tech_id: tech, week_start: null, details: {} });
    if (terminated.has(tech)) {
      const recent = [...weeksMap.keys()].filter((wk) => wk >= lastFullWeek);
      if (recent.length) found.push({ rule: "terminated_hours", severity: "critical", tech_id: tech, week_start: recent[0], details: { weeks: recent } });
    }
  }
  // Missing time: office roster members with an active linked worker but no hours last full week.
  for (const w of workers ?? []) {
    if (!w.profile_id || terminated.has(w.profile_id)) continue;
    const rec = perTechWeek.get(w.profile_id)?.get(lastFullWeek);
    if (!rec || rec.hours === 0) found.push({ rule: "missing_time", severity: "info", tech_id: w.profile_id, week_start: lastFullWeek, details: {} });
  }

  let upserted = 0;
  for (const ex of found) {
    const { error: upErr } = await admin.from("payroll_exceptions").upsert(
      { ...ex, status: "open" },
      { onConflict: "rule,tech_id,week_start", ignoreDuplicates: true },
    );
    if (!upErr) upserted++;
  }
  await audit(admin, caller, "payroll.exceptions.run", undefined, undefined, { found: found.length, upserted });
  return { ok: true, data: { found: found.length, upserted } };
}

/* ── Proposed-action lifecycle (Admin only; approval = authenticated human) ── */
const HANDOFF_KINDS = new Set(["hire_draft", "payroll_run", "comp_change", "bonus", "status_change"]);

async function actionTransition(admin: Admin, caller: Caller, id: string, verb: "approve" | "reject" | "execute") {
  if (caller.role !== "Admin") return { ok: false, error: "Only an Admin can approve, reject, or execute actions", status: 403 };
  const { data: a } = await admin.from("proposed_actions").select("*").eq("id", id).maybeSingle();
  if (!a) return { ok: false, error: "Action not found", status: 404 };
  if (a.expires_at && new Date(a.expires_at) < new Date() && ["awaiting_approval", "approved"].includes(a.status)) {
    await admin.from("proposed_actions").update({ status: "expired" }).eq("id", id);
    await audit(admin, caller, "action.expired", "proposed_action", id, { kind: a.kind });
    return { ok: false, error: "Action expired before it could be processed", status: 409 };
  }

  if (verb === "reject") {
    if (!["draft", "awaiting_approval", "approved"].includes(a.status)) return { ok: false, error: `Cannot reject from status ${a.status}`, status: 409 };
    await admin.from("proposed_actions").update({ status: "rejected" }).eq("id", id);
    await audit(admin, caller, "action.rejected", "proposed_action", id, { kind: a.kind });
    return { ok: true, data: { id, status: "rejected" } };
  }

  if (verb === "approve") {
    if (a.status !== "awaiting_approval") return { ok: false, error: `Cannot approve from status ${a.status}`, status: 409 };
    if (a.created_by && a.created_by === caller.id && a.created_via !== "ui") {
      // Defense in depth: an AI/MCP-created action may not be approved by the same identity that created it.
      return { ok: false, error: "This action must be approved by a different admin than its creator", status: 403 };
    }
    const { error } = await admin.from("proposed_actions").update({
      status: "approved", approved_by: caller.id, approved_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "awaiting_approval");
    if (error) return { ok: false, error: error.message };
    await audit(admin, caller, "action.approved", "proposed_action", id, { kind: a.kind });
    return { ok: true, data: { id, status: "approved" } };
  }

  // execute
  if (a.status !== "approved") return { ok: false, error: `Cannot execute from status ${a.status} — approval required`, status: 409 };
  if (!a.approved_by) return { ok: false, error: "No recorded approver — refusing to execute", status: 409 };
  const flags = await getFlags(admin);
  if (!flags.writes_enabled) return { ok: false, error: "RIPPLING writes are disabled (writes_enabled flag is off)", status: 403 };
  if (a.kind === "hire_draft" && !flags.hiring_enabled) return { ok: false, error: "Hiring flow is disabled (hiring_enabled flag is off)", status: 403 };
  if (a.kind === "payroll_run" && !flags.payroll_write_enabled) return { ok: false, error: "Payroll writes are disabled (payroll_write_enabled flag is off)", status: 403 };

  // Claim executing atomically so a double-submit can't run twice.
  const { data: claimed } = await admin.from("proposed_actions")
    .update({ status: "executing" }).eq("id", id).eq("status", "approved").select().maybeSingle();
  if (!claimed) return { ok: false, error: "Action was already picked up by another execution", status: 409 };

  try {
    let result: Record<string, unknown>;
    if (a.kind === "local_rate_change") {
      const { profile_id, rate } = a.payload as { profile_id?: string; rate?: number };
      if (!profile_id || typeof rate !== "number" || rate < 0 || rate > 1000) throw new Error("Invalid rate-change payload");
      const { error } = await admin.from("profiles").update({ hourly_rate: rate }).eq("id", profile_id);
      if (error) throw new Error(error.message);
      result = { applied: "profiles.hourly_rate", profile_id, rate };
    } else if (a.kind === "timecard_edit") {
      const { entry_id, hours, note } = a.payload as { entry_id?: string; hours?: number; note?: string };
      if (!entry_id || typeof hours !== "number" || hours < 0 || hours > 24) throw new Error("Invalid timecard-edit payload");
      const { error } = await admin.from("time_entries").update({
        hours, notes: note ? `${note} (post-approval edit)` : undefined,
      }).eq("id", entry_id);
      if (error) throw new Error(error.message);
      result = { applied: "time_entries.hours", entry_id, hours };
    } else if (HANDOFF_KINDS.has(a.kind)) {
      // No verified public Rippling endpoint performs this final step, and we
      // do not fabricate one: the execution produces the validated hand-off
      // package + deep link. The human completes it in Rippling.
      result = {
        handoff: "rippling",
        note: "Final action required in Rippling — this system prepared and validated the package; completing it happens in Rippling itself.",
        deep_link: "https://app.rippling.com/",
        package: a.payload,
      };
    } else {
      throw new Error(`Unknown action kind: ${a.kind}`);
    }
    await admin.from("proposed_actions").update({
      status: "completed", executed_at: new Date().toISOString(), result,
    }).eq("id", id);
    await audit(admin, caller, "action.executed", "proposed_action", id, { kind: a.kind, handoff: HANDOFF_KINDS.has(a.kind) });
    return { ok: true, data: { id, status: "completed", result } };
  } catch (e) {
    await admin.from("proposed_actions").update({ status: "failed", error: String(e).slice(0, 500) }).eq("id", id);
    await audit(admin, caller, "action.failed", "proposed_action", id, { kind: a.kind, error: String(e).slice(0, 300) });
    return { ok: false, error: String(e) };
  }
}

/* ── Financial metrics + deterministic recommendations ─────────────────────── */
async function metricsRun(admin: Admin, caller: Caller) {
  const now = new Date();
  const weekStart = mondayOf(now.toISOString().slice(0, 10));
  const monthStart = `${now.toISOString().slice(0, 7)}-01`;
  const calculatedAt = now.toISOString();
  const inserts: Record<string, unknown>[] = [];

  // Labor cost this week (approved+ hours × rates, loaded)
  const [{ data: entries }, rates, { data: cfg }] = await Promise.all([
    admin.from("time_entries").select("tech_id, hours, status").gte("work_date", weekStart).limit(3000),
    ratesByTech(admin),
    admin.from("labor_cost_config").select("components").eq("id", 1).maybeSingle(),
  ]);
  let gross = 0, hours = 0, missing = 0;
  for (const e of entries ?? []) {
    if (!["submitted", "approved", "synced", "paid"].includes(e.status)) continue;
    const h = Number(e.hours) || 0; hours += h;
    const rate = rates.get(e.tech_id);
    if (rate == null) { missing++; continue; }
    gross += h * rate;
  }
  const { loaded } = loadedCost(gross, hours, 1, (cfg?.components ?? []) as Component[]);
  inserts.push({
    metric: "labor_cost_week", period_start: weekStart, period_end: now.toISOString().slice(0, 10),
    value: r2(loaded),
    meta: { source: "time_entries×rates×labor_cost_config", completeness: missing ? `partial (${missing} entries without a rate)` : "complete", calculated_at: calculatedAt, gross: r2(gross), hours: r2(hours) },
  });

  // Revenue / AR / AP from the QuickBooks landing tables (only if data exists —
  // absent data yields no snapshot, never a guessed number).
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const { data: invoices } = await admin.from("qbo_invoices").select("total, balance, status, txn_date").gte("txn_date", yearStart).limit(5000);
  if (invoices && invoices.length) {
    const mtd = invoices.filter((i) => i.txn_date >= monthStart);
    if (mtd.length) inserts.push({ metric: "invoiced_month", period_start: monthStart, period_end: now.toISOString().slice(0, 10), value: r2(mtd.reduce((s, i) => s + (Number(i.total) || 0), 0)), meta: { source: "qbo_invoices", completeness: "complete", calculated_at: calculatedAt, count: mtd.length } });
    inserts.push({ metric: "invoiced_ytd", period_start: yearStart, period_end: now.toISOString().slice(0, 10), value: r2(invoices.reduce((s, i) => s + (Number(i.total) || 0), 0)), meta: { source: "qbo_invoices", completeness: "complete", calculated_at: calculatedAt, count: invoices.length } });
  }
  const { data: openInv } = await admin.from("qbo_invoices").select("balance").gt("balance", 0).limit(2000);
  if (openInv && openInv.length) {
    const ar = openInv.reduce((s, i) => s + (Number(i.balance) || 0), 0);
    inserts.push({ metric: "ar_open", period_start: null, period_end: now.toISOString().slice(0, 10), value: r2(ar), meta: { source: "qbo_invoices.balance", completeness: "complete", calculated_at: calculatedAt, count: openInv.length } });
  }
  const { data: openBills } = await admin.from("qbo_bills").select("balance").gt("balance", 0).limit(2000);
  if (openBills && openBills.length) {
    const ap = openBills.reduce((s, i) => s + (Number(i.balance) || 0), 0);
    inserts.push({ metric: "ap_open", period_start: null, period_end: now.toISOString().slice(0, 10), value: r2(ap), meta: { source: "qbo_bills.balance", completeness: "complete", calculated_at: calculatedAt, count: openBills.length } });
  }
  // Payroll next 14 days: 2× the trailing 4-full-week average of loaded weekly
  // labor cost. Explicitly a projection from real trailing data; meta says so.
  {
    const start28 = new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10);
    const { data: trail } = await admin.from("time_entries").select("tech_id, work_date, hours, status").gte("work_date", start28).lt("work_date", weekStart).limit(5000);
    const weekly = new Map<string, number>();
    const weeklyHours = new Map<string, number>();
    let trailMissing = 0;
    for (const e of trail ?? []) {
      if (!["submitted", "approved", "synced", "paid"].includes(e.status)) continue;
      const rate = rates.get(e.tech_id);
      if (rate == null) { trailMissing++; continue; }
      const wk = mondayOf(e.work_date);
      weekly.set(wk, (weekly.get(wk) ?? 0) + (Number(e.hours) || 0) * rate);
      weeklyHours.set(wk, (weeklyHours.get(wk) ?? 0) + (Number(e.hours) || 0));
    }
    if (weekly.size > 0) {
      const grossAvg = [...weekly.values()].reduce((s, v) => s + v, 0) / weekly.size;
      const hoursAvg = [...weeklyHours.values()].reduce((s, v) => s + v, 0) / weekly.size;
      const { loaded: weeklyLoaded } = loadedCost(grossAvg, hoursAvg, 1, (cfg?.components ?? []) as Component[]);
      inserts.push({
        metric: "payroll_next_14d", period_start: now.toISOString().slice(0, 10),
        period_end: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        value: r2(weeklyLoaded * 2),
        meta: { source: `projection: 2× trailing ${weekly.size}-week avg loaded labor`, completeness: trailMissing ? `partial (${trailMissing} entries without a rate)` : "complete", calculated_at: calculatedAt, weekly_avg_loaded: r2(weeklyLoaded) },
      });
      // Payroll as % of trailing revenue when both sides exist.
      const trailingInv = (invoices ?? []).filter((i) => i.txn_date >= start28);
      if (trailingInv.length) {
        const rev = trailingInv.reduce((s, i) => s + (Number(i.total) || 0), 0);
        if (rev > 0) inserts.push({ metric: "payroll_pct_revenue", period_start: start28, period_end: now.toISOString().slice(0, 10), value: r2((weeklyLoaded * weekly.size) / rev * 100), meta: { source: "trailing loaded labor ÷ qbo_invoices", completeness: trailMissing ? "partial" : "complete", calculated_at: calculatedAt } });
      }
    }
  }
  if (inserts.length) await admin.from("financial_metric_snapshots").insert(inserts);

  // Deterministic recommendations (AI never generates these; it may summarize them).
  const flags = await getFlags(admin);
  let recos = 0;
  if (flags.ai_recommendations_enabled) {
    const { data: exceptions } = await admin.from("payroll_exceptions").select("rule, severity").eq("status", "open");
    const critical = (exceptions ?? []).filter((x) => x.severity === "critical").length;
    const otRows = (exceptions ?? []).filter((x) => x.rule === "high_overtime").length;
    const rows: Record<string, unknown>[] = [];
    if (critical > 0) rows.push({ kind: "payroll_hygiene", severity: "critical", title: `${critical} critical payroll exception${critical > 1 ? "s" : ""} open`, body: "Resolve critical payroll exceptions before the next pay run.", data: { critical, source: "payroll_exceptions", calculated_at: calculatedAt } });
    if (otRows >= 2) rows.push({ kind: "overtime", severity: "warn", title: `Overtime tripped for ${otRows} tech-weeks`, body: "Sustained overtime across multiple weeks — run the hire-vs-overtime comparison in Insights.", data: { weeks: otRows, source: "payroll_exceptions", calculated_at: calculatedAt } });
    if (missing > 0) rows.push({ kind: "payroll_hygiene", severity: "warn", title: `${missing} time entr${missing > 1 ? "ies" : "y"} have no pay rate`, body: "Set rates on the Payroll screen or link workers to Rippling so labor cost is complete.", data: { missing, source: "time_entries", calculated_at: calculatedAt } });
    if (rows.length) { await admin.from("business_recommendations").insert(rows); recos = rows.length; }
    if (recos) await audit(admin, caller, "business.recommendation.generated", undefined, undefined, { count: recos });
  }
  await audit(admin, caller, "metrics.run", undefined, undefined, { snapshots: inserts.length, recommendations: recos });
  return { ok: true, data: { snapshots: inserts.length, recommendations: recos } };
}

async function brief(admin: Admin) {
  const [{ data: metrics }, { data: exceptions }, { data: pending }, { data: runs }] = await Promise.all([
    admin.from("financial_metric_snapshots").select("*").order("created_at", { ascending: false }).limit(12),
    admin.from("payroll_exceptions").select("rule, severity, week_start").eq("status", "open").limit(100),
    admin.from("proposed_actions").select("id, kind, summary, status, created_at").in("status", ["awaiting_approval", "approved"]).limit(50),
    admin.from("integration_sync_runs").select("kind, status, finished_at, stats").order("started_at", { ascending: false }).limit(3),
  ]);
  const latest: Record<string, unknown> = {};
  for (const m of metrics ?? []) if (!(m.metric in latest)) latest[m.metric] = { value: m.value, meta: m.meta };
  return {
    ok: true,
    data: {
      generated_at: new Date().toISOString(),
      metrics: latest,
      open_exceptions: { total: (exceptions ?? []).length, critical: (exceptions ?? []).filter((x) => x.severity === "critical").length },
      awaiting_approval: pending ?? [],
      recent_syncs: runs ?? [],
    },
  };
}

/* ── HTTP entry ─────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  ) as Admin;

  const caller = await authenticate(req, admin);
  if (!caller) return json(401, { ok: false, error: "Office (Admin/Staff/Manager) session or CRON_SECRET required" });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* action required below */ }
  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "status": {
        const [{ data: conn }, { data: runs }] = await Promise.all([
          admin.from("integration_connections").select("*").eq("provider", "rippling").maybeSingle(),
          admin.from("integration_sync_runs").select("*").eq("provider", "rippling").order("started_at", { ascending: false }).limit(5),
        ]);
        return json(200, { ok: true, data: { configured: ripplingConfigured("hr"), credentials: ripplingCredentialStatus(), connection: conn, recent_runs: runs ?? [] } });
      }
      case "set_flags": {
        if (caller.role !== "Admin") return json(403, { ok: false, error: "Admin only" });
        const allowed = ["enabled", "writes_enabled", "hiring_enabled", "payroll_write_enabled", "ai_recommendations_enabled"];
        const { data: conn } = await admin.from("integration_connections").select("config").eq("provider", "rippling").maybeSingle();
        const next = { ...(conn?.config ?? {}) } as Record<string, unknown>;
        const patch = (body.flags ?? {}) as Record<string, unknown>;
        for (const k of allowed) if (k in patch) next[k] = Boolean(patch[k]);
        if (patch.exception_rules && typeof patch.exception_rules === "object") next.exception_rules = patch.exception_rules;
        const { error } = await admin.from("integration_connections").update({ config: next, updated_at: new Date().toISOString() }).eq("provider", "rippling");
        if (error) return json(500, { ok: false, error: error.message });
        await audit(admin, caller, "integration.flags.changed", "integration_connections", "rippling", { flags: next });
        return json(200, { ok: true, data: next });
      }
      case "sync_workers": {
        const out = await syncWorkers(admin, caller, body.email ? String(body.email) : undefined);
        return json(out.ok ? 200 : (out as { status?: number }).status === 503 ? 503 : 502, out);
      }
      case "link_worker": {
        if (caller.role !== "Admin") return json(403, { ok: false, error: "Admin only" });
        const workerId = String(body.workerId ?? "");
        const profileId = body.profileId ? String(body.profileId) : null;
        if (!workerId) return json(400, { ok: false, error: "workerId required" });
        const { error } = await admin.from("rippling_workers").update({
          profile_id: profileId, match_method: profileId ? "manual" : null, sync_error: null,
        }).eq("rippling_worker_id", workerId);
        if (error) return json(500, { ok: false, error: error.message });
        await audit(admin, caller, "rippling.worker.linked", "rippling_worker", workerId, { profile_id: profileId });
        return json(200, { ok: true });
      }
      case "test_connection": { const out = await testConnection(admin, caller); return json(out.ok ? 200 : 502, out); }
      case "timecards_live": {
        try { return json(200, await timecardsLive(admin, caller)); }
        catch (e) {
          const isR = e instanceof RipplingError;
          const msg = isR ? e.sanitized() : String(e).slice(0, 400);
          await admin.from("integration_connections").update({
            status: isR && e.category === "RIPPLING_SECRET_MISSING" ? "not_configured" : "error",
            last_error: msg, updated_at: new Date().toISOString(),
          }).eq("provider", "rippling");
          return json(isR && e.status === 503 ? 503 : 502, { ok: false, error: msg, category: isR ? e.category : "UNKNOWN" });
        }
      }
      case "payroll_runs_live": {
        try { return json(200, await payrollRunsLive(admin, caller)); }
        catch (e) {
          const isR = e instanceof RipplingError;
          const msg = isR ? e.sanitized() : String(e).slice(0, 400);
          await admin.from("integration_connections").update({
            status: isR && e.category === "RIPPLING_SECRET_MISSING" ? "not_configured" : "error",
            last_error: msg, updated_at: new Date().toISOString(),
          }).eq("provider", "rippling");
          return json(isR && e.status === 503 ? 503 : 502, { ok: false, error: msg, category: isR ? e.category : "UNKNOWN" });
        }
      }
      case "exceptions_run": return json(200, await exceptionsRun(admin, caller, Number(body.weeks ?? 3)));
      case "payroll_prepare": {
        const out = await payrollPrepare(admin, caller, String(body.periodStart ?? ""), String(body.periodEnd ?? ""));
        return json(out.ok ? 200 : 400, out);
      }
      case "action_approve": { const out = await actionTransition(admin, caller, String(body.id ?? ""), "approve"); return json(out.ok ? 200 : (out as { status?: number }).status ?? 400, out); }
      case "action_reject":  { const out = await actionTransition(admin, caller, String(body.id ?? ""), "reject");  return json(out.ok ? 200 : (out as { status?: number }).status ?? 400, out); }
      case "action_execute": { const out = await actionTransition(admin, caller, String(body.id ?? ""), "execute"); return json(out.ok ? 200 : (out as { status?: number }).status ?? 400, out); }
      case "metrics_run": return json(200, await metricsRun(admin, caller));
      case "brief": return json(200, await brief(admin));
      default: return json(400, { ok: false, error: `Unknown action: ${action || "(none)"}` });
    }
  } catch (e) {
    // Never leak tokens/headers; message only.
    return json(500, { ok: false, error: String(e instanceof Error ? e.message : e).slice(0, 400) });
  }
});
