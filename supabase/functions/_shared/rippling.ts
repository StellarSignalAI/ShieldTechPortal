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
// Endpoint registry — the only paths this integration touches. Each entry is
// in production use already (deployed rippling-sync) or must be verified
// against https://developer.rippling.com/documentation/rest-api before being
// added. DO NOT call Rippling outside this registry.
export const RIPPLING_ENDPOINTS = {
  workers: "/workers",              // GET, cursor-paginated       (in use)
  timeEntries: "/time-entries",     // POST create                 (in use)
  timeEntry: (id: string) => `/time-entries/${encodeURIComponent(id)}`, // GET (in use)
} as const;

export type RipplingInstance = "business" | "hr";

const BASE = Deno.env.get("RIPPLING_API_BASE") ?? "https://rest.ripplingapis.com";
const VERSION = Deno.env.get("RIPPLING_API_VERSION") ?? "";
const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;

function tokenFor(instance: RipplingInstance): string | undefined {
  const specific = instance === "business"
    ? Deno.env.get("BUSINESS_RIPPLING_API_TOKEN")
    : Deno.env.get("HR_RIPPLING_API_TOKEN");
  return specific || Deno.env.get("RIPPLING_API_TOKEN") || undefined;
}

export class RipplingError extends Error {
  status: number;
  correlationId: string;
  constructor(message: string, status: number, correlationId: string) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
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
  if (!token) throw new RipplingError(`Rippling not configured for the ${instance} instance (set ${instance === "business" ? "BUSINESS" : "HR"}_RIPPLING_API_TOKEN)`, 503, cid);

  let lastErr: RipplingError | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250));
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
      // Retry only rate limits and server errors; 4xx are final.
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      clearTimeout(timer);
      lastErr = new RipplingError(
        `Rippling ${path.split("?")[0]} → ${e instanceof DOMException && e.name === "AbortError" ? "timeout" : "network error"}`,
        0,
        cid,
      );
    }
  }
  console.log(JSON.stringify({ evt: "rippling.request", instance, cid, path: path.split("?")[0], status: lastErr?.status ?? 0, error: true }));
  throw lastErr ?? new RipplingError("Rippling request failed", 0, cid);
}

/* Iterate a cursor-paginated collection, yielding each item. */
export async function* ripplingPaginate(
  path: string,
  { limit = 100, maxPages = 50, correlationId, instance }: { limit?: number; maxPages?: number; correlationId?: string; instance?: RipplingInstance } = {},
): AsyncGenerator<Record<string, unknown>> {
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${path}${sep}limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const body = (await ripplingRequest(url, { correlationId, instance })) as Record<string, unknown>;
    const items = (body?.results ?? body?.data ?? []) as Record<string, unknown>[];
    for (const it of items) yield it;
    cursor = (body?.next_cursor as string | undefined) ?? null;
    if (!cursor || items.length === 0) break;
  }
}
