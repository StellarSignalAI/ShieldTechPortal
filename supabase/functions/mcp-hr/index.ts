// mcp-hr — SHIELDTECH HR/PAYROLL MCP (instance 2 of 2).
// MCP server (official @modelcontextprotocol/sdk, Streamable HTTP) for HR
// administration: workers, compensation, time, payroll workflows, hiring.
//
// INSTANCE SEPARATION
//   • Rippling credential: HR_RIPPLING_API_TOKEN (never the business token).
//   • Instance access key: MCP_HR_ACCESS_KEY (x-mcp-key header) — rotate or
//     clear it to revoke this instance without touching mcp-business.
//   • Every audit row is tagged instance:"mcp-hr".
//
// CAPABILITY MODEL: read / analyze / PREPARE only. prepare_* tools create
// proposed_actions rows in awaiting_approval; approval + execution live in
// the hr function, require a human Admin's own credential, and ignore any
// "approved" flag in arguments. An action created here can never be approved
// by the identity that created it. No SSNs, bank details or tax IDs exist
// anywhere in this system.
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { z } from "npm:zod@3.23.8";
import {
  type McpCaller, auditMcp, hrForward, makeAdmin, mcpAuthenticate,
  mcpCors, mcpError, mcpPropose, mcpText, mcpUnauthorized, protectedResourceMetadata,
} from "../_shared/mcp-common.ts";
import { addDays, mondayOf, nyToday } from "../_shared/dates.ts";

const INSTANCE = "mcp-hr";
const admin = makeAdmin();

/* Connection provenance shared by every read tool, so an unconfigured or
   failed Rippling connection is never presented as a genuinely empty company. */
function tokenPresent(): { present: boolean; dedicated: boolean } {
  return {
    present: Boolean(Deno.env.get("HR_RIPPLING_API_TOKEN") || Deno.env.get("RIPPLING_API_TOKEN")),
    dedicated: Boolean(Deno.env.get("HR_RIPPLING_API_TOKEN")),
  };
}

async function connInfo() {
  const tok = tokenPresent();
  const { data: conn } = await admin.from("integration_connections")
    .select("status,last_ok_at,last_error").eq("provider", "rippling").maybeSingle();
  const raw = conn?.status ?? "unknown";
  const connection_status = !tok.present
    ? "not_configured"
    : raw === "connected" ? "connected"
    : raw === "error" ? "error"
    : "configured_never_verified";
  const warnings: string[] = [];
  if (!tok.present) warnings.push("HR_RIPPLING_API_TOKEN is not set in Supabase secrets — Rippling has never been reached. Empty results mean 'never synced', NOT 'no employees'. See docs/rippling-setup-checklist.md.");
  else if (connection_status === "configured_never_verified") warnings.push("A Rippling token is configured but no successful API call has been recorded yet — run hr_sync_workers or hr_get_company to verify the connection.");
  else if (connection_status === "error") warnings.push(`Last Rippling call failed: ${conn?.last_error ?? "unknown error"}`);
  return {
    token_present: tok.present, token_dedicated: tok.dedicated,
    connection_status, last_ok_at: conn?.last_ok_at ?? null,
    last_error: conn?.last_error ?? null, warnings,
  };
}

/* Portal rate wins over the Rippling mirror rate (same rule as payroll). */
async function ratesByTech(): Promise<Map<string, { rate: number; source: string }>> {
  const [{ data: profiles }, { data: workers }] = await Promise.all([
    admin.from("profiles").select("id, hourly_rate"),
    admin.from("rippling_workers").select("profile_id, pay_rate"),
  ]);
  const map = new Map<string, { rate: number; source: string }>();
  for (const w of workers ?? []) if (w.profile_id && w.pay_rate != null) map.set(w.profile_id, { rate: Number(w.pay_rate), source: "rippling" });
  for (const p of profiles ?? []) if (p.hourly_rate != null) map.set(p.id, { rate: Number(p.hourly_rate), source: "portal" });
  return map;
}

