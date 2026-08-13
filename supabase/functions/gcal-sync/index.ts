// gcal-sync — mirrors the ShieldTech schedule (app_state key 'jobs2') into a
// shared Google Workspace calendar ("ShieldTech Schedule") and shares it with
// every @shieldtechsolutions.com user EXCEPT the excluded list.
//
// Google auth: service account with domain-wide delegation, impersonating
// GCAL_IMPERSONATE (a Workspace user who owns the calendar). Setup:
//   1. GCP project → enable Google Calendar API → create a service account.
//   2. Admin console → Security → API controls → Domain-wide delegation →
//      authorize the SA's client ID for scope https://www.googleapis.com/auth/calendar
//   3. Function secrets: GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY (the PEM from
//      the SA JSON key; \n escapes are handled), optional GCAL_IMPERSONATE
//      (default daniel@shieldtechsolutions.com), GCAL_EXCLUDE (comma-separated,
//      default dave@shieldtechsolutions.com), GCAL_TZ (default America/New_York).
//
// POST {} with an Admin/Staff session or x-cron-secret. Idempotent: events get
// stable ids derived from job ids; removed jobs delete their events. Returns
// {ok, data:{calendarId, created, updated, deleted, shared, skipped}}.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const b64url = (buf: Uint8Array | string) => {
  const bytes = typeof buf === "string" ? new TextEncoder().encode(buf) : buf;
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function importPem(pem: string): Promise<CryptoKey> {
  const clean = pem.replace(/\\n/g, "\n").replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/* OAuth token via SA JWT, impersonating `subject` (domain-wide delegation). */
async function googleToken(saEmail: string, key: CryptoKey, subject: string): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: saEmail, sub: subject,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`)));
  const assertion = `${header}.${claims}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const out = await res.json();
  return res.ok ? out.access_token : null;
}

const gcal = (token: string) => async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

/* jobs2 rows → Google event resources. start is a decimal hour; multi-day
   spans become a daily recurrence so each day shows the working window. */
