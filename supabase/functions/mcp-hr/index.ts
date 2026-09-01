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

const INSTANCE = "mcp-hr";
const admin = makeAdmin();

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
  tool("hr_get_workers", "Synced Rippling worker roster + portal linkage (no SSNs/bank data are stored anywhere in this system).", {}, async () => {
    const { data } = await admin.from("rippling_workers").select("*").order("name").limit(500);
    return mcpText({ workers: data ?? [] });
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
  tool("hr_get_company", "Company/organization summary: headcount by department, employment type and status from the synced roster, plus integration connection health. (Worker locations are not part of the synced data and are reported as unavailable, not guessed.)", {}, async () => {
    const [{ data: workers }, { data: conn }] = await Promise.all([
      admin.from("rippling_workers").select("department, employment_type, status"),
      admin.from("integration_connections").select("status, last_ok_at, last_error").eq("provider", "rippling").maybeSingle(),
    ]);
    const by = (key: "department" | "employment_type" | "status") => {
      const m: Record<string, number> = {};
      for (const w of workers ?? []) { const k = (w[key] as string) || "(unset)"; m[k] = (m[k] ?? 0) + 1; }
      return m;
    };
    return mcpText({
      company: "ShieldTech Security", total_workers: (workers ?? []).length,
      by_department: by("department"), by_employment_type: by("employment_type"), by_status: by("status"),
      rippling_connection: conn ?? { status: "unknown" },
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
    return mcpText({ entries: data ?? [] });
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

  tool("time_get_current_period", "This week's counted hours per employee (Monday-anchored), with the weekly-OT split.", {}, async () => {
    const monday = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
    const [{ data: entries }, { data: profiles }] = await Promise.all([
      admin.from("time_entries").select("tech_id,hours,status").gte("work_date", monday).limit(3000),
      admin.from("profiles").select("id,name"),
    ]);
    const names = new Map((profiles ?? []).map((p) => [p.id, p.name ?? ""]));
    const per = new Map<string, number>();
    for (const e of entries ?? []) {
      if (!["submitted", "approved", "synced", "paid"].includes(e.status)) continue;
      per.set(e.tech_id, (per.get(e.tech_id) ?? 0) + (Number(e.hours) || 0));
    }
    return mcpText({
      week_start: monday,
      employees: [...per.entries()].map(([tech_id, hours]) => ({
        tech_id, name: names.get(tech_id) ?? "", hours: Math.round(hours * 100) / 100,
        overtime: Math.round(Math.max(0, hours - 40) * 100) / 100,
      })).sort((a, b) => b.hours - a.hours),
    });
  });

  /* ── PAYROLL ── */
  tool("payroll_get_summary", "One-call payroll overview: latest snapshot totals, open exceptions by severity, and recent payout weeks.", {}, async () => {
    const [{ data: snap }, { data: exs }, { data: pays }] = await Promise.all([
      admin.from("payroll_snapshots").select("id,period_start,period_end,totals,created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("payroll_exceptions").select("severity").eq("status", "open"),
      admin.from("payroll_payments").select("week_start,amount").order("week_start", { ascending: false }).limit(24),
    ]);
    const sev: Record<string, number> = {};
    for (const x of exs ?? []) sev[x.severity] = (sev[x.severity] ?? 0) + 1;
    const byWeek = new Map<string, number>();
    for (const p of pays ?? []) byWeek.set(p.week_start, (byWeek.get(p.week_start) ?? 0) + (Number(p.amount) || 0));
    return mcpText({
      latest_snapshot: snap ?? null,
      open_exceptions: { total: (exs ?? []).length, by_severity: sev },
      recent_payout_weeks: [...byWeek.entries()].map(([week_start, total_paid]) => ({ week_start, total_paid: Math.round(total_paid * 100) / 100 })),
    });
  });
  tool("payroll_get_current_period", "Latest prepared payroll snapshot + open exception count.", {}, async () => {
    const [{ data: snap }, { data: exs }] = await Promise.all([
      admin.from("payroll_snapshots").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("payroll_exceptions").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
    return mcpText({ snapshot: snap ?? null, open_exceptions: (exs as unknown as { count?: number })?.count ?? null });
  });
  tool("payroll_get_history", "Payroll snapshots and per-week payout records.", { limit: z.number().optional() }, async (a) => {
    const n = Math.min(Number(a.limit) || 12, 50);
    const [{ data: snaps }, { data: payments }] = await Promise.all([
      admin.from("payroll_snapshots").select("*").order("period_start", { ascending: false }).limit(n),
      admin.from("payroll_payments").select("*").order("week_start", { ascending: false }).limit(n * 8),
    ]);
    return mcpText({ snapshots: snaps ?? [], payments: payments ?? [] });
  });
  tool("payroll_preview", "Compute + store a payroll snapshot for a period (hours, weekly-OT split, gross, loaded burden). Preparation only — this system cannot submit payroll; submission/finalization happens in Rippling.", { periodStart: z.string(), periodEnd: z.string() }, async (a) =>
    mcpText(await hrForward(caller, { action: "payroll_prepare", periodStart: String(a.periodStart), periodEnd: String(a.periodEnd) })));
  tool("payroll_get_exceptions", "Open payroll exceptions from the configurable exception engine.", {}, async () => {
    const { data } = await admin.from("payroll_exceptions").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(200);
    return mcpText({ exceptions: data ?? [] });
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

  /* ── CAPABILITIES (honest) ── */
  tool("rippling_get_capabilities", "What this integration can and cannot do against Rippling's public API, and why.", {}, async () => {
    await auditMcp(admin, caller, INSTANCE, "mcp.capabilities.read");
    return mcpText({
      instance: INSTANCE,
      rippling_credential: "HR_RIPPLING_API_TOKEN (separate from the Business instance)",
      verified_endpoints: ["GET /workers (cursor-paginated)", "POST /time-entries", "GET /time-entries/{id}"],
      write_model: "prepare → human Admin approval → execute; feature flags gate every execution and default OFF",
      not_exposed: {
        rippling_functions: "Rippling Functions execution is not exposed: the capability could not be verified against current official docs from this deployment environment, and unverified endpoints are never called.",
        payroll_submission: "No verified public endpoint submits/finalizes payroll; approved payroll runs produce a validated hand-off package + deep link into Rippling.",
        draft_hire_api: "Same policy: approved hires hand off to Rippling for the final onboarding action.",
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
