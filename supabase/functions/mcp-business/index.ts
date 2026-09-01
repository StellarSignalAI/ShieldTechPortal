// mcp-business — SHIELDTECH BUSINESS MCP (instance 1 of 2).
// MCP server (official @modelcontextprotocol/sdk, Streamable HTTP) for
// business intelligence: labor analytics, financial analysis, staffing,
// project profitability, payroll analysis, scenario modeling.
//
// INSTANCE SEPARATION
//   • Rippling credential: BUSINESS_RIPPLING_API_TOKEN (never the HR token) —
//     used by rippling_get_workers {live:true}; everything else reads the
//     synced mirror + portal data.
//   • Instance access key: MCP_BUSINESS_ACCESS_KEY (x-mcp-key header) —
//     rotate or clear it to revoke this instance without touching mcp-hr.
//   • Every audit row is tagged instance:"mcp-business".
//
// This instance is READ + ANALYZE only: no prepare/approve/execute tools.
// All arithmetic is deterministic server code; missing data is returned as
// null/unavailable, never estimated.
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { z } from "npm:zod@3.23.8";
import { RIPPLING_ENDPOINTS, ripplingPaginate } from "../_shared/rippling.ts";
import {
  type McpCaller, auditMcp, hrForward, makeAdmin, mcpAuthenticate,
  mcpCors, mcpError, mcpText, mcpUnauthorized, protectedResourceMetadata,
} from "../_shared/mcp-common.ts";

const INSTANCE = "mcp-business";
const admin = makeAdmin();
const r2 = (n: number) => Math.round(n * 100) / 100;
const COUNTED = new Set(["submitted", "approved", "synced", "paid"]);

function mondayOf(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

interface Component { key: string; type: "percent" | "per_hour" | "per_period"; value: number; enabled?: boolean }

function loadedCost(gross: number | null, hours: number, periods: number, components: Component[]): number | null {
  if (gross == null) return null;
  let extra = 0;
  for (const c of components) {
    if (c?.enabled === false) continue;
    const v = Number(c.value) || 0;
    extra += c.type === "percent" ? gross * (v / 100) : c.type === "per_hour" ? hours * v : periods * v;
  }
  return r2(gross + extra);
}

async function burden(): Promise<Component[]> {
  const { data } = await admin.from("labor_cost_config").select("components").eq("id", 1).maybeSingle();
  return (data?.components ?? []) as Component[];
}

async function ratesByTech(): Promise<Map<string, number>> {
  const [{ data: profiles }, { data: workers }] = await Promise.all([
    admin.from("profiles").select("id, hourly_rate"),
    admin.from("rippling_workers").select("profile_id, pay_rate"),
  ]);
  const map = new Map<string, number>();
  for (const w of workers ?? []) if (w.profile_id && w.pay_rate != null) map.set(w.profile_id, Number(w.pay_rate));
  for (const p of profiles ?? []) if (p.hourly_rate != null) map.set(p.id, Number(p.hourly_rate));
  return map;
}

/* Per-tech aggregate over a range: hours, OT (weekly 40h split), loaded cost. */
async function laborAggregate(start: string, end: string) {
  const [{ data: entries }, rates, comps, { data: profiles }] = await Promise.all([
    admin.from("time_entries").select("tech_id, work_date, hours, job_ref, status").gte("work_date", start).lte("work_date", end).limit(5000),
    ratesByTech(), burden(), admin.from("profiles").select("id, name"),
  ]);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.name ?? ""]));
  const perTechWeek = new Map<string, Map<string, number>>();
  const perJob = new Map<string, { hours: number; cost: number; costComplete: boolean; techs: Set<string> }>();
  for (const e of entries ?? []) {
    if (!COUNTED.has(e.status)) continue;
    const h = Number(e.hours) || 0;
    const m = perTechWeek.get(e.tech_id) ?? new Map();
    const wk = mondayOf(e.work_date);
    m.set(wk, (m.get(wk) ?? 0) + h);
    perTechWeek.set(e.tech_id, m);
    const job = e.job_ref || "(unallocated)";
    const j = perJob.get(job) ?? { hours: 0, cost: 0, costComplete: true, techs: new Set<string>() };
    j.hours += h; j.techs.add(e.tech_id);
    const rate = rates.get(e.tech_id);
    if (rate == null) j.costComplete = false; else j.cost += h * rate;
    perJob.set(job, j);
  }
  const perTech = [...perTechWeek.entries()].map(([techId, weeks]) => {
    let hours = 0, ot = 0;
    for (const h of weeks.values()) { hours += h; ot += Math.max(0, h - 40); }
    const rate = rates.get(techId) ?? null;
    const gross = rate != null ? (hours - ot) * rate + ot * rate * 1.5 : null;
    return {
      tech_id: techId, name: names.get(techId) ?? "", hours: r2(hours), overtime_hours: r2(ot),
      rate, gross: gross != null ? r2(gross) : null, loaded_cost: loadedCost(gross, hours, weeks.size, comps),
      weeks: weeks.size,
    };
  });
  return { perTech, perJob, comps, rates };
}

