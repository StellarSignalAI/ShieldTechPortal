// Date helpers for ShieldTech reporting: business dates are interpreted in
// America/New_York; timestamps stay UTC. Pure functions — tested in dates.test.ts.

/* Today's calendar date in America/New_York as YYYY-MM-DD. */
export function nyToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

/* Monday of the week containing the given YYYY-MM-DD (date math in UTC on the
   calendar date, so no DST drift). */
export function mondayOf(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/* dateISO + n days, as YYYY-MM-DD. */
export function addDays(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* Whether dateISO falls inside [startISO, endISO] (inclusive, calendar dates). */
export function within(dateISO: string, startISO?: string | null, endISO?: string | null): boolean {
  if (!startISO || !endISO) return false;
  return dateISO >= startISO.slice(0, 10) && dateISO <= endISO.slice(0, 10);
}
