// Shared plumbing for the two ShieldTech MCP server instances
// (mcp-business and mcp-hr). The instances stay independently authenticated,
// deployable, auditable and revocable — this module only removes duplicated
// code, it never mixes their credentials:
//   • Rippling credential: chosen per instance in _shared/rippling.ts
//     (BUSINESS_RIPPLING_API_TOKEN vs HR_RIPPLING_API_TOKEN).
//   • MCP access credential: each instance can require its own access key
//     (MCP_BUSINESS_ACCESS_KEY / MCP_HR_ACCESS_KEY via the x-mcp-key header)
//     on top of the caller's Supabase user JWT. Rotate or clear one key to
//     revoke that instance without touching the other.
//   • Every audit row carries the instance name.
import { createClient } from "npm:@supabase/supabase-js@2";

export type AdminClient = ReturnType<typeof createClient>;

export interface McpCaller { id: string; name: string; role: string; jwt: string }

export const mcpCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mcp-key, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export function makeAdmin(): AdminClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/* Instance auth: optional per-instance access key (if the env var is set the
   header must match), then a Supabase user JWT belonging to an office user.
   Returns the caller or an error string (never both). */
export async function mcpAuthenticate(
  req: Request,
  admin: AdminClient,
  accessKeyEnv: string,
): Promise<{ caller?: McpCaller; error?: string }> {
  const requiredKey = Deno.env.get(accessKeyEnv);
  if (requiredKey && req.headers.get("x-mcp-key") !== requiredKey) {
    return { error: `Invalid or missing x-mcp-key for this MCP instance (${accessKeyEnv} is set)` };
  }
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return { error: "A Supabase user access token is required (Authorization: Bearer …)" };
  const { data } = await admin.auth.getUser(jwt);
  if (!data?.user) return { error: "Invalid or expired user token" };
  const { data: p } = await admin.from("profiles").select("name,role").eq("id", data.user.id).maybeSingle();
  if (!p || !["Admin", "Staff", "Manager"].includes(p.role ?? "")) {
    return { error: "Only office users (Admin/Staff/Manager) may use this MCP instance" };
  }
  return { caller: { id: data.user.id, name: p.name ?? "", role: p.role, jwt } };
}

/* OAuth resource-server plumbing (RFC 9728 / MCP authorization spec), so
   OAuth-capable MCP clients — ChatGPT Business custom connectors included —
   can discover the Supabase Auth OAuth 2.1 server and log a real portal user
   in. The MCP endpoint never sees a client secret; it just validates the
   Supabase-issued access token like any other user JWT. */
export function resourceUrl(slug: string): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/${slug}`;
}

export function protectedResourceMetadata(slug: string, name: string): Response {
  return new Response(JSON.stringify({
    resource: resourceUrl(slug),
    authorization_servers: [`${Deno.env.get("SUPABASE_URL")}/auth/v1`],
    bearer_methods_supported: ["header"],
    resource_name: name,
    resource_documentation: "https://github.com/StellarSignalAI/ShieldTechPortal/blob/main/docs/chatgpt-rippling-mcp.md",
  }), { status: 200, headers: { ...mcpCors, "Content-Type": "application/json" } });
}

export function mcpUnauthorized(slug: string, instance: string, error: string): Response {
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    error: { code: -32001, message: `Unauthorized (${instance}): ${error}` },
    id: null,
  }), {
    status: 401,
    headers: {
      ...mcpCors,
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="${instance}", resource_metadata="${resourceUrl(slug)}/.well-known/oauth-protected-resource"`,
    },
  });
}

export const mcpText = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 1).slice(0, 60_000) }] });
export const mcpError = (msg: string) => ({ content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: msg }) }], isError: true });

/* Forward an operation to the hr function using the human caller's own JWT,
   so role checks, flag gates, the approval state machine and audit logging
   run in exactly one place. */
export async function hrForward(caller: McpCaller, body: Record<string, unknown>) {
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/hr`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${caller.jwt}` },
    body: JSON.stringify(body),
  });
  return await res.json();
}

export async function auditMcp(
  admin: AdminClient, caller: McpCaller, instance: string, action: string,
  subjectType?: string, subjectId?: string, details?: Record<string, unknown>,
) {
  await admin.from("audit_events").insert({
    actor: caller.id, actor_name: caller.name, actor_role: caller.role,
    action, subject_type: subjectType ?? null, subject_id: subjectId ?? null,
    details: { ...(details ?? {}), instance },
  });
}

/* Create a proposed action in awaiting_approval — the only write capability
   an MCP tool call itself can perform. Approval and execution are server-side
   in the hr function and require a human Admin. */
export async function mcpPropose(
  admin: AdminClient, caller: McpCaller, instance: string,
  kind: string, summary: string, payload: Record<string, unknown>,
) {
  const { data, error } = await admin.from("proposed_actions").insert({
    kind, summary, payload, status: "awaiting_approval",
    created_by: caller.id, created_via: "mcp",
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  }).select("id, kind, summary, status, expires_at").single();
  if (error) return mcpError(error.message);
  await auditMcp(admin, caller, instance, "action.proposed", "proposed_action", data.id, { kind });
  return mcpText({
    ok: true, action: data,
    note: "Created in awaiting_approval. A human Admin (other than this action's creator) must approve it before anything happens; an 'approved' flag in tool arguments is never read.",
  });
}