function buildServer(caller: McpCaller): McpServer {
  const s = new McpServer({ name: "shieldtech-business", version: "1.0.0" });
  const tool = (name: string, description: string, schema: Record<string, z.ZodTypeAny>, handler: (args: Record<string, unknown>) => Promise<unknown>) =>
    s.registerTool(name, { description, inputSchema: schema }, async (args: Record<string, unknown>) => {
      try { return await handler(args ?? {}); } catch (e) { return mcpError(String(e instanceof Error ? e.message : e).slice(0, 300)); }
    });
  const range = (a: Record<string, unknown>, days = 28) => ({
    start: String(a.start ?? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)),
    end: String(a.end ?? new Date().toISOString().slice(0, 10)),
  });

  /* ── BUSINESS HEALTH ── */
  tool("business_get_health", "Business health snapshot: latest financial metrics (each with source/completeness/timestamp), exception + approval counts, sync health. Absent metrics are unavailable, never estimated.", {}, async () => {
    const brief = await hrForward(caller, { action: "brief" });
    const [{ count: emp }, { count: workers }] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).neq("role", "Client"),
      admin.from("rippling_workers").select("rippling_worker_id", { count: "exact", head: true }),
    ]);
    await auditMcp(admin, caller, INSTANCE, "business.health.read");
    return mcpText({ ...((brief as { data?: unknown })?.data ?? brief), headcount: { portal_members: emp ?? null, rippling_workers: workers ?? null } });
  });
  tool("business_get_daily_brief", "Grounded daily brief (metrics, open exceptions, pending approvals, recent syncs).", {}, async () => mcpText(await hrForward(caller, { action: "brief" })));
  tool("business_get_alerts", "Open payroll exceptions + active recommendations, most severe first.", {}, async () => {
    const [{ data: exs }, { data: recos }] = await Promise.all([
      admin.from("payroll_exceptions").select("rule,severity,tech_id,week_start,details,created_at").eq("status", "open").limit(200),
      admin.from("business_recommendations").select("kind,severity,title,body,data,created_at").eq("status", "new").limit(50),
    ]);
    const sev = (x: { severity: string }) => ({ critical: 0, warn: 1, info: 2 } as Record<string, number>)[x.severity] ?? 3;
    return mcpText({ exceptions: (exs ?? []).sort((a, b) => sev(a) - sev(b)), recommendations: (recos ?? []).sort((a, b) => sev(a) - sev(b)) });
  });
  tool("business_get_recommendations", "Deterministic business recommendations with the data each rule used.", {}, async () => {
    const { data } = await admin.from("business_recommendations").select("*").eq("status", "new").order("created_at", { ascending: false }).limit(50);
    return mcpText({ recommendations: data ?? [] });
  });
  tool("business_refresh_metrics", "Recompute financial metric snapshots now.", {}, async () => mcpText(await hrForward(caller, { action: "metrics_run" })));

  /* ── RIPPLING (read-only; live reads use the BUSINESS credential) ── */
  tool("rippling_get_workers", "Worker roster. Default: the synced mirror. live:true pulls directly from Rippling with this instance's own BUSINESS credential.", { live: z.boolean().optional() }, async (a) => {
    if (a.live) {
      const out: Record<string, unknown>[] = [];
      for await (const w of ripplingPaginate(RIPPLING_ENDPOINTS.workers, { instance: "business", maxPages: 10 })) {
        const user = (w?.user ?? {}) as Record<string, unknown>;
        out.push({ id: w.id, name: user?.display_name ?? w?.display_name ?? null, email: (w as Record<string, unknown>)?.work_email ?? user?.work_email ?? null, employment_type: w?.employment_type ?? null, status: w?.status ?? null });
      }
      await auditMcp(admin, caller, INSTANCE, "rippling.workers.live_read", undefined, undefined, { count: out.length });
      return mcpText({ source: "rippling (live, business credential)", workers: out });
    }
    const { data } = await admin.from("rippling_workers").select("*").order("name").limit(500);
    return mcpText({ source: "mirror", workers: data ?? [] });
  });
  tool("rippling_get_worker", "One synced worker by Rippling worker id or email.", { idOrEmail: z.string() }, async (a) => {
    const k = String(a.idOrEmail);
    const { data } = await admin.from("rippling_workers").select("*").or(`rippling_worker_id.eq.${k},email.ilike.${k}`).limit(1).maybeSingle();
    return mcpText({ worker: data ?? null });
  });
  tool("rippling_get_compensation", "Effective hourly rates (portal rate wins over the mirror rate; missing = null).", {}, async () => {
    const [rates, { data: profiles }] = await Promise.all([ratesByTech(), admin.from("profiles").select("id, name, role")]);
    return mcpText({ compensation: (profiles ?? []).filter((p) => p.role !== "Client").map((p) => ({ profile_id: p.id, name: p.name, rate: rates.get(p.id) ?? null })) });
  });
  tool("rippling_get_time", "Time entries in a date range.", { start: z.string(), end: z.string(), tech_id: z.string().optional() }, async (a) => {
    let q = admin.from("time_entries").select("id,tech_id,work_date,hours,job_ref,status").gte("work_date", String(a.start)).lte("work_date", String(a.end)).limit(2000);
    if (a.tech_id) q = q.eq("tech_id", String(a.tech_id));
    const { data } = await q;
    return mcpText({ entries: data ?? [] });
  });
  tool("rippling_get_payroll_periods", "Prepared payroll snapshots (period totals).", { limit: z.number().optional() }, async (a) => {
    const { data } = await admin.from("payroll_snapshots").select("id,kind,period_start,period_end,totals,created_at").order("period_start", { ascending: false }).limit(Math.min(Number(a.limit) || 12, 50));
    return mcpText({ periods: data ?? [] });
  });
  tool("rippling_get_payroll_history", "Per-week payout records (hours/rate/amount snapshots at payout time).", { limit: z.number().optional() }, async (a) => {
    const { data } = await admin.from("payroll_payments").select("*").order("week_start", { ascending: false }).limit(Math.min(Number(a.limit) || 50, 200));
    return mcpText({ payments: data ?? [] });
  });
  tool("rippling_get_organization", "Org shape from the synced roster: headcount by department, employment type and status.", {}, async () => {
    const { data } = await admin.from("rippling_workers").select("department, employment_type, status");
    const by = (key: "department" | "employment_type" | "status") => {
      const m: Record<string, number> = {};
      for (const w of data ?? []) { const k = (w[key] as string) || "(unset)"; m[k] = (m[k] ?? 0) + 1; }
      return m;
    };
    return mcpText({ total: (data ?? []).length, by_department: by("department"), by_employment_type: by("employment_type"), by_status: by("status") });
  });

  /* ── LABOR ANALYTICS ── */
  tool("labor_analyze_employee", "Hours, OT, rate, gross, loaded cost for one employee over a range (default last 28 days).", { tech_id: z.string(), start: z.string().optional(), end: z.string().optional() }, async (a) => {
    const { start, end } = range(a);
    const { perTech } = await laborAggregate(start, end);
    return mcpText({ range: { start, end }, employee: perTech.find((t) => t.tech_id === a.tech_id) ?? null });
  });
  tool("labor_analyze_project", "Labor hours + cost per job/project reference over a range; '(unallocated)' rows are time with no job assigned. cost is null when any contributing tech lacks a rate (never estimated).", { start: z.string().optional(), end: z.string().optional() }, async (a) => {
    const { start, end } = range(a, 90);
    const { perJob } = await laborAggregate(start, end);
    return mcpText({
      range: { start, end },
      projects: [...perJob.entries()].map(([job, j]) => ({
        job_ref: job, hours: r2(j.hours), labor_cost: j.costComplete ? r2(j.cost) : null,
        cost_complete: j.costComplete, techs: j.techs.size,
      })).sort((a2, b2) => b2.hours - a2.hours),
    });
  });
  tool("labor_get_utilization", "Counted hours vs capacity (weeks × hours_per_week) per employee over a range.", { start: z.string().optional(), end: z.string().optional(), hours_per_week: z.number().optional() }, async (a) => {
    const { start, end } = range(a);
    const hpw = Number(a.hours_per_week ?? 40);
    const { perTech } = await laborAggregate(start, end);
    return mcpText({
      range: { start, end }, hours_per_week: hpw,
      utilization: perTech.map((t) => ({ ...t, capacity_hours: r2(t.weeks * hpw), utilization_pct: t.weeks ? r2(t.hours / (t.weeks * hpw) * 100) : null })),
    });
  });
  tool("labor_get_overtime", "Overtime hours per employee over a range, highest first.", { start: z.string().optional(), end: z.string().optional() }, async (a) => {
    const { start, end } = range(a);
    const { perTech } = await laborAggregate(start, end);
    return mcpText({ range: { start, end }, overtime: perTech.filter((t) => t.overtime_hours > 0).sort((x, y) => y.overtime_hours - x.overtime_hours) });
  });

  /* ── FINANCE ── */
  tool("finance_get_summary", "Latest financial metric snapshots — labor cost, invoiced MTD/YTD, AR, AP, payroll projection — each with source/completeness/timestamp.", {}, async () => {
    const { data } = await admin.from("financial_metric_snapshots").select("*").order("created_at", { ascending: false }).limit(30);
    const latest: Record<string, unknown> = {};
    for (const m of data ?? []) if (!(m.metric in latest)) latest[m.metric] = { value: m.value, period_start: m.period_start, period_end: m.period_end, meta: m.meta };
    return mcpText({ metrics: latest, note: "A metric absent here has no computed snapshot — it is unavailable, not zero." });
  });
  tool("finance_get_cashflow", "Open AR vs open AP from the QuickBooks landing tables. Bank cash balances are not synced into this system and are reported as unavailable.", {}, async () => {
    const [{ data: inv }, { data: bills }] = await Promise.all([
      admin.from("qbo_invoices").select("balance").gt("balance", 0).limit(2000),
      admin.from("qbo_bills").select("balance").gt("balance", 0).limit(2000),
    ]);
    const ar = (inv ?? []).reduce((s, i) => s + (Number(i.balance) || 0), 0);
    const ap = (bills ?? []).reduce((s, i) => s + (Number(i.balance) || 0), 0);
    return mcpText({
      ar_open: inv?.length ? r2(ar) : null, ap_open: bills?.length ? r2(ap) : null,
      net_ar_minus_ap: inv?.length || bills?.length ? r2(ar - ap) : null,
      cash_balance: null, cash_note: "unavailable — bank balances are not part of the QuickBooks sync",
    });
  });
  tool("finance_get_payroll_ratio", "Loaded labor cost as % of trailing invoiced revenue (latest computed snapshot).", {}, async () => {
    const { data } = await admin.from("financial_metric_snapshots").select("*").eq("metric", "payroll_pct_revenue").order("created_at", { ascending: false }).limit(1).maybeSingle();
    return mcpText(data ? { payroll_pct_revenue: data.value, meta: data.meta } : { payroll_pct_revenue: null, note: "Not computed yet — run business_refresh_metrics (needs both time-entry rates and QuickBooks invoices)." });
  });

  /* ── STAFFING + SCENARIOS (deterministic) ── */
  tool("staffing_get_capacity", "Weekly capacity from the active linked roster: techs × hours/week × utilization.", { hours_per_week: z.number().optional(), utilization: z.number().optional() }, async (a) => {
    const { data } = await admin.from("rippling_workers").select("profile_id,status").not("profile_id", "is", null);
    const active = (data ?? []).filter((w) => w.status !== "TERMINATED").length;
    const hpw = Number(a.hours_per_week ?? 40), u = Math.min(1, Math.max(0, Number(a.utilization ?? 0.8)));
    return mcpText({ inputs: { active_linked_techs: active, hours_per_week: hpw, utilization: u }, weekly_capacity_hours: r2(active * hpw * u) });
  });
  tool("staffing_forecast", "Deterministic staffing forecast: backlog hours vs weekly capacity.", { backlogHours: z.number(), techs: z.number(), hoursPerTechWeek: z.number().optional(), utilization: z.number().optional() }, async (a) => {
    const hp = Number(a.hoursPerTechWeek ?? 40), u = Math.min(1, Math.max(0, Number(a.utilization ?? 0.8)));
    const cap = Number(a.techs) * hp * u;
    const out = {
      inputs: { backlogHours: Number(a.backlogHours), techs: Number(a.techs), hoursPerTechWeek: hp, utilization: u },
      weekly_capacity: r2(cap),
      weeks_to_clear: cap > 0 ? r2(Number(a.backlogHours) / cap) : null,
      techs_to_clear_in_4_weeks: hp * u > 0 ? Math.ceil(Number(a.backlogHours) / (4 * hp * u)) : null,
    };
    await admin.from("staffing_forecasts").insert({ params: out.inputs, result: out, created_by: caller.id });
    return mcpText(out);
  });
  tool("staffing_compare_hire_vs_overtime", "Deterministic hire-vs-overtime comparison at fully loaded cost; shows every input.", { extraWeeklyHours: z.number(), avgRate: z.number(), newHireRate: z.number(), weeks: z.number().optional(), hireFixedCost: z.number().optional() }, async (a) => {
    const comps = await burden();
    const h = Number(a.extraWeeklyHours), weeks = Number(a.weeks ?? 26), fixed = Number(a.hireFixedCost ?? 0);
    const otWeekly = loadedCost(h * Number(a.avgRate) * 1.5, h, 0, comps)!;
    const hireWeekly = loadedCost(h * Number(a.newHireRate), h, 1, comps)!;
    const out = {
      inputs: { extraWeeklyHours: h, avgRate: Number(a.avgRate), newHireRate: Number(a.newHireRate), weeks, hireFixedCost: fixed, burden_components: comps.length },
      overtime: { weekly: otWeekly, total: r2(otWeekly * weeks) },
      hire: { weekly: hireWeekly, total: r2(hireWeekly * weeks + fixed) },
      savings_with_hire: r2(otWeekly * weeks - (hireWeekly * weeks + fixed)),
    };
    await admin.from("scenario_runs").insert({ kind: "hire_vs_ot", inputs: out.inputs, outputs: out, created_by: caller.id });
    return mcpText(out);
  });
  tool("scenario_hire_employee", "What adding a hire costs weekly/annually at fully loaded cost.", { rate: z.number(), hoursPerWeek: z.number().optional() }, async (a) => {
    const comps = await burden();
    const h = Number(a.hoursPerWeek ?? 40);
    const weekly = loadedCost(Number(a.rate) * h, h, 1, comps)!;
    const out = { inputs: { rate: Number(a.rate), hoursPerWeek: h }, loaded_weekly_cost: weekly, loaded_annual_cost: r2(weekly * 52) };
    await admin.from("scenario_runs").insert({ kind: "headcount", inputs: out.inputs, outputs: out, created_by: caller.id });
    return mcpText(out);
  });
  tool("scenario_change_compensation", "Compensation-change impact: direct + loaded deltas and the billing rate needed to keep a target margin. Analysis only — changing pay requires the HR instance's prepare → Admin approval pipeline.", { currentRate: z.number(), proposedRate: z.number(), hoursPerWeek: z.number().optional(), targetMarginPct: z.number().optional(), headcount: z.number().optional() }, async (a) => {
    const comps = await burden();
    const h = Number(a.hoursPerWeek ?? 40), n = Number(a.headcount ?? 1);
    const before = loadedCost(Number(a.currentRate) * h, h, 1, comps)!;
    const after = loadedCost(Number(a.proposedRate) * h, h, 1, comps)!;
    const loadedHourlyAfter = loadedCost(Number(a.proposedRate), 1, 0, comps)!;
    const m = a.targetMarginPct != null ? Number(a.targetMarginPct) / 100 : null;
    const out = {
      inputs: { currentRate: Number(a.currentRate), proposedRate: Number(a.proposedRate), hoursPerWeek: h, headcount: n, targetMarginPct: a.targetMarginPct ?? null },
      direct_annual_increase: r2((Number(a.proposedRate) - Number(a.currentRate)) * h * 52 * n),
      loaded_weekly_increase: r2((after - before) * n),
      loaded_annual_increase: r2((after - before) * 52 * n),
      required_billing_rate_for_margin: m != null && m < 1 ? r2(loadedHourlyAfter / (1 - m)) : null,
    };
    await admin.from("scenario_runs").insert({ kind: "rate_change", inputs: out.inputs, outputs: out, created_by: caller.id });
    return mcpText(out);
  });
  tool("scenario_change_billing_rate", "Margin at a given billing rate for a given loaded hourly cost, and the rate needed for a target margin.", { loadedHourlyCost: z.number(), billingRate: z.number().optional(), targetMarginPct: z.number().optional() }, async (a) => {
    const c = Number(a.loadedHourlyCost);
    const out: Record<string, unknown> = { inputs: { loadedHourlyCost: c, billingRate: a.billingRate ?? null, targetMarginPct: a.targetMarginPct ?? null } };
    if (a.billingRate != null && Number(a.billingRate) > 0) out.margin_pct_at_billing_rate = r2((Number(a.billingRate) - c) / Number(a.billingRate) * 100);
    if (a.targetMarginPct != null && Number(a.targetMarginPct) < 100) out.required_billing_rate = r2(c / (1 - Number(a.targetMarginPct) / 100));
    await admin.from("scenario_runs").insert({ kind: "rate_change", inputs: out.inputs as Record<string, unknown>, outputs: out, created_by: caller.id });
    return mcpText(out);
  });
  tool("scenario_reduce_overtime", "Weekly/annual savings from eliminating N overtime hours/week at the loaded OT premium.", { overtimeHoursPerWeek: z.number(), avgRate: z.number() }, async (a) => {
    const comps = await burden();
    const h = Number(a.overtimeHoursPerWeek);
    const otCost = loadedCost(h * Number(a.avgRate) * 1.5, h, 0, comps)!;
    const straightCost = loadedCost(h * Number(a.avgRate), h, 0, comps)!;
    const out = {
      inputs: { overtimeHoursPerWeek: h, avgRate: Number(a.avgRate) },
      weekly_ot_cost: otCost, weekly_cost_if_straight_time: straightCost,
      weekly_premium: r2(otCost - straightCost), annual_premium: r2((otCost - straightCost) * 52),
      note: "Premium assumes the hours still get worked at straight time (e.g. by a hire); eliminating the hours entirely saves the full weekly_ot_cost.",
    };
    await admin.from("scenario_runs").insert({ kind: "utilization", inputs: out.inputs, outputs: out, created_by: caller.id });
    return mcpText(out);
  });

  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: mcpCors });
  // OAuth discovery (RFC 9728) — public by design so MCP clients like ChatGPT
  // can find the Supabase Auth OAuth server before authenticating.
  if (req.method === "GET" && new URL(req.url).pathname.endsWith("/.well-known/oauth-protected-resource")) {
    return protectedResourceMetadata("mcp-business", "ShieldTech Business Intelligence");
  }
  const { caller, error } = await mcpAuthenticate(req, admin, "MCP_BUSINESS_ACCESS_KEY");
  if (!caller) return mcpUnauthorized("mcp-business", INSTANCE, error ?? "authentication failed");
  const server = buildServer(caller);
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(mcpCors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
});
