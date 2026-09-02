// deno test --allow-env supabase/functions/_shared/rippling.test.ts
// Client behavior with mocked fetch: error categories, Retry-After, retries,
// pagination, and the rule that a failure is never a silent empty result.
import { RipplingError, ripplingPaginate, ripplingRequest } from "./rippling.ts";

const te = new TextEncoder();
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(te.encode(JSON.stringify(body)), { status, headers: { "Content-Type": "application/json", ...headers } });

function withFetch(fn: (calls: string[]) => Promise<void>, impl: (url: string, n: number) => Response | Promise<Response>) {
  return async () => {
    const calls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = ((url: RequestInfo | URL) => {
      const u = String(url);
      calls.push(u);
      return Promise.resolve(impl(u, calls.length));
    }) as typeof fetch;
    try { await fn(calls); } finally { globalThis.fetch = orig; }
  };
}

const setToken = (v: string | null) => {
  if (v == null) { Deno.env.delete("HR_RIPPLING_API_TOKEN"); Deno.env.delete("RIPPLING_API_TOKEN"); Deno.env.delete("BUSINESS_RIPPLING_API_TOKEN"); }
  else Deno.env.set("HR_RIPPLING_API_TOKEN", v);
};

Deno.test("missing token → RIPPLING_SECRET_MISSING, no network call", withFetch(async (calls) => {
  setToken(null);
  try {
    await ripplingRequest("/workers", { instance: "hr" });
    throw new Error("should have thrown");
  } catch (e) {
    if (!(e instanceof RipplingError)) throw e;
    if (e.category !== "RIPPLING_SECRET_MISSING") throw new Error("wrong category: " + e.category);
    if (e.sanitized().includes("test-token")) throw new Error("token leaked");
  }
  if (calls.length !== 0) throw new Error("network was called without a token");
}, () => json(200, {})));

Deno.test("401 → RIPPLING_UNAUTHORIZED, single attempt, sanitized", withFetch(async (calls) => {
  setToken("test-token-abc");
  try {
    await ripplingRequest("/workers", { instance: "hr" });
    throw new Error("should have thrown");
  } catch (e) {
    if (!(e instanceof RipplingError) || e.category !== "RIPPLING_UNAUTHORIZED") throw new Error("wrong category");
    if (e.sanitized().includes("test-token-abc")) throw new Error("token leaked into error");
  }
  if (calls.length !== 1) throw new Error("401 must not be retried, calls=" + calls.length);
}, () => json(401, { message: "bad credentials" })));

Deno.test("403 → RIPPLING_FORBIDDEN", withFetch(async () => {
  setToken("t");
  try { await ripplingRequest("/workers", { instance: "hr" }); throw new Error("no throw"); }
  catch (e) { if (!(e instanceof RipplingError) || e.category !== "RIPPLING_FORBIDDEN") throw new Error("wrong category"); }
}, () => json(403, { message: "insufficient scope" })));

Deno.test("429 with Retry-After retries then succeeds", withFetch(async (calls) => {
  setToken("t");
  const out = await ripplingRequest("/workers", { instance: "hr" }) as { ok: boolean };
  if (!out.ok) throw new Error("expected success after retry");
  if (calls.length !== 2) throw new Error("expected exactly 2 attempts, got " + calls.length);
}, (_u, n) => n === 1 ? json(429, { message: "slow down" }, { "Retry-After": "1" }) : json(200, { ok: true })));

Deno.test("persistent 429 → RIPPLING_RATE_LIMITED after retries", withFetch(async (calls) => {
  setToken("t");
  try { await ripplingRequest("/workers", { instance: "hr" }); throw new Error("no throw"); }
  catch (e) { if (!(e instanceof RipplingError) || e.category !== "RIPPLING_RATE_LIMITED") throw new Error("wrong category"); }
  if (calls.length !== 4) throw new Error("expected 4 attempts (1+3 retries), got " + calls.length);
}, () => json(429, {}, { "Retry-After": "0" })));

Deno.test("500 retried then success", withFetch(async (calls) => {
  setToken("t");
  await ripplingRequest("/workers", { instance: "hr" });
  if (calls.length !== 2) throw new Error("expected retry on 500");
}, (_u, n) => n === 1 ? json(500, {}) : json(200, { fine: true })));

Deno.test("pagination walks every cursor page and stops", withFetch(async (calls) => {
  setToken("t");
  const items: unknown[] = [];
  for await (const w of ripplingPaginate("/workers", { instance: "hr", limit: 2 })) items.push(w);
  if (items.length !== 5) throw new Error("expected 5 items across pages, got " + items.length);
  if (calls.length !== 3) throw new Error("expected 3 page fetches, got " + calls.length);
  if (!calls[1].includes("cursor=c1")) throw new Error("cursor not forwarded");
}, (u) => {
  if (u.includes("cursor=c2")) return json(200, { results: [{ id: 5 }], next_cursor: null });
  if (u.includes("cursor=c1")) return json(200, { results: [{ id: 3 }, { id: 4 }], next_cursor: "c2" });
  return json(200, { results: [{ id: 1 }, { id: 2 }], next_cursor: "c1" });
}));

Deno.test("successful empty page → genuinely empty, not an error", withFetch(async () => {
  setToken("t");
  const items: unknown[] = [];
  for await (const w of ripplingPaginate("/workers", { instance: "hr" })) items.push(w);
  if (items.length !== 0) throw new Error("expected zero items");
}, () => json(200, { results: [], next_cursor: null })));

Deno.test("failure inside pagination surfaces as an error, never []", withFetch(async () => {
  setToken("t");
  const items: unknown[] = [];
  let threw = false;
  try { for await (const w of ripplingPaginate("/workers", { instance: "hr" })) items.push(w); }
  catch (e) { threw = e instanceof RipplingError && e.category === "RIPPLING_UNAUTHORIZED"; }
  if (!threw) throw new Error("pagination swallowed the failure");
}, () => json(401, {})));
