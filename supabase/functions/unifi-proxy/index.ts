// unifi-proxy — ShieldTech OS ↔ Ubiquiti UniFi controllers.
//
// The portal never holds a controller API key. Staff save a controller here
// (service role writes the key), this function talks to the controller, and the
// normalized result lands in unifi_devices / unifi_events for the console.
//
// Supported controllers
//   kind 'site-manager' — UniFi Site Manager cloud API (https://api.ui.com,
//        header X-API-KEY). Gives every console the key can see: hosts, their
//        WAN/ISP health, and the devices adopted on each. Reachable from here
//        without any certificate work.
//   kind 'console'      — a UniFi OS console reached directly (https://<host>).
//        Uses the Network Integration API (/proxy/network/integration/v1),
//        Protect Integration API (/proxy/protect/integration/v1) and Access
//        Developer API (/proxy/access/api/v1/developer). The console must present
//        a certificate this runtime trusts (UniFi OS lets you install one) and
//        be reachable from the internet or via a tunnel — self-signed consoles
//        fail TLS and the error is recorded on the controller row.
//
// POST (Admin/Staff session, or x-cron-secret for sync-all):
//   {action:'status'}                        → controllers (no keys), counts
//   {action:'save', controller:{id?, customer, site, label, kind, host, site_id?, api_key?}}
//   {action:'remove', id}
//   {action:'test', id}                      → reaches the controller, returns health
//   {action:'sync', id} | {action:'sync-all'} → devices + health + events
//   {action:'unlock', id, door_id, actor?}   → Access remote unlock (logged)
//   {action:'snapshot', id, camera_id}       → Protect snapshot as data URL
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Admin = ReturnType<typeof createClient>;
// deno-lint-ignore no-explicit-any
type Any = any;
type Controller = { id: string; customer: string; site: string; label: string | null; kind: "site-manager" | "console"; host: string; site_id: string | null; api_key: string; enabled: boolean };
type Device = { id: string; controller_id: string; customer: string; site: string; kind: string; remote_id: string; name: string; model: string; mac: string; ip: string; status: string; uptime_s: number | null; firmware: string; clients: number | null; raw: unknown };

async function authorize(req: Request, admin: Admin): Promise<{ ok: boolean; cron?: boolean; user?: string }> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return { ok: true, cron: true };
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return { ok: false };
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return { ok: false };
  const { data: p } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const ok = ["Admin", "Staff", "Manager"].includes(p?.role ?? "");
  return { ok, user: data.user.id };
}

const trimHost = (h: string) => h.replace(/\/+$/, "").replace(/^(?!https?:\/\/)/, "https://");
const kindOfNetwork = (d: Any): string => {
  const t = String(d.type ?? d.model ?? "").toLowerCase();
  const f = String(d.features ?? "").toLowerCase();
  if (t.includes("gateway") || t.includes("udm") || t.includes("uxg") || t.includes("ucg") || t === "ugw" || f.includes("gateway")) return "gateway";
  if (t.includes("switch") || t.startsWith("usw") || t.startsWith("us") || t === "usw") return "switch";
  if (t.includes("ap") || t.startsWith("u6") || t.startsWith("u7") || t.startsWith("uap") || t.includes("access point")) return "ap";
  return "device";
};
const onlineOf = (s: Any) => { const v = String(s ?? "").toLowerCase(); return v === "online" || v === "connected" || v === "1" || v === "true" ? "online" : v === "" ? "offline" : v.includes("warn") || v.includes("pending") || v.includes("adopt") ? "warning" : "offline"; };