const hhmm = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}:00`;
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  const saEmail = Deno.env.get("GOOGLE_SA_EMAIL");
  const saKeyPem = Deno.env.get("GOOGLE_SA_PRIVATE_KEY");
  if (!saEmail || !saKeyPem) {
    return json(503, {
      ok: false,
      error: "Google Calendar sync not configured — set GOOGLE_SA_EMAIL and GOOGLE_SA_PRIVATE_KEY function secrets (service account with domain-wide delegation for the calendar scope), then sync again.",
    });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // ── Auth: cron secret or Admin/Staff session ──
  const cron = Deno.env.get("CRON_SECRET");
  let authed = Boolean(cron && req.headers.get("x-cron-secret") === cron);
  if (!authed) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (jwt) {
      const { data } = await admin.auth.getUser(jwt);
      if (data?.user) {
        const { data: prof } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        authed = prof?.role === "Admin" || prof?.role === "Staff";
      }
    }
  }
  if (!authed) return json(401, { ok: false, error: "Admin/Staff sign-in required" });

  const impersonate = Deno.env.get("GCAL_IMPERSONATE") ?? "daniel@shieldtechsolutions.com";
  const exclude = (Deno.env.get("GCAL_EXCLUDE") ?? "dave@shieldtechsolutions.com")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const tz = Deno.env.get("GCAL_TZ") ?? "America/New_York";

  const key = await importPem(saKeyPem);
  const token = await googleToken(saEmail, key, impersonate);
  if (!token) return json(502, { ok: false, error: `Google auth failed for ${impersonate} — check domain-wide delegation for the service account's client ID (calendar scope).` });
  const api = gcal(token);

  // ── Calendar: reuse the stored id, else create + remember it ──
  const { data: metaRow } = await admin.from("app_state").select("value").eq("id", "gcal-meta").maybeSingle();
  let calendarId: string | null = metaRow?.value?.calendarId ?? null;
  if (calendarId) {
    const chk = await api("GET", `/calendars/${encodeURIComponent(calendarId)}`);
    if (chk.status === 404) calendarId = null;
  }
  if (!calendarId) {
    const created = await api("POST", "/calendars", { summary: "ShieldTech Schedule", timeZone: tz });
    if (created.status !== 200) return json(502, { ok: false, error: `Could not create calendar: ${created.body?.error?.message ?? created.status}` });
    calendarId = created.body.id;
    await admin.from("app_state").upsert({ id: "gcal-meta", key: "gcal-meta", owner: null, value: { calendarId }, updated_at: new Date().toISOString() });
  }
  const cid = encodeURIComponent(calendarId!);

  // ── Share with every @shieldtechsolutions.com user except the excluded ──
  const { data: profiles } = await admin.from("profiles").select("email, role");
  const domainUsers = (profiles ?? [])
    .map((p) => ({ email: String(p.email ?? "").toLowerCase(), role: p.role }))
    .filter((p) => p.email.endsWith("@shieldtechsolutions.com") && !exclude.includes(p.email));
  let shared = 0;
  for (const u of domainUsers) {
    const role = u.role === "Admin" || u.role === "Staff" ? "writer" : "reader";
    const acl = await api("POST", `/calendars/${cid}/acl?sendNotifications=false`, { role, scope: { type: "user", value: u.email } });
    if (acl.status === 200) shared++;
    // Best-effort: pin the calendar into their list so it appears without any action.
    try {
      const userToken = await googleToken(saEmail, key, u.email);
      if (userToken) await gcal(userToken)("POST", "/users/me/calendarList", { id: calendarId });
    } catch { /* delegation may be limited to the impersonated owner — ACL alone still shares it */ }
  }

  // ── Events: upsert every schedule job, delete events whose job is gone ──
  const { data: jobsRow } = await admin.from("app_state").select("value").eq("id", "jobs2").maybeSingle();
  const jobs: Record<string, unknown>[] = Array.isArray(jobsRow?.value) ? jobsRow.value : [];
  const horizonStart = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const wanted = new Map<string, Record<string, unknown>>();
  let skipped = 0;
  for (const j of jobs) {
    const date = String(j.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; continue; }
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(String(j.endDate ?? "")) && String(j.endDate) >= date ? String(j.endDate) : date;
    if (endDate < horizonStart) continue;   // ancient history stays out of the window
    const start = Number(j.start ?? 9) || 9;
    const dur = Math.max(0.5, Number(j.dur ?? 2) || 2);
    const span = dayDiff(date, endDate) + 1;
    const eventId = ("shieldtechjob" + String(j.id)).toLowerCase().replace(/[^a-v0-9]/g, "");
    const techs = Array.isArray(j.techs) ? j.techs.join(", ") : "";
    wanted.set(eventId, {
      summary: `${j.title ?? "Scheduled job"}${j.customer && j.customer !== "—" ? ` — ${j.customer}` : ""}`,
      description: [
        j.type ? `Type: ${j.type}` : "", techs ? `Crew: ${techs}` : "",
        j.wo ? `Work order: ${j.wo}` : "", j.projectId ? `Project: ${j.projectId}` : "",
        "Synced from the ShieldTech Portal schedule.",
      ].filter(Boolean).join("\n"),
      location: String(j.site ?? "") || undefined,
      start: { dateTime: `${date}T${hhmm(start)}`, timeZone: tz },
      end: { dateTime: `${date}T${hhmm(Math.min(23.5, start + dur))}`, timeZone: tz },
      ...(span > 1 ? { recurrence: [`RRULE:FREQ=DAILY;COUNT=${span}`] } : {}),
      extendedProperties: { private: { shieldtech: "1", jobId: String(j.id) } },
    });
  }

  // Existing synced events (paged), keyed by id.
  const existing = new Map<string, Record<string, unknown>>();
  let pageToken = "";
  do {
    const page = await api("GET", `/calendars/${cid}/events?privateExtendedProperty=shieldtech%3D1&maxResults=250&showDeleted=false${pageToken ? `&pageToken=${pageToken}` : ""}`);
    if (page.status !== 200) break;
    for (const ev of page.body.items ?? []) existing.set(ev.id, ev);
    pageToken = page.body.nextPageToken ?? "";
  } while (pageToken);

  let createdN = 0, updatedN = 0, deletedN = 0;
  for (const [id, body] of wanted) {
    if (existing.has(id)) {
      const r = await api("PUT", `/calendars/${cid}/events/${id}`, body);
      if (r.status === 200) updatedN++;
    } else {
      const r = await api("POST", `/calendars/${cid}/events`, { id, ...body });
      if (r.status === 200) createdN++;
      else if (r.status === 409) { const r2 = await api("PUT", `/calendars/${cid}/events/${id}`, body); if (r2.status === 200) updatedN++; }
    }
  }
  for (const id of existing.keys()) {
    if (!wanted.has(id)) { const r = await api("DELETE", `/calendars/${cid}/events/${id}`); if (r.status === 204) deletedN++; }
  }

  return json(200, { ok: true, data: { calendarId, created: createdN, updated: updatedN, deleted: deletedN, shared, users: domainUsers.length, skipped } });
});
