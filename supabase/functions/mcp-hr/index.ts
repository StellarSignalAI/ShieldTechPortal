// mcp-hr — MCP server (official @modelcontextprotocol/sdk, Streamable HTTP)
// exposing the ShieldTech HR / payroll / labor / BI system to AI clients.
//
// AUTH: every request must carry a Supabase user access token
// (Authorization: Bearer <jwt>) belonging to an office user (Admin/Staff/
// Manager). The LLM only ever holds READ / ANALYZE / PREPARE capability:
//   • read tools query the HR tables;
//   • prepare_* tools create proposed_actions rows in awaiting_approval;
//   • approve_and_execute_action exists but simply forwards to the `hr`
//     function with the SAME transport credential — approval is decided
//     server-side from the authenticated human's role and the action's DB
//     state. An "approved": true argument from the model is meaningless and
//     ignored; the model cannot forge the transport credential, and an
//     MCP-created action can never be approved by the identity that created it.
// No Rippling token, SSN, bank detail or tax ID is ever readable here — the
// worker mirror stores none of them.
import { createClient } from "npm:@supabase/supabase-js@2";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { z } from "npm:zod@3.23.8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

interface Caller { id: string; name: string; role: string; jwt: string }

async function authenticate(req: Request): Promise<Caller | null> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return null;
  const { data: p } = await admin.from("profiles").select("name,role").eq("id", data.user.id).maybeSingle();
  if (!p || !["Admin", "Staff", "Manager"].includes(p.role ?? "")) return null;
  return { id: data.user.id, name: p.name ?? "", role: p.role, jwt };
}

const text = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 1).slice(0, 60_000) }] });
const errText = (msg: string) => ({ content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: msg }) }], isError: true });

/* Forward an operation to the hr function using the human caller's own JWT,
   so role checks, flag gates, the approval state machine and audit logging
   all run in exactly one place. */
async function hrForward(caller: Caller, body: Record<string, unknown>) {
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/hr`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${caller.jwt}` },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function proposeViaMcp(caller: Caller, kind: string, summary: string, payload: Record<string, unknown>) {
  const { data, error } = await admin.from("proposed_actions").insert({
    kind, summary, payload, status: "awaiting_approval",
    created_by: caller.id, created_via: "mcp",
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  }).select("id, kind, summary, status, expires_at").single();
  if (error) return errText(error.message);
  await admin.from("audit_events").insert({
    actor: caller.id, actor_name: caller.name, actor_role: caller.role,
    action: "action.proposed", subject_type: "proposed_action", subject_id: data.id,
    details: { kind, via: "mcp" },
  });
  return text({
    ok: true, action: data,
    note: "Created in awaiting_approval. A human Admin (other than this action's creator) must approve it in the HR Center or via approve_and_execute_action before anything happens.",
  });
}

