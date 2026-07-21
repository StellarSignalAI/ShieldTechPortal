// sources-poll — registry reachability check for bid-source portals.
// POST (no body) with an Admin/Staff session or x-cron-secret header.
// HEAD/GETs each source URL and records last_checked / last_ok / last_error.
import { createClient } from "npm:@supabase/supabase-js@2";

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

async function checkUrl(url: string): Promise<{ ok: boolean; error: string | null }> {
  const attempt = async (method: string) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: ctrl.signal });
      // Any HTTP response (even 403/405 bot walls) proves the portal is reachable.
      return { ok: res.status < 500, error: res.status < 500 ? null : `HTTP ${res.status}` };
    } finally {
      clearTimeout(t);
    }
  };
  try {
    return await attempt("HEAD");
  } catch {
    try {
      return await attempt("GET");
    } catch (e) {
      return { ok: false, error: String(e).slice(0, 300) };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  if (!(await authorize(req, admin))) {
    return json(401, { ok: false, error: "Admin/Staff session or CRON_SECRET required" });
  }

  const { data: sources, error } = await admin.from("sources").select("id, url");
  if (error) return json(500, { ok: false, error: error.message });

  const now = new Date().toISOString();
  const results = await Promise.all(
    (sources ?? []).map(async (s: { id: string; url: string }) => {
      const r = await checkUrl(s.url);
      await admin.from("sources").update({ last_checked: now, last_ok: r.ok, last_error: r.error }).eq("id", s.id);
      return { id: s.id, ok: r.ok, error: r.error };
    }),
  );
  return json(200, { ok: true, data: { checked: results.length, results } });
});