function buildServer(caller: McpCaller): McpServer {
  const s = new McpServer({ name: "shieldtech-hr-payroll", version: "2.0.0" });
  const tool = (name: string, description: string, schema: Record<string, z.ZodTypeAny>, handler: (args: Record<string, unknown>) => Promise<unknown>) =>
    s.registerTool(name, { description, inputSchema: schema }, async (args: Record<string, unknown>) => {
      try { return await handler(args ?? {}); } catch (e) { return mcpError(String(e instanceof Error ? e.message : e).slice(0, 300)); }
    });

  /* ── HR ── */
  tool("hr_get_workers", "Synced Rippling worker roster + portal linkage (no SSNs/bank data are stored anywhere in this system). Includes connection provenance so an unsynced mirror is never mistaken for an empty company.", {}, async () => {
    const [{ data }, conn] = await Promise.all([
      admin.from("rippling_workers").select("*").order("name").limit(500),
      connInfo(),
    ]);
    const workers = data ?? [];
    const asOf = workers.reduce((m, w) => (w.last_synced && w.last_synced > m ? w.last_synced : m), "");
    return mcpText({
      workers,
      administered_by_you: workers.length,
      rbac_scope: `Under ShieldTech's role model, office roles (Admin/Staff/Manager) administer the full roster; you are ${caller.role}.`,
      data_source: "shieldtech_mirror (synced from Rippling via hr_sync_workers)",
      as_of: asOf || null,
      ...conn,
    });
  });
  tool("hr_get_worker", "One worker by Rippling worker id or email.", { idOrEmail: z.string() }, async (a) => {
    const k = String(a.idOrEmail);
    const { data } = await admin.from("rippling_workers").select("*").or(`rippling_worker_id.eq.${k},email.ilike.${k}`).limit(1).maybeSingle();
    return mcpText({ worker: data ?? null });
  });
  tool("hr_get_compensation", "Effective hourly rates per person (portal-set rate wins over the Rippling mirror rate; missing = null, never estimated).", {}, async () => {
    const [rates, { data: profiles }] = await Promise.all([ratesByTech(), admin.from("profiles").select("id, name, role")]);
    return mcpText({
      compensation: (profiles ?? []).filter((p) => p.role !== "Client").map((p) => ({
        profile_id: p.id, name: p.name, rate: rates.get(p.id)?.rate ?? null, source: rates.get(p.id)?.source ?? null,
      })),
    });
  });
  tool("hr_sync_workers", "Pull the worker roster from Rippling (HR credential) into the mirror.", {}, async () => mcpText(await hrForward(caller, { action: "sync_workers" })));
  tool("hr_get_company", "Company/organization summary: headcount by department, employment type and status from the synced roster, plus LIVE-verified Rippling connection health (when a token is configured this performs a real read-only probe). (Worker locations are not part of the synced data and are reported as unavailable, not guessed.)", {}, async () => {
    // Real probe first when configured, so status/last_ok_at reflect an actual call.
    if (tokenPresent().present) await hrForward(caller, { action: "test_connection" });
    const [{ data: workers }, conn] = await Promise.all([
      admin.from("rippling_workers").select("department, employment_type, status"),
      connInfo(),
    ]);
    const by = (key: "department" | "employment_type" | "status") => {
      const m: Record<string, number> = {};
      for (const w of workers ?? []) { const k = (w[key] as string) || "(unset)"; m[k] = (m[k] ?? 0) + 1; }
      return m;
    };
    const total = (workers ?? []).length;
    if (total === 0 && conn.connection_status === "connected") {
      conn.warnings.push("Rippling is reachable but the local mirror is empty — run hr_sync_workers to pull the roster.");
    }
    return mcpText({
      company: "ShieldTech Security", total_workers: total,
      by_department: by("department"), by_employment_type: by("employment_type"), by_status: by("status"),
      rippling_connection: { status: conn.connection_status, last_ok_at: conn.last_ok_at, last_error: conn.last_error },
      data_source: "shieldtech_mirror (roster) + live connection probe",
      ...conn,
      locations: null, locations_note: "unavailable — worker locations are not synced",
    });
  });
  tool("hr_get_departments", "Departments with headcount, from the synced roster.", {}, async () => {
    const { data } = await admin.from("rippling_workers").select("department");
    const m: Record<string, number> = {};
    for (const w of data ?? []) { const k = (w.department as string) || "(unset)"; m[k] = (m[k] ?? 0) + 1; }
    return mcpText({ departments: Object.entries(m).map(([name, headcount]) => ({ name, headcount })) });
  });

  /* ── TIME ── */
  tool("time_get_entries", "Time entries in a date range (YYYY-MM-DD), optionally for one tech.", { start: z.string(), end: z.string(), tech_id: z.string().optional() }, async (a) => {
    let q = admin.from("time_entries").select("id,tech_id,work_date,hours,job_ref,status").gte("work_date", String(a.start)).lte("work_date", String(a.end)).limit(2000);
    if (a.tech_id) q = q.eq("tech_id", String(a.tech_id));
    const { data } = await q;
    return mcpText({ entries: data ?? [], data_source: "shieldtech_time_entries (operational system of record; approved hours sync to Rippling)" });
  });
  tool("time_get_employee_summary", "Per-week hours + OT split for one employee over a range.", { tech_id: z.string(), start: z.string(), end: z.string() }, async (a) => {
    const { data } = await admin.from("time_entries").select("work_date,hours,status").eq("tech_id", String(a.tech_id)).gte("work_date", String(a.start)).lte("work_date", String(a.end)).limit(2000);
    const weeks = new Map<string, number>();
    for (const e of data ?? []) {
      if (!["submitted", "approved", "synced", "paid"].includes(e.status)) continue;
      const d = new Date(`${e.work_date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      const wk = d.toISOString().slice(0, 10);
      weeks.set(wk, (weeks.get(wk) ?? 0) + (Number(e.hours) || 0));
    }
    return mcpText({
      tech_id: a.tech_id,
      weeks: [...weeks.entries()].sort().map(([week, hours]) => ({ week, hours: Math.round(hours * 100) / 100, overtime: Math.round(Math.max(0, hours - 40) * 100) / 100 })),
    });
  });

  tool("time_get_current_period", "Current week (Monday-anchored, America/New_York) per employee: hours, weekly-OT split, per-status breakdown, open/unapproved timecard classification, and missing-time detection. Includes a live read-only Rippling time-cards section when the HR token is configured. Never mislabels a nonexistent timecard as approved.", {}, async () => {
    const today = nyToday();
    const monday = mondayOf(today);
    const weekEnd = addDays(monday, 6);
    const [{ data: entries }, { data: profiles }, { data: mirror }, conn] = await Promise.all([
      admin.from("time_entries").select("id,tech_id,work_date,hours,status").gte("work_date", monday).lte("work_date", weekEnd).limit(3000),
      admin.from("profiles").select("id,name"),
      admin.from("rippling_workers").select("profile_id,status,end_date").not("profile_id", "is", null),
      connInfo(),
    ]);
    const names = new Map((profiles ?? []).map((p) => [p.id, p.name ?? ""]));
    const per = new Map<string, { counted: number; by_status: Record<string, number>; hours_by_status: Record<string, number>; last: string }>();
    for (const e of entries ?? []) {
      const rec = per.get(e.tech_id) ?? { counted: 0, by_status: {}, hours_by_status: {}, last: "" };
      const h = Number(e.hours) || 0;
      rec.by_status[e.status] = (rec.by_status[e.status] ?? 0) + 1;
      rec.hours_by_status[e.status] = Math.round(((rec.hours_by_status[e.status] ?? 0) + h) * 100) / 100;
      if (["submitted", "approved", "synced", "paid"].includes(e.status)) rec.counted += h;
      if (e.work_date > rec.last) rec.last = e.work_date;
      per.set(e.tech_id, rec);
    }
    const classify = (r: { by_status: Record<string, number> }) => {
      const open = (r.by_status.draft ?? 0) > 0;
      const awaiting = (r.by_status.submitted ?? 0) > 0;
      const rejected = (r.by_status.rejected ?? 0) > 0;
      const anyApproved = (r.by_status.approved ?? 0) + (r.by_status.synced ?? 0) + (r.by_status.paid ?? 0) > 0;
      return {
        open_not_submitted: open, submitted_unapproved: awaiting, rejected_needs_correction: rejected,
        fully_approved: anyApproved && !open && !awaiting && !rejected,
        timecard_state: open ? "open" : awaiting ? "submitted_unapproved" : rejected ? "rejected" : anyApproved ? "approved" : "no_entries",
      };
    };
    const employees = [...per.entries()].map(([tech_id, r]) => ({
      tech_id, name: names.get(tech_id) ?? "",
      hours: Math.round(r.counted * 100) / 100,
      overtime: Math.round(Math.max(0, r.counted - 40) * 100) / 100,
      entries_by_status: r.by_status, hours_by_status: r.hours_by_status,
      last_entry_date: r.last || null,
      ...classify(r),
    })).sort((a, b) => b.hours - a.hours);
    // Missing time: active Rippling-linked workers with zero entries this week.
    const active = (mirror ?? []).filter((w) => w.status !== "TERMINATED" && !(w.end_date && w.end_date < today));
    const missing_time = active.filter((w) => !per.has(w.profile_id as string)).map((w) => ({
      tech_id: w.profile_id, name: names.get(w.profile_id as string) ?? "", timecard_state: "missing_no_entries",
    }));
    const out: Record<string, unknown> = {
      timezone: "America/New_York", week_start: monday, week_end: weekEnd,
      employees, missing_time,
      open_or_unapproved: employees.filter((e) => e.open_not_submitted || e.submitted_unapproved || e.rejected_needs_correction).length + missing_time.length,
      data_source: "shieldtech_time_entries (operational system of record; approved hours sync to Rippling)",
      ...conn,
    };
    // Live Rippling time-cards (read-only) when configured; failures are
    // surfaced as categorized warnings, never as a silently absent section.
    if (conn.token_present) {
      const live = await hrForward(caller, { action: "timecards_live" });
      if (live?.ok) out.rippling_time_cards = live.data;
      else (out.warnings as string[]).push(`Live Rippling time-cards unavailable: ${live?.error ?? "unknown error"}`);
    } else {
      out.rippling_time_cards = null;
    }
    return mcpText(out);
  });

  /* ── PAYROLL ──
     Live payroll-run reads ARE implemented (read-only): GET /payroll-runs/
     was verified 2026-09-02 against the official @rippling/rippling-sdk
     0.2.0-alpha.85 generated client (requires the "Global Payroll"
     entitlement). Rippling exposes NO pay-schedule read, so the schedule is
     derived from real runs (pay_frequency + next check_date) and labeled
     derived_from_verified_runs — never guessed. Local ShieldTech preparation
     data stays clearly labeled shieldtech_local. Per-worker payroll records
     (tax/deduction/garnishment line items) are verified in the SDK but
     deliberately not exposed here. */
  async function payrollLive(conn: { token_present: boolean }) {
    if (!conn.token_present) {
      return {
        rippling_payroll: null,
        payroll_schedule: "requires_hr_rippling_api_token" as unknown,
        payroll_schedule_note: "GET /payroll-runs/ is verified (official Rippling SDK 0.2.0-alpha.85; Global Payroll entitlement) but HR_RIPPLING_API_TOKEN is not set, so no live read is possible yet. ShieldTech's local weekly cadence (Monday-anchored, America/New_York) is a local convention, not Rippling data.",
        live_warnings: [] as string[],
      };
    }
    const live = await hrForward(caller, { action: "payroll_runs_live" });
    if (live?.ok) {
      const d = live.data as { runs?: unknown[]; current_run?: unknown; most_recent_completed?: unknown; derived_schedule?: unknown; count?: number; as_of?: string };
      return {
        rippling_payroll: {
          current_run: d.current_run ?? null,
          most_recent_completed: d.most_recent_completed ?? null,
          runs: (d.runs ?? []).slice(0, 25),
          count: d.count ?? 0,
          data_source: "rippling_live_rest",
          as_of: d.as_of ?? null,
        },
        payroll_schedule: (d.derived_schedule ?? "no_payroll_runs_returned") as unknown,
        payroll_schedule_note: "Rippling exposes no pay-schedule read; this schedule is derived from real payroll runs (basis: derived_from_verified_runs).",
        live_warnings: [] as string[],
      };
    }
    return {
      rippling_payroll: null,
      payroll_schedule: "unavailable_live_error" as unknown,
      payroll_schedule_note: "Live payroll-run read failed; local data below is ShieldTech preparation data only.",
      live_warnings: [`Live Rippling payroll runs unavailable: ${live?.error ?? "unknown error"}`],
    };
  }
  tool("payroll_get_summary", "One-call payroll overview: LIVE Rippling payroll runs (current + most recent completed, when the HR token is configured) plus local snapshot totals, open exceptions by severity, recent payout weeks, connection provenance. Every block is labeled with its source.", {}, async () => {
    const [{ data: snap }, { data: exs }, { data: pays }, conn] = await Promise.all([
      admin.from("payroll_snapshots").select("id,period_start,period_end,totals,created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("payroll_exceptions").select("severity").eq("status", "open"),
      admin.from("payroll_payments").select("week_start,amount").order("week_start", { ascending: false }).limit(24),
      connInfo(),
    ]);
    const live = await payrollLive(conn);
    const sev: Record<string, number> = {};
    for (const x of exs ?? []) sev[x.severity] = (sev[x.severity] ?? 0) + 1;
    const byWeek = new Map<string, number>();
    for (const p of pays ?? []) byWeek.set(p.week_start, (byWeek.get(p.week_start) ?? 0) + (Number(p.amount) || 0));
    const weeks = [...byWeek.entries()].map(([week_start, total_paid]) => ({ week_start, total_paid: Math.round(total_paid * 100) / 100 }));
    return mcpText({
      rippling_payroll: live.rippling_payroll,
      payroll_schedule: live.payroll_schedule,
      payroll_schedule_note: live.payroll_schedule_note,
      latest_snapshot: snap ?? null,
      most_recent_completed_payout_week: weeks[0] ?? null,
      open_exceptions: { total: (exs ?? []).length, by_severity: sev },
      recent_payout_weeks: weeks,
      data_source: "rippling_live_rest (payroll runs) + shieldtech_local (payroll_snapshots + payroll_payments)",
      as_of: new Date().toISOString(),
      ...conn,
      warnings: [...conn.warnings, ...live.live_warnings],
    });
  });
  tool("payroll_get_current_period", "Current payroll period: LIVE Rippling current run + derived schedule (when the HR token is configured), plus the latest locally prepared snapshot, open exception count, and the current ShieldTech pay week (America/New_York). Sources are labeled; nothing is guessed.", {}, async () => {
    const [{ data: snap }, { data: exs }, conn] = await Promise.all([
      admin.from("payroll_snapshots").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("payroll_exceptions").select("id", { count: "exact", head: true }).eq("status", "open"),
      connInfo(),
    ]);
    const live = await payrollLive(conn);
    const monday = mondayOf(nyToday());
    return mcpText({
      current_run: live.rippling_payroll ? (live.rippling_payroll as { current_run: unknown }).current_run : null,
      payroll_schedule: live.payroll_schedule,
      payroll_schedule_note: live.payroll_schedule_note,
      snapshot: snap ?? null,
      open_exceptions: (exs as unknown as { count?: number })?.count ?? null,
      current_local_pay_week: { start: monday, end: addDays(monday, 6), timezone: "America/New_York", basis: "ShieldTech weekly convention (local, not Rippling)" },
      data_source: "rippling_live_rest (current run + schedule) + shieldtech_local (snapshot + exceptions)",
      as_of: new Date().toISOString(),
      ...conn,
      warnings: [...conn.warnings, ...live.live_warnings],
    });
  });
  tool("payroll_get_history", "Payroll history: LIVE Rippling runs newest-first with the most recent completed (PAID) run identified (when the HR token is configured), plus local snapshots and per-week payout records. Sources are labeled.", { limit: z.number().optional() }, async (a) => {
    const n = Math.min(Number(a.limit) || 12, 50);
    const [{ data: snaps }, { data: payments }, conn] = await Promise.all([
      admin.from("payroll_snapshots").select("*").order("period_start", { ascending: false }).limit(n),
      admin.from("payroll_payments").select("*").order("week_start", { ascending: false }).limit(n * 8),
      connInfo(),
    ]);
    const live = await payrollLive(conn);
    return mcpText({
      rippling_payroll: live.rippling_payroll,
      most_recent_completed_run: live.rippling_payroll ? (live.rippling_payroll as { most_recent_completed: unknown }).most_recent_completed : null,
      payroll_schedule: live.payroll_schedule,
      snapshots: snaps ?? [],
      payments: payments ?? [],
      most_recent_completed: (payments ?? [])[0] ?? null,
      most_recent_completed_local_payout: (payments ?? [])[0] ?? null,
      data_source: "rippling_live_rest (runs) + shieldtech_local (payroll_snapshots + payroll_payments)",
      as_of: new Date().toISOString(),
      ...conn,
      warnings: [...conn.warnings, ...live.live_warnings],
    });
  });
  tool("payroll_preview", "Compute + store a payroll snapshot for a period (hours, weekly-OT split, gross, loaded burden). Preparation only — this system cannot submit payroll; submission/finalization happens in Rippling.", { periodStart: z.string(), periodEnd: z.string() }, async (a) =>
    mcpText(await hrForward(caller, { action: "payroll_prepare", periodStart: String(a.periodStart), periodEnd: String(a.periodEnd) })));
  tool("payroll_get_exceptions", "Open payroll exceptions from the configurable exception engine (missing time, unapproved timecards, high OT, duplicates, terminated-with-hours, missing rates, implausible hours) — the items that would block a clean pay run.", {}, async () => {
    const [{ data }, conn] = await Promise.all([
      admin.from("payroll_exceptions").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(200),
      connInfo(),
    ]);
    return mcpText({
      exceptions: data ?? [],
      data_source: "shieldtech_local (payroll_exceptions engine over time_entries + roster mirror)",
      note: "Run payroll_run_exception_scan first for the freshest results.",
      as_of: new Date().toISOString(),
      ...conn,
    });
  });
  tool("payroll_run_exception_scan", "Run the payroll exception engine now.", {}, async () => mcpText(await hrForward(caller, { action: "exceptions_run" })));
  tool("payroll_compare_periods", "Delta between two prepared snapshots (by id, or the two most recent).", { snapshot_a: z.string().optional(), snapshot_b: z.string().optional() }, async (a) => {
    let rows: Record<string, unknown>[] = [];
    if (a.snapshot_a && a.snapshot_b) {
      const { data } = await admin.from("payroll_snapshots").select("*").in("id", [String(a.snapshot_a), String(a.snapshot_b)]);
      rows = data ?? [];
    } else {
      const { data } = await admin.from("payroll_snapshots").select("*").order("period_start", { ascending: false }).limit(2);
      rows = data ?? [];
    }
    if (rows.length < 2) return mcpText({ ok: false, error: "Need two snapshots to compare — prepare more periods first" });
    const [b, aRow] = rows.sort((x, y) => String((x as { period_start: string }).period_start).localeCompare(String((y as { period_start: string }).period_start)));
    const t = (r: Record<string, unknown>) => (r.totals ?? {}) as Record<string, number>;
    const delta: Record<string, unknown> = {};
    for (const k of ["hours", "overtime", "gross", "loaded", "workers"]) {
      delta[k] = { earlier: t(b)[k] ?? null, later: t(aRow)[k] ?? null, change: t(aRow)[k] != null && t(b)[k] != null ? Math.round(((t(aRow)[k] as number) - (t(b)[k] as number)) * 100) / 100 : null };
    }
    return mcpText({ earlier: { id: b.id, period_start: b.period_start, period_end: b.period_end }, later: { id: aRow.id, period_start: aRow.period_start, period_end: aRow.period_end }, delta });
  });

  /* ── PREPARE (awaiting_approval only) ── */
  tool("hr_prepare_new_hire", "Propose a new hire for human approval. Nothing reaches Rippling from here; after Admin approval the validated package hands off to Rippling — final onboarding action required in Rippling.", { name: z.string(), title: z.string(), employment_type: z.string().optional(), rate: z.number().optional(), start_date: z.string().optional(), department: z.string().optional(), manager: z.string().optional(), notes: z.string().optional() }, (a) =>
    mcpPropose(admin, caller, INSTANCE, "hire_draft", `Hire ${a.name} — ${a.title}`, a));
  tool("hr_prepare_employee_change", "Propose an employment/status change for human approval (hand-off package; never auto-applied).", { worker: z.string(), change: z.string(), effective_date: z.string().optional(), notes: z.string().optional() }, (a) =>
    mcpPropose(admin, caller, INSTANCE, "status_change", `Employee change: ${a.worker} — ${a.change}`, a));
  tool("hr_prepare_compensation_change", "Propose a compensation change for human approval. With profile_id + rate it becomes a portal rate change executed locally after approval; otherwise a Rippling hand-off package.", { worker: z.string(), proposed_rate: z.number(), profile_id: z.string().optional(), reason: z.string().optional() }, (a) =>
    a.profile_id
      ? mcpPropose(admin, caller, INSTANCE, "local_rate_change", `Set hourly rate to $${a.proposed_rate} for ${a.worker}`, { profile_id: a.profile_id, rate: a.proposed_rate, reason: a.reason })
      : mcpPropose(admin, caller, INSTANCE, "comp_change", `Comp change: ${a.worker} → $${a.proposed_rate}/hr`, a));
  tool("time_prepare_change", "Propose a post-approval timecard correction (Admin approval required before the entry changes).", { entry_id: z.string(), hours: z.number(), note: z.string().optional() }, (a) =>
    mcpPropose(admin, caller, INSTANCE, "timecard_edit", `Correct time entry ${a.entry_id} to ${a.hours}h`, a));
  tool("payroll_prepare_bonus", "Propose a bonus for human approval (hand-off to Rippling after approval).", { worker: z.string(), amount: z.number(), reason: z.string().optional() }, (a) =>
    mcpPropose(admin, caller, INSTANCE, "bonus", `Bonus $${a.amount} for ${a.worker}`, a));

  /* ── APPROVAL PIPELINE ── */
  tool("get_proposed_actions", "Proposed actions and their approval status.", {}, async () => {
    const { data } = await admin.from("proposed_actions").select("id,kind,summary,status,created_via,created_at,approved_at,executed_at,error").order("created_at", { ascending: false }).limit(100);
    return mcpText({ actions: data ?? [] });
  });
  tool("action_get", "Full detail of one proposed action, including payload, approver and execution result.", { id: z.string() }, async (a) => {
    const { data } = await admin.from("proposed_actions").select("*").eq("id", String(a.id)).maybeSingle();
    return mcpText({ action: data ?? null });
  });
  tool("action_approve", "Approve a proposed action. Succeeds ONLY when this connection is authenticated as a human Admin who is not the action's creator — validated server-side from the transport credential and the action's stored state; any 'approved' argument in tool input is ignored.", { id: z.string() }, async (a) =>
    mcpText(await hrForward(caller, { action: "action_approve", id: String(a.id) })));
  tool("action_reject", "Reject a proposed action (Admin).", { id: z.string() }, async (a) => mcpText(await hrForward(caller, { action: "action_reject", id: String(a.id) })));
  tool("action_execute", "Execute an already-approved action (Admin; feature flags gate execution). Local kinds apply in the portal; Rippling kinds return a validated hand-off package + deep link — final completion happens in Rippling.", { id: z.string() }, async (a) =>
    mcpText(await hrForward(caller, { action: "action_execute", id: String(a.id) })));
  tool("approve_and_execute_action", "Convenience: approve then immediately execute a proposed action, under the same server-side Admin checks as action_approve + action_execute.", { id: z.string() }, async (a) => {
    const approved = await hrForward(caller, { action: "action_approve", id: String(a.id) });
    if (!approved?.ok) return mcpText({ step: "approve", ...approved });
    const executed = await hrForward(caller, { action: "action_execute", id: String(a.id) });
    return mcpText({ step: "execute", approve: approved, execute: executed });
  });

  /* ── CAPABILITIES (honest, live) ── */
  tool("rippling_get_capabilities", "Truthful capability + connection report: which Rippling endpoints are verified and implemented, required scope names, whether the HR token is present (never its value), live connection state, per-tool data sources, and what remains intentionally unavailable.", {}, async () => {
    await auditMcp(admin, caller, INSTANCE, "mcp.capabilities.read");
    const conn = await connInfo();
    return mcpText({
      instance: INSTANCE,
      credential: {
        expected_secret: "HR_RIPPLING_API_TOKEN (separate from BUSINESS_RIPPLING_API_TOKEN)",
        token_present: conn.token_present,
        dedicated_hr_token: conn.token_dedicated,
      },
      connection: { status: conn.connection_status, last_ok_at: conn.last_ok_at, last_error: conn.last_error },
      verified_endpoints: [
        { endpoint: "GET /workers/", scope: "workers.read", entitlement: "API Tier 1", verified: "2026-09-02 (official docs + @rippling/rippling-sdk 0.2.0-alpha.85)", used_by: "hr_sync_workers (roster pull)" },
        { endpoint: "GET /companies/", scope: "companies.read", entitlement: "API Tier 1", verified: "2026-09-02 (official docs + SDK)", used_by: "hr_get_company connection probe" },
        { endpoint: "GET /time-cards/", scope: "time-cards.read", entitlement: "API Tier 2", verified: "2026-09-02 (official docs + SDK)", used_by: "time_get_current_period (live section)" },
        { endpoint: "GET /time-entries/", scope: "time-entries.read", entitlement: "API Tier 2", verified: "2026-09-02 (official docs + SDK)", used_by: "status pull in rippling-sync" },
        { endpoint: "GET /payroll-runs/", entitlement: "Global Payroll", verified: "2026-09-02 via official @rippling/rippling-sdk 0.2.0-alpha.85 generated client (payrollRuns.list; sortable by check_date; {results,next_link} pagination)", used_by: "payroll_get_current_period / payroll_get_history / payroll_get_summary (live sections)" },
        { endpoint: "GET /payroll-runs/{id}/", entitlement: "Global Payroll", verified: "same (payrollRuns.retrieve)", used_by: "available; not currently called" },
        { endpoint: "POST /time-entries/", scope: "time-entries write (pre-existing)", verified: "pre-existing integration", used_by: "rippling-sync approved-hours push (unchanged; NOT invoked by read tools)" },
      ],
      verified_not_exposed: [
        { endpoint: "GET /payroll-runs/{run_id}/worker-payroll-records/", entitlement: "Global Payroll", verified: "2026-09-02 via official SDK (workerPayrollRecords.list)", reason: "contains per-worker tax, deduction, and garnishment line items — deliberately not exposed through MCP output" },
      ],
      tool_data_sources: {
        rippling_live: ["hr_sync_workers (pull)", "hr_get_company (connection probe)", "time_get_current_period → rippling_time_cards section", "payroll_get_current_period / payroll_get_history / payroll_get_summary → rippling_payroll sections (rippling_live_rest)"],
        derived_from_verified_runs: ["payroll_schedule (Rippling exposes no pay-schedule read; derived from real runs' pay_period + check_date)"],
        shieldtech_local: ["hr_get_workers (mirror)", "hr_get_worker", "hr_get_compensation", "hr_get_departments", "time_get_entries", "time_get_employee_summary", "payroll snapshots/payments/exceptions blocks", "get_proposed_actions", "action_*"],
      },
      write_model: "prepare → human Admin approval → execute; execution feature flags default OFF (currently enforced server-side)",
      not_exposed: {
        payroll_submission: "Never exposed: no verified public endpoint submits/finalizes payroll; approved payroll runs hand off to Rippling with a deep link.",
        rippling_functions: "Not exposed — a Rippling Function bridge was evaluated and found unnecessary (the direct REST client covers every verified capability).",
        draft_hire_api: "Approved hires hand off to Rippling for the final onboarding action.",
      },
    });
  });

  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: mcpCors });
  // OAuth discovery (RFC 9728) — public by design so MCP clients like ChatGPT
  // can find the Supabase Auth OAuth server before authenticating.
  if (req.method === "GET" && new URL(req.url).pathname.endsWith("/.well-known/oauth-protected-resource")) {
    return protectedResourceMetadata("mcp-hr", "ShieldTech HR & Payroll");
  }
  const { caller, error } = await mcpAuthenticate(req, admin, "MCP_HR_ACCESS_KEY");
  if (!caller) return mcpUnauthorized("mcp-hr", INSTANCE, error ?? "authentication failed");
  const server = buildServer(caller);
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(mcpCors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
});
