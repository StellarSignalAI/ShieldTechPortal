// deno test supabase/functions/_shared/dates.test.ts
import { addDays, mondayOf, nyToday, within } from "./dates.ts";

Deno.test("nyToday uses America/New_York calendar date", () => {
  // 2026-09-02T02:00Z is still 2026-09-01 22:00 in New York (EDT, UTC-4).
  if (nyToday(new Date("2026-09-02T02:00:00Z")) !== "2026-09-01") throw new Error("late-evening NY date wrong");
  // 2026-09-02T12:00Z is 2026-09-02 08:00 in New York.
  if (nyToday(new Date("2026-09-02T12:00:00Z")) !== "2026-09-02") throw new Error("daytime NY date wrong");
  // Winter (EST, UTC-5): 2026-01-10T04:30Z → 2026-01-09 23:30 NY.
  if (nyToday(new Date("2026-01-10T04:30:00Z")) !== "2026-01-09") throw new Error("EST boundary wrong");
});

Deno.test("mondayOf anchors any weekday to its Monday", () => {
  if (mondayOf("2026-09-02") !== "2026-08-31") throw new Error("Wednesday → Monday failed"); // Wed
  if (mondayOf("2026-08-31") !== "2026-08-31") throw new Error("Monday identity failed");
  if (mondayOf("2026-09-06") !== "2026-08-31") throw new Error("Sunday belongs to prior Monday");
});

Deno.test("addDays and within", () => {
  if (addDays("2026-08-31", 6) !== "2026-09-06") throw new Error("addDays failed");
  if (!within("2026-09-02", "2026-08-31", "2026-09-06")) throw new Error("within inclusive failed");
  if (within("2026-09-07", "2026-08-31", "2026-09-06")) throw new Error("within exclusive failed");
  if (within("2026-09-02", null, "2026-09-06")) throw new Error("missing bound must be false");
  if (!within("2026-09-02", "2026-08-31T00:00:00Z", "2026-09-06T23:59:59Z")) throw new Error("timestamp bounds trimmed");
});
