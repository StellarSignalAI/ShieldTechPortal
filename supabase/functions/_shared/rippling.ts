// Centralized Rippling REST API client. EVERY Rippling call in this codebase
// goes through this module so the endpoint surface stays auditable in one
// place. Base: https://rest.ripplingapis.com (override: RIPPLING_API_BASE).
// Optional Rippling-API-Version header from RIPPLING_API_VERSION.
// Cursor pagination (limit/cursor → next_cursor).
//
// TWO INSTANCES, TWO CREDENTIALS — never mixed:
//   'business' → BUSINESS_RIPPLING_API_TOKEN   (ShieldTech Business MCP)
//   'hr'       → HR_RIPPLING_API_TOKEN         (ShieldTech HR/Payroll MCP + sync)
// Each falls back to the legacy RIPPLING_API_TOKEN so a single-token setup
// keeps working; setting the per-instance secrets makes them independently
// revocable. Tokens never appear in logs, errors, or responses.
//
// Endpoint registry — the only paths this integration touches. Every path is
// verified against the official generated client @rippling/rippling-sdk
// 0.2.0-alpha.85 (2026-09-02): trailing-slash forms, GET lists paginated via
// {results, next_link} with a `cursor` request param. Entitlements per the
// SDK docstrings: workers/companies = "API Tier 1", time-cards/time-entries =
// "API Tier 2", payroll-runs = "Global Payroll".
// DO NOT call Rippling outside this registry.
export const RIPPLING_ENDPOINTS = {
  workers: "/workers/",             // GET list (SDK: workers.list)
  timeEntries: "/time-entries/",    // POST create (pre-existing use) · GET list (SDK: timeEntries.list)
  timeEntry: (id: string) => `/time-entries/${encodeURIComponent(id)}/`, // GET (SDK: timeEntries.retrieve)
  companies: "/companies/",         // GET list (SDK: companies.list)
  departments: "/departments/",     // GET list (SDK: departments.list)
  timeCards: "/time-cards/",        // GET list (SDK: timeCards.list; params cursor/expand/filter/order_by)
  payrollRuns: "/payroll-runs/",    // GET list (SDK: payrollRuns.list; Global Payroll; sortable check_date)
  payrollRun: (id: string) => `/payroll-runs/${encodeURIComponent(id)}/`, // GET (SDK: payrollRuns.retrieve)
  // Verified but NOT exposed to MCP output: per-worker tax/deduction/garnishment
  // line items are sensitive (SDK: payrollRuns.workerPayrollRecords.list).
  workerPayrollRecords: (runId: string) => `/payroll-runs/${encodeURIComponent(runId)}/worker-payroll-records/`,
} as const;

export type RipplingInstance = "business" | "hr";

const BASE = Deno.env.get("RIPPLING_API_BASE") ?? "https://rest.ripplingapis.com";
// Default matches the official SDK's pinned header (client.js: 'Rippling-Api-Version': '2024-08-01').
const VERSION = Deno.env.get("RIPPLING_API_VERSION") ?? "2024-08-01";
const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;

function tokenFor(instance: RipplingInstance): string | undefined {
  const specific = instance === "business"
    ? Deno.env.get("BUSINESS_RIPPLING_API_TOKEN")
    : Deno.env.get("HR_RIPPLING_API_TOKEN");
  return specific || Deno.env.get("RIPPLING_API_TOKEN") || undefined;
}

export type RipplingErrorCategory =
  | "RIPPLING_SECRET_MISSING"
  | "RIPPLING_UNAUTHORIZED"
  | "RIPPLING_FORBIDDEN"
  | "RIPPLING_RATE_LIMITED"
  | "RIPPLING_TIMEOUT"
  | "RIPPLING_NETWORK_ERROR"
  | "RIPPLING_BAD_RESPONSE";

export function categorize(status: number, timeout = false): RipplingErrorCategory {
  if (timeout) return "RIPPLING_TIMEOUT";
  if (status === 0) return "RIPPLING_NETWORK_ERROR";
  if (status === 401) return "RIPPLING_UNAUTHORIZED";
  if (status === 403) return "RIPPLING_FORBIDDEN";
  if (status === 429) return "RIPPLING_RATE_LIMITED";
  if (status === 503 && !Deno.env.get("RIPPLING_API_TOKEN") && !Deno.env.get("HR_RIPPLING_API_TOKEN") && !Deno.env.get("BUSINESS_RIPPLING_API_TOKEN")) return "RIPPLING_SECRET_MISSING";
  return "RIPPLING_BAD_RESPONSE";
}

export class RipplingError extends Error {
  status: number;
  correlationId: string;
  category: RipplingErrorCategory;
  constructor(message: string, status: number, correlationId: string, category?: RipplingErrorCategory) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
    this.category = category ?? categorize(status);
  }
  /* Sanitized, category-first string safe for storage/UI (never a token). */
  sanitized(): string {
    return `[${this.category}] ${this.message}`.slice(0, 400);
  }
}

