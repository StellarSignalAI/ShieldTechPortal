// Shared read/write for the live lead-scraping config (public.lead_config, one
// row id=1). The scrapers call getRegions()/getConfig() at run time so targeting
// changes take effect without a redeploy; the AI service calls updateConfig()
// when the user asks it to change scraping in chat.
// deno-lint-ignore-file no-explicit-any

const DEFAULT_REGIONS = ["NJ", "PA", "MD", "VA"];

export interface LeadConfig { regions: string[]; keywords: string[]; enabled: boolean; }

export async function getConfig(admin: any): Promise<LeadConfig> {
  try {
    const { data } = await admin.from("lead_config").select("regions, keywords, enabled").eq("id", 1).maybeSingle();
    if (data) {
      return {
        regions: Array.isArray(data.regions) && data.regions.length ? data.regions.map((s: string) => s.toUpperCase()) : DEFAULT_REGIONS,
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        enabled: data.enabled !== false,
      };
    }
  } catch { /* table missing / not migrated yet — fall back */ }
  return { regions: DEFAULT_REGIONS, keywords: [], enabled: true };
}

export async function getRegions(admin: any): Promise<string[]> {
  return (await getConfig(admin)).regions;
}

// Apply a change set. Any of set/add/remove for regions + keywords. Returns the
// resulting config. `by` is the acting user's id (for the audit column).
export async function updateConfig(admin: any, patch: {
  regions?: string[]; addRegions?: string[]; removeRegions?: string[];
  keywords?: string[]; addKeywords?: string[]; removeKeywords?: string[];
  enabled?: boolean;
}, by?: string): Promise<LeadConfig> {
  const cur = await getConfig(admin);
  const up = (a: string[]) => a.map((s) => s.trim().toUpperCase()).filter(Boolean);
  const lo = (a: string[]) => a.map((s) => s.trim()).filter(Boolean);

  let regions = patch.regions ? up(patch.regions) : cur.regions.slice();
  if (patch.addRegions) for (const r of up(patch.addRegions)) if (!regions.includes(r)) regions.push(r);
  if (patch.removeRegions) { const rm = new Set(up(patch.removeRegions)); regions = regions.filter((r) => !rm.has(r)); }

  let keywords = patch.keywords ? lo(patch.keywords) : cur.keywords.slice();
  if (patch.addKeywords) for (const k of lo(patch.addKeywords)) if (!keywords.includes(k)) keywords.push(k);
  if (patch.removeKeywords) { const rm = new Set(lo(patch.removeKeywords)); keywords = keywords.filter((k) => !rm.has(k)); }

  const enabled = patch.enabled ?? cur.enabled;
  await admin.from("lead_config").upsert({
    id: 1, regions, keywords, enabled, updated_by: by ?? null, updated_at: new Date().toISOString(),
  });
  return { regions, keywords, enabled };
}