async function ufetch(c: Controller, path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${trimHost(c.host)}${path}`, { ...init, signal: ctrl.signal, headers: { "X-API-KEY": c.api_key, Accept: "application/json", ...(init.headers ?? {}) } });
  } finally { clearTimeout(t); }
}
async function ujson(c: Controller, path: string, init: RequestInit = {}): Promise<Any> {
  const r = await ufetch(c, path, init);
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
  try { return text ? JSON.parse(text) : null; } catch { throw new Error(`${path} → not JSON`); }
}
const list = (x: Any): Any[] => Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : Array.isArray(x?.data?.data) ? x.data.data : [];

// ── Site Manager (cloud) ──
async function pullSiteManager(c: Controller): Promise<{ devices: Device[]; health: Any }> {
  const hosts = list(await ujson(c, "/v1/hosts"));
  let devicesByHost: Any[] = [];
  try { devicesByHost = list(await ujson(c, "/v1/devices")); } catch { /* older keys: /ea/devices */ try { devicesByHost = list(await ujson(c, "/ea/devices")); } catch { devicesByHost = []; } }
  const devices: Device[] = [];
  let clients = 0; let wan = "unknown"; let isp = "";
  for (const h of hosts) {
    const rep = h.reportedState ?? h.reported_state ?? {};
    const hw = rep.hardware ?? {}; const name = rep.hostname ?? rep.name ?? h.hostname ?? hw.name ?? "Console";
    const hostOnline = (h.state ?? rep.state ?? "").toString().toLowerCase().includes("connected") || h.online === true;
    if (hostOnline) wan = wan === "down" ? "degraded" : "ok"; else wan = wan === "ok" ? "degraded" : "down";
    isp = rep.ispInfo?.name ?? rep.isp?.name ?? isp;
    devices.push({ id: `${c.id}:nvr:${h.id}`, controller_id: c.id, customer: c.customer, site: c.site, kind: /nvr|unvr|protect/i.test(String(hw.shortname ?? name)) ? "nvr" : "gateway", remote_id: String(h.id), name, model: hw.shortname ?? hw.name ?? rep.hardware?.name ?? "", mac: hw.mac ?? rep.mac ?? "", ip: rep.ip ?? h.ipAddress ?? "", status: hostOnline ? "online" : "offline", uptime_s: rep.uptime ?? null, firmware: rep.version ?? rep.firmwareVersion ?? "", clients: null, raw: { host: h.id } });
  }
  for (const hd of devicesByHost) {
    const hostId = hd.hostId ?? hd.host_id ?? hd.id;
    for (const d of list(hd.devices ?? hd)) {
      if (!d || !(d.mac || d.id)) continue;
      const k = kindOfNetwork(d);
      const st = onlineOf(d.status ?? d.state);
      if (typeof d.clients === "number") clients += d.clients;
      devices.push({ id: `${c.id}:${k}:${d.mac ?? d.id}`, controller_id: c.id, customer: c.customer, site: c.site, kind: k, remote_id: String(d.mac ?? d.id), name: d.name ?? d.model ?? "Device", model: d.shortname ?? d.model ?? d.productLine ?? "", mac: d.mac ?? "", ip: d.ip ?? "", status: st, uptime_s: d.uptime ?? null, firmware: d.version ?? d.firmwareVersion ?? "", clients: typeof d.clients === "number" ? d.clients : null, raw: { host: hostId, productLine: d.productLine ?? null } });
    }
  }
  return { devices, health: { wan, isp, clients: clients || null, hosts: hosts.length, devices: devices.length } };
}

// ── Local console: Network + Protect + Access integration APIs ──
async function pullConsole(c: Controller): Promise<{ devices: Device[]; health: Any; events: Any[] }> {
  const devices: Device[] = []; const errors: string[] = []; const events: Any[] = [];
  let clients: number | null = null; let wan = "unknown"; let version = "";
  // Network
  try {
    let siteId = c.site_id;
    if (!siteId) { const sites = list(await ujson(c, "/proxy/network/integration/v1/sites")); siteId = sites[0]?.id ?? "default"; }
    const devs = list(await ujson(c, `/proxy/network/integration/v1/sites/${siteId}/devices?limit=200`));
    for (const d of devs) {
      const k = kindOfNetwork({ type: d.model, features: (d.features ?? []).join(","), model: d.model });
      const st = onlineOf(d.state);
      if (k === "gateway") wan = st === "online" ? "ok" : "down";
      devices.push({ id: `${c.id}:${k}:${d.id}`, controller_id: c.id, customer: c.customer, site: c.site, kind: k, remote_id: String(d.id), name: d.name ?? d.model, model: d.model ?? "", mac: d.macAddress ?? "", ip: d.ipAddress ?? "", status: st, uptime_s: null, firmware: d.firmwareVersion ?? "", clients: null, raw: { features: d.features ?? [] } });
    }
    try { const cl = await ujson(c, `/proxy/network/integration/v1/sites/${siteId}/clients?limit=1`); clients = Number(cl?.totalCount ?? cl?.count ?? (list(cl).length)) || null; } catch { /* optional */ }
    try { const info = await ujson(c, "/proxy/network/integration/v1/info"); version = info?.applicationVersion ?? ""; } catch { /* optional */ }
  } catch (e) { errors.push(`network: ${(e as Error).message}`); }
  // Protect
  try {
    const cams = list(await ujson(c, "/proxy/protect/integration/v1/cameras"));
    for (const cam of cams) {
      const st = onlineOf(cam.state);
      devices.push({ id: `${c.id}:camera:${cam.id}`, controller_id: c.id, customer: c.customer, site: c.site, kind: "camera", remote_id: String(cam.id), name: cam.name ?? cam.modelKey ?? "Camera", model: cam.modelKey ?? cam.type ?? "", mac: cam.mac ?? "", ip: cam.host ?? "", status: st, uptime_s: cam.uptime ? Math.round(Number(cam.uptime) / 1000) : null, firmware: cam.firmwareVersion ?? "", clients: null, raw: { recording: cam.recordingSettings?.mode ?? null, smart: cam.smartDetectSettings?.objectTypes ?? null } });
    }
    try { const nvr = await ujson(c, "/proxy/protect/integration/v1/nvrs"); const n = Array.isArray(nvr) ? nvr[0] : nvr; if (n) devices.push({ id: `${c.id}:nvr:${n.id ?? "nvr"}`, controller_id: c.id, customer: c.customer, site: c.site, kind: "nvr", remote_id: String(n.id ?? "nvr"), name: n.name ?? "Recorder", model: n.type ?? n.model ?? "UNVR", mac: n.mac ?? "", ip: n.host ?? "", status: "online", uptime_s: n.uptime ? Math.round(Number(n.uptime) / 1000) : null, firmware: n.version ?? "", clients: null, raw: { storage: n.storageInfo ?? null } }); } catch { /* optional */ }
  } catch (e) { errors.push(`protect: ${(e as Error).message}`); }
  // Access
  try {
    const doors = list(await ujson(c, "/proxy/access/api/v1/developer/doors"));
    for (const d of doors) {
      const locked = d.door_lock_relay_status ?? d.lock_status ?? "";
      const st = d.is_bind_hub === false ? "warning" : onlineOf(d.status ?? d.hub_status ?? "online");
      devices.push({ id: `${c.id}:door:${d.id}`, controller_id: c.id, customer: c.customer, site: c.site, kind: "door", remote_id: String(d.id), name: d.name ?? d.full_name ?? "Door", model: d.type ?? "Door", mac: "", ip: "", status: st, uptime_s: null, firmware: "", clients: null, raw: { locked: String(locked).toLowerCase() === "lock" || locked === true, position: d.door_position_status ?? null, floor: d.floor_id ?? null } });
    }
    try {
      const since = Math.floor(Date.now() / 1000) - 24 * 3600;
      const logs = await ujson(c, "/proxy/access/api/v1/developer/system/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "door_openings", since, until: Math.floor(Date.now() / 1000), page_num: 1, page_size: 100 }) });
      for (const h of list(logs?.hits ?? logs)) {
        const s = h._source ?? h;
        const actor = s.actor?.display_name ?? s.actor?.name ?? "";
        const door = (s.target ?? []).find((t: Any) => t.type === "door")?.display_name ?? s.event?.display_message ?? "Door";
        const res = String(s.event?.result ?? s.event?.type ?? "").toLowerCase();
        events.push({ controller_id: c.id, customer: c.customer, site: c.site, kind: "door-open", subject: door, actor, result: res.includes("fail") || res.includes("denied") || res.includes("reject") ? "denied" : "granted", detail: { via: s.authentication?.credential_provider ?? s.event?.display_message ?? null, remote_id: s["@id"] ?? h._id ?? null }, at: new Date((Number(s["@timestamp"] ?? s.event?.published ?? Date.now()) < 1e12 ? Number(s["@timestamp"] ?? s.event?.published) * 1000 : Number(s["@timestamp"] ?? s.event?.published)) || Date.now()).toISOString() });
      }
    } catch { /* optional */ }
  } catch (e) { errors.push(`access: ${(e as Error).message}`); }
  if (!devices.length && errors.length === 3) throw new Error(errors.join(" · "));
  return { devices, health: { wan, clients, version, devices: devices.length, cameras: devices.filter(d => d.kind === "camera").length, doors: devices.filter(d => d.kind === "door").length, partial: errors.length ? errors : null }, events };
}

async function syncOne(admin: Admin, c: Controller): Promise<{ ok: boolean; devices: number; error?: string }> {
  try {
    const r = c.kind === "site-manager" ? { ...(await pullSiteManager(c)), events: [] as Any[] } : await pullConsole(c);
    // Offline/online transitions become events.
    const { data: prev } = await admin.from("unifi_devices").select("id, status, name").eq("controller_id", c.id);
    const prevMap = new Map((prev ?? []).map((p: Any) => [p.id, p.status]));
    const transitions = r.devices.filter(d => prevMap.has(d.id) && prevMap.get(d.id) !== d.status && (d.status === "offline" || prevMap.get(d.id) === "offline"))
      .map(d => ({ controller_id: c.id, customer: c.customer, site: c.site, kind: d.status === "offline" ? "device-offline" : "device-online", subject: d.name, actor: "controller", result: "ok", detail: { kind: d.kind, model: d.model }, at: new Date().toISOString() }));
    await admin.from("unifi_devices").delete().eq("controller_id", c.id);
    if (r.devices.length) await admin.from("unifi_devices").upsert(r.devices.map(d => ({ ...d, synced_at: new Date().toISOString() })));
    const evs = [...transitions, ...r.events];
    if (evs.length) {
      // de-dupe door events already stored (by remote id)
      const ids = evs.map(e => e.detail?.remote_id).filter(Boolean);
      let seen = new Set<string>();
      if (ids.length) { const { data: ex } = await admin.from("unifi_events").select("detail").eq("controller_id", c.id).in("detail->>remote_id", ids as string[]); seen = new Set((ex ?? []).map((x: Any) => x.detail?.remote_id)); }
      const fresh = evs.filter(e => !e.detail?.remote_id || !seen.has(e.detail.remote_id));
      if (fresh.length) await admin.from("unifi_events").insert(fresh);
    }
    await admin.from("unifi_controllers").update({ health: r.health, last_sync: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("id", c.id);
    return { ok: true, devices: r.devices.length };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    await admin.from("unifi_controllers").update({ last_error: msg, updated_at: new Date().toISOString() }).eq("id", c.id);
    await admin.from("unifi_events").insert({ controller_id: c.id, customer: c.customer, site: c.site, kind: "sync-error", subject: c.label ?? c.host, actor: "unifi-proxy", result: "error", detail: { message: msg } });
    return { ok: false, devices: 0, error: msg };
  }
}

const publicRow = (c: Any) => { const { api_key: _k, ...rest } = c; return { ...rest, has_key: Boolean(c.api_key) }; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const auth = await authorize(req, admin);
  if (!auth.ok) return json(401, { ok: false, error: "Admin/Staff session or cron secret required" });

  let body: Any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "status");
  const getController = async (id: string): Promise<Controller | null> => { const { data } = await admin.from("unifi_controllers").select("*").eq("id", id).maybeSingle(); return (data as Controller) ?? null; };

  try {
    if (action === "status") {
      const { data: rows } = await admin.from("unifi_controllers").select("*").order("customer").order("site");
      const { count } = await admin.from("unifi_devices").select("id", { count: "exact", head: true });
      return json(200, { ok: true, controllers: (rows ?? []).map(publicRow), devices: count ?? 0 });
    }
    if (action === "save") {
      if (auth.cron) return json(403, { ok: false, error: "session required" });
      const c = body.controller ?? {};
      if (!c.customer || !c.host) return json(400, { ok: false, error: "customer and host are required" });
      const kind = c.kind === "site-manager" ? "site-manager" : "console";
      const host = kind === "site-manager" ? "https://api.ui.com" : trimHost(String(c.host));
      const rec: Any = { customer: String(c.customer), site: String(c.site || "Main site"), label: c.label ? String(c.label) : null, kind, host, site_id: c.site_id ? String(c.site_id) : null, enabled: c.enabled !== false, updated_at: new Date().toISOString() };
      if (c.api_key) rec.api_key = String(c.api_key).trim();
      if (c.id) {
        const { data, error } = await admin.from("unifi_controllers").update(rec).eq("id", c.id).select().single();
        if (error) return json(400, { ok: false, error: error.message });
        return json(200, { ok: true, controller: publicRow(data) });
      }
      if (!rec.api_key) return json(400, { ok: false, error: "api_key is required for a new controller" });
      const { data, error } = await admin.from("unifi_controllers").insert({ ...rec, created_by: auth.user ?? null }).select().single();
      if (error) return json(400, { ok: false, error: error.message });
      return json(200, { ok: true, controller: publicRow(data) });
    }
    if (action === "remove") {
      if (auth.cron) return json(403, { ok: false, error: "session required" });
      await admin.from("unifi_controllers").delete().eq("id", String(body.id));
      return json(200, { ok: true });
    }
    if (action === "test") {
      const c = await getController(String(body.id)); if (!c) return json(404, { ok: false, error: "controller not found" });
      try {
        const r = c.kind === "site-manager" ? await pullSiteManager(c) : await pullConsole(c);
        return json(200, { ok: true, health: r.health, devices: r.devices.length, sample: r.devices.slice(0, 5).map(d => ({ kind: d.kind, name: d.name, model: d.model, status: d.status })) });
      } catch (e) { return json(200, { ok: false, error: (e as Error).message }); }
    }
    if (action === "sync") {
      const c = await getController(String(body.id)); if (!c) return json(404, { ok: false, error: "controller not found" });
      const r = await syncOne(admin, c);
      return json(200, { ...r });
    }
    if (action === "sync-all") {
      const { data: rows } = await admin.from("unifi_controllers").select("*").eq("enabled", true);
      const results: Any[] = [];
      for (const c of (rows ?? []) as Controller[]) results.push({ id: c.id, customer: c.customer, site: c.site, ...(await syncOne(admin, c)) });
      return json(200, { ok: true, results });
    }
    if (action === "unlock") {
      if (auth.cron) return json(403, { ok: false, error: "session required" });
      const c = await getController(String(body.id)); if (!c) return json(404, { ok: false, error: "controller not found" });
      if (c.kind !== "console") return json(400, { ok: false, error: "Remote unlock needs a console connection (Access Developer API); Site Manager keys cannot unlock doors." });
      const doorId = String(body.door_id ?? "");
      const actor = String(body.actor ?? "ShieldTech OS");
      let result = "ok"; let error: string | null = null;
      try { await ujson(c, `/proxy/access/api/v1/developer/doors/${doorId}/unlock`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); }
      catch (e) { result = "error"; error = (e as Error).message; }
      const { data: dev } = await admin.from("unifi_devices").select("name").eq("id", `${c.id}:door:${doorId}`).maybeSingle();
      await admin.from("unifi_events").insert({ controller_id: c.id, customer: c.customer, site: c.site, kind: "remote-unlock", subject: dev?.name ?? doorId, actor, result: result === "ok" ? "granted" : "error", detail: { door_id: doorId, error } });
      return json(200, { ok: result === "ok", error });
    }
    if (action === "snapshot") {
      const c = await getController(String(body.id)); if (!c) return json(404, { ok: false, error: "controller not found" });
      if (c.kind !== "console") return json(400, { ok: false, error: "Snapshots need a console connection (Protect Integration API)." });
      const camId = String(body.camera_id ?? "");
      const r = await ufetch(c, `/proxy/protect/integration/v1/cameras/${camId}/snapshot?highQuality=${body.hq ? "true" : "false"}`, {}, 12000);
      if (!r.ok) return json(200, { ok: false, error: `snapshot → HTTP ${r.status}` });
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 0x8000)));
      return json(200, { ok: true, dataUrl: `data:${r.headers.get("content-type") ?? "image/jpeg"};base64,${btoa(bin)}`, at: Date.now() });
    }
    return json(400, { ok: false, error: `unknown action ${action}` });
  } catch (e) {
    return json(500, { ok: false, error: (e as Error).message ?? String(e) });
  }
});