/* Which credentials exist (never the values). dedicated=false means that
   instance is riding on the shared legacy token. */
export function ripplingCredentialStatus() {
  return {
    business: { configured: Boolean(tokenFor("business")), dedicated: Boolean(Deno.env.get("BUSINESS_RIPPLING_API_TOKEN")) },
    hr: { configured: Boolean(tokenFor("hr")), dedicated: Boolean(Deno.env.get("HR_RIPPLING_API_TOKEN")) },
  };
}

export function ripplingConfigured(instance: RipplingInstance = "hr"): boolean {
  return Boolean(tokenFor(instance));
}

/* One request with timeout + retry/backoff on 429/5xx. The token is read here
   and never included in thrown errors, logs, or return values. */
export async function ripplingRequest(
  path: string,
  init?: RequestInit & { correlationId?: string; instance?: RipplingInstance },
): Promise<unknown> {
  const instance: RipplingInstance = init?.instance ?? "hr";
  const token = tokenFor(instance);
  const cid = init?.correlationId ?? crypto.randomUUID().slice(0, 8);
  if (!token) throw new RipplingError(`Rippling not configured for the ${instance} instance (set ${instance === "business" ? "BUSINESS" : "HR"}_RIPPLING_API_TOKEN)`, 503, cid, "RIPPLING_SECRET_MISSING");

  let lastErr: RipplingError | null = null;
  let retryAfterMs: number | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250;
      await new Promise((r) => setTimeout(r, retryAfterMs != null ? Math.min(15_000, retryAfterMs) : backoff));
      retryAfterMs = null;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(VERSION ? { "Rippling-API-Version": VERSION } : {}),
          "X-Correlation-Id": cid,
          ...(init?.headers ?? {}),
        },
      });
      clearTimeout(timer);
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(JSON.stringify({ evt: "rippling.request", instance, cid, path: path.split("?")[0], status: res.status, attempt }));
        return body;
      }
      const msg = typeof (body as { message?: unknown })?.message === "string"
        ? (body as { message: string }).message
        : `HTTP ${res.status}`;
      lastErr = new RipplingError(`Rippling ${path.split("?")[0]} → ${res.status}: ${msg.slice(0, 300)}`, res.status, cid);
      // Retry only rate limits and server errors; 4xx are final. Honor Retry-After.
      if (res.status === 429) {
        const ra = Number(res.headers.get("Retry-After"));
        if (Number.isFinite(ra) && ra > 0) retryAfterMs = ra * 1000;
      }
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      clearTimeout(timer);
      const isTimeout = e instanceof DOMException && e.name === "AbortError";
      lastErr = new RipplingError(
        `Rippling ${path.split("?")[0]} → ${isTimeout ? "timeout" : "network error"}`,
        0,
        cid,
        isTimeout ? "RIPPLING_TIMEOUT" : "RIPPLING_NETWORK_ERROR",
      );
    }
  }
  console.log(JSON.stringify({ evt: "rippling.request", instance, cid, path: path.split("?")[0], status: lastErr?.status ?? 0, error: true }));
  throw lastErr ?? new RipplingError("Rippling request failed", 0, cid);
}

/* Iterate a cursor-paginated collection, yielding each item.
   Official pagination model (SDK PageCursorURL): the response body is
   {results: [...], next_link: "<absolute URL of the next page>"}; requests
   accept a `cursor` param. We follow next_link (reduced to its path+query so
   the base URL stays ours), with a next_cursor fallback for compatibility. */
export async function* ripplingPaginate(
  path: string,
  { maxPages = 50, correlationId, instance }: { limit?: number; maxPages?: number; correlationId?: string; instance?: RipplingInstance } = {},
): AsyncGenerator<Record<string, unknown>> {
  let nextPath: string | null = path;
  for (let page = 0; page < maxPages && nextPath; page++) {
    const body = (await ripplingRequest(nextPath, { correlationId, instance })) as Record<string, unknown>;
    const items = (body?.results ?? body?.data ?? []) as Record<string, unknown>[];
    for (const it of items) yield it;
    const nextLink = body?.next_link as string | undefined;
    const nextCursor = body?.next_cursor as string | undefined;
    if (nextLink) {
      try {
        const u = new URL(nextLink, BASE);
        nextPath = `${u.pathname}${u.search}`;
      } catch {
        nextPath = null;
      }
    } else if (nextCursor) {
      const sep = path.includes("?") ? "&" : "?";
      nextPath = `${path}${sep}cursor=${encodeURIComponent(nextCursor)}`;
    } else {
      nextPath = null;
    }
    if (items.length === 0) break;
  }
}