function buildServer(caller: Caller): McpServer {
  const s = new McpServer({ name: "shieldtech-hr", version: "1.0.0" });
  const tool = (name: string, description: string, schema: Record<string, z.ZodTypeAny>, handler: (args: Record<string, unknown>) => Promise<unknown>) =>
    s.registerTool(name, { description, inputSchema: schema }, async (args: Record<string, unknown>) => {
      try { return await handler(args ?? {}); } catch (e) { return errText(String(e instanceof Error ? e.message : e).slice(0, 300)); }
    });

  /* ── READ ── */
  tool("rippling_get_workers", "List the synced Rippling worker roster (no SSNs/bank data are stored).", {}, async () => {
    const { data } = await admin.from("rippling_workers").select("*").order("name").limit(500);
    return text({ workers: data ?? [] });
  });
  tool("rippling_get_worker", "Get one synced worker by rippling worker id or email.", { idOrEmail: z.string() }, async (a) => {
    const k = String(a.idOrEmail);
    const { data } = await admin.from("rippling_workers").select("*").or(`rippling_worker_id.eq.${k},email.ilike.${k}`).limit(1).maybeSingle();
    return text({ worker: data ?? null });
  });
  tool("hr_get_time_entries", "Time entries in a date range (YYYY-MM-DD), optionally for one tech.", { start: z.string(), end: z.string(), tech_id: z.string().optional() }, async (a) => {
    let q = admin.from("time_entries").select("id,tech_id,work_date,hours,job_ref,status").gte("work_date", String(a.start)).lte("work_date", String(a.end)).limit(2000);
    if (a.tech_id) q = q.eq("tech_id", String(a.tech_id));
    const { data } = await q;
    return text({ entries: data ?? [] });
  });
  tool("payroll_get_exceptions", "Open payroll exceptions.", {}, async () => {
    const { data } = await admin.from("payroll_exceptions").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(200);
    return text({ exceptions: data ?? [] });
  });
  tool("payroll_get_snapshots", "Prepared payroll snapshots (period totals + per-worker detail).", { limit: z.number().optional() }, async (a) => {
    const { data } = await admin.from("payroll_snapshots").select("*").order("period_start", { ascending: false }).limit(Math.min(Number(a.limit) || 10, 30));
    return text({ snapshots: data ?? [] });
  });
  tool("labor_get_cost_config", "Configured loaded-labor burden components.", {}, async () => {
    const { data } = await admin.from("labor_cost_config").select("*").eq("id", 1).maybeSingle();
    return text({ config: data ?? { components: [] } });
  });
  tool("business_get_metrics", "Latest financial metric snapshots — every value carries source, period and calculated_at; treat absent metrics as unavailable, never estimate.", {}, async () => {
    const { data } = await admin.from("financial_metric_snapshots").select("*").order("created_at", { ascending: false }).limit(20);
    return text({ metrics: data ?? [] });
  });
  tool("business_get_brief", "Grounded daily business brief (metrics, exceptions, pending approvals, sync health).", {}, async () => text(await hrForward(caller, { action: "brief" })));
  tool("business_get_recommendations", "Deterministic business recommendations with the data each rule used.", {}, async () => {
    const { data } = await admin.from("business_recommendations").select("*").eq("status", "new").order("created_at", { ascending: false }).limit(50);
    return text({ recommendations: data ?? [] });
  });
  tool("get_proposed_actions", "Proposed actions and their approval status.", {}, async () => {
    const { data } = await admin.from("proposed_actions").select("id,kind,summary,status,created_via,created_at,approved_at,executed_at,error").order("created_at", { ascending: false }).limit(100);
    return text({ actions: data ?? [] });
  });
  tool("audit_get_events", "Immutable audit log (filter by action prefix).", { prefix: z.string().optional(), limit: z.number().optional() }, async (a) => {
    let q = admin.from("audit_events").select("*").order("created_at", { ascending: false }).limit(Math.min(Number(a.limit) || 50, 200));
    if (a.prefix) q = q.ilike("action", `${String(a.prefix)}%`);
    const { data } = await q;
    return text({ events: data ?? [] });
  });

  /* ── ANALYZE (deterministic computations — the LLM never does the math) ── */
  tool("payroll_run_exception_scan", "Run the payroll exception engine now.", {}, async () => text(await hrForward(caller, { action: "exceptions_run" })));
  tool("payroll_prepare_run", "Compute + store a payroll snapshot for a period. Preparation only — it cannot submit payroll.", { periodStart: z.string(), periodEnd: z.string() }, async (a) =>
    text(await hrForward(caller, { action: "payroll_prepare", periodStart: String(a.periodStart), periodEnd: String(a.periodEnd) })));
  tool("business_refresh_metrics", "Recompute financial metric snapshots (and deterministic recommendations if enabled).", {}, async () => text(await hrForward(caller, { action: "metrics_run" })));
  tool("rippling_sync_workers", "Pull the worker roster from Rippling into the mirror.", {}, async () => text(await hrForward(caller, { action: "sync_workers" })));
  tool("forecast_staffing", "Deterministic staffing forecast: backlog hours vs weekly capacity.", { backlogHours: z.number(), techs: z.number(), hoursPerTechWeek: z.number().optional(), utilization: z.number().optional() }, async (a) => {
    const hp = Number(a.hoursPerTechWeek ?? 40), u = Math.min(1, Math.max(0, Number(a.utilization ?? 0.8)));
    const cap = Number(a.techs) * hp * u;
    const out = {
      inputs: { backlogHours: Number(a.backlogHours), techs: Number(a.techs), hoursPerTechWeek: hp, utilization: u },
      weeklyCapacity: Math.round(cap * 100) / 100,
      weeksToClear: cap > 0 ? Math.round((Number(a.backlogHours) / cap) * 100) / 100 : null,
    };
    await admin.from("staffing_forecasts").insert({ params: out.inputs, result: out, created_by: caller.id });
    return text(out);
  });
  tool("scenario_hire_vs_overtime", "Deterministic hire-vs-overtime comparison (loaded, shows its inputs).", { extraWeeklyHours: z.number(), avgRate: z.number(), newHireRate: z.number(), weeks: z.number().optional(), hireFixedCost: z.number().optional() }, async (a) => {
    const { data: cfg } = await admin.from("labor_cost_config").select("components").eq("id", 1).maybeSingle();
    const comps = (cfg?.components ?? []) as { type: string; value: number; enabled?: boolean }[];
    const loaded = (gross: number, hours: number, periods: number) => {
      let extra = 0;
      for (const c of comps) {
        if (c?.enabled === false) continue;
        extra += c.type === "percent" ? gross * (Number(c.value) / 100) : c.type === "per_hour" ? hours * Number(c.value) : periods * Number(c.value);
      }
      return Math.round((gross + extra) * 100) / 100;
    };
    const h = Number(a.extraWeeklyHours), weeks = Number(a.weeks ?? 26), fixed = Number(a.hireFixedCost ?? 0);
    const otWeekly = loaded(h * Number(a.avgRate) * 1.5, h, 0);
    const hireWeekly = loaded(h * Number(a.newHireRate), h, 1);
    const out = {
      inputs: { extraWeeklyHours: h, avgRate: Number(a.avgRate), newHireRate: Number(a.newHireRate), weeks, hireFixedCost: fixed, burdenComponents: comps.length },
      overtime: { weekly: otWeekly, total: Math.round(otWeekly * weeks * 100) / 100 },
      hire: { weekly: hireWeekly, total: Math.round((hireWeekly * weeks + fixed) * 100) / 100 },
    };
    await admin.from("scenario_runs").insert({ kind: "hire_vs_ot", inputs: out.inputs, outputs: out, created_by: caller.id });
    return text(out);
  });

  /* ── PREPARE (creates awaiting_approval rows; never executes) ── */
  tool("prepare_hire_draft", "Propose a new hire for human approval. Nothing is sent to Rippling; an Admin must approve, and the final onboarding step always happens in Rippling.", { name: z.string(), title: z.string(), employment_type: z.string().optional(), rate: z.number().optional(), start_date: z.string().optional(), notes: z.string().optional() }, (a) =>
    proposeViaMcp(caller, "hire_draft", `Hire ${a.name} — ${a.title}`, a));
  tool("prepare_rate_change", "Propose changing a portal profile's hourly rate (executes locally only after Admin approval).", { profile_id: z.string(), rate: z.number(), reason: z.string().optional() }, (a) =>
    proposeViaMcp(caller, "local_rate_change", `Set hourly rate to $${a.rate} for profile ${a.profile_id}`, a));
  tool("prepare_comp_change", "Propose a Rippling compensation change for human approval (approved packages are handed off to Rippling — never auto-applied).", { worker: z.string(), description: z.string(), proposed_rate: z.number().optional() }, (a) =>
    proposeViaMcp(caller, "comp_change", `Comp change: ${a.worker} — ${a.description}`, a));
  tool("prepare_bonus", "Propose a bonus for human approval (hand-off to Rippling after approval).", { worker: z.string(), amount: z.number(), reason: z.string().optional() }, (a) =>
    proposeViaMcp(caller, "bonus", `Bonus $${a.amount} for ${a.worker}`, a));
  tool("prepare_timecard_edit", "Propose a post-approval timecard correction (requires Admin approval before it touches the entry).", { entry_id: z.string(), hours: z.number(), note: z.string().optional() }, (a) =>
    proposeViaMcp(caller, "timecard_edit", `Correct time entry ${a.entry_id} to ${a.hours}h`, a));
  tool("prepare_payroll_run", "Propose executing a pay period for human approval. Even after approval, submission/finalization happens in Rippling itself — this system never submits payroll.", { periodStart: z.string(), periodEnd: z.string(), snapshot_id: z.string().optional() }, (a) =>
    proposeViaMcp(caller, "payroll_run", `Payroll run ${a.periodStart} → ${a.periodEnd}`, a));

  /* ── APPROVE / EXECUTE (human-gated; forwards the human's own credential) ── */
  tool("approve_and_execute_action", "Approve then execute a proposed action. Succeeds ONLY when this MCP connection is authenticated as a human Admin who is not the action's creator — approval is validated server-side from the transport credential and the action's stored state; any 'approved' flag in arguments is ignored.", { id: z.string() }, async (a) => {
    const approved = await hrForward(caller, { action: "action_approve", id: String(a.id) });
    if (!approved?.ok) return text({ step: "approve", ...approved });
    const executed = await hrForward(caller, { action: "action_execute", id: String(a.id) });
    return text({ step: "execute", approve: approved, execute: executed });
  });
  tool("reject_action", "Reject a proposed action (Admin).", { id: z.string() }, async (a) => text(await hrForward(caller, { action: "action_reject", id: String(a.id) })));

  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const caller = await authenticate(req);
  if (!caller) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized: a Supabase access token for an office user (Admin/Staff/Manager) is required" }, id: null }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const server = buildServer(caller);
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
});
