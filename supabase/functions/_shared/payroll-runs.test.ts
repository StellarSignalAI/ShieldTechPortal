// deno test supabase/functions/_shared/payroll-runs.test.ts
import { mapRun, summarizePayrollRuns } from "./payroll-runs.ts";

const run = (id: string, state: string, check: string, ppStart: string, ppEnd: string, extra: Record<string, unknown> = {}) => ({
  id, run_state: state, check_date: check, run_type: "REGULAR",
  pay_period: { start_date: ppStart, end_date: ppEnd, pay_frequency: "WEEKLY" },
  ...extra,
});

Deno.test("runs sorted newest-first by check_date", () => {
  const s = summarizePayrollRuns([
    run("a", "PAID", "2026-08-14", "2026-08-03", "2026-08-09"),
    run("c", "DRAFT", "2026-09-04", "2026-08-31", "2026-09-06"),
    run("b", "PAID", "2026-08-28", "2026-08-17", "2026-08-23"),
  ], "2026-09-02");
  if (s.runs.map((r) => r.id).join(",") !== "c,b,a") throw new Error("sort wrong: " + s.runs.map((r) => r.id));
});

Deno.test("current run = pay_period covering today", () => {
  const s = summarizePayrollRuns([
    run("old", "PAID", "2026-08-28", "2026-08-17", "2026-08-23"),
    run("cur", "DRAFT", "2026-09-11", "2026-08-31", "2026-09-06"),
  ], "2026-09-02");
  if (s.current_run?.id !== "cur") throw new Error("current run wrong: " + s.current_run?.id);
  // A day outside every period → no current run, never a guessed one.
  const none = summarizePayrollRuns([run("x", "PAID", "2026-08-28", "2026-08-17", "2026-08-23")], "2026-09-02");
  if (none.current_run !== null) throw new Error("must be null outside all periods");
});

Deno.test("most recent completed = latest PAID (by paid_at, then check_date)", () => {
  const s = summarizePayrollRuns([
    run("p1", "PAID", "2026-08-14", "2026-08-03", "2026-08-09", { paid_at: "2026-08-14T12:00:00Z" }),
    run("p2", "PAID", "2026-08-28", "2026-08-17", "2026-08-23", { paid_at: "2026-08-28T12:00:00Z" }),
    run("ap", "APPROVED", "2026-09-04", "2026-08-24", "2026-08-30"),
    run("dr", "DRAFT", "2026-09-11", "2026-08-31", "2026-09-06"),
  ], "2026-09-02");
  if (s.most_recent_completed?.id !== "p2") throw new Error("completed wrong: " + s.most_recent_completed?.id);
  // No PAID run at all → null, not the newest DRAFT/APPROVED run.
  const none = summarizePayrollRuns([run("dr", "DRAFT", "2026-09-11", "2026-08-31", "2026-09-06")], "2026-09-02");
  if (none.most_recent_completed !== null) throw new Error("a non-PAID run must never count as completed");
});

Deno.test("derived schedule: modal frequency + next future check date, labeled derived", () => {
  const s = summarizePayrollRuns([
    run("a", "PAID", "2026-08-28", "2026-08-17", "2026-08-23"),
    run("b", "DRAFT", "2026-09-04", "2026-08-31", "2026-09-06"),
  ], "2026-09-02");
  if (s.derived_schedule?.pay_frequency !== "WEEKLY") throw new Error("frequency wrong");
  if (s.derived_schedule?.next_check_date !== "2026-09-04") throw new Error("next check date wrong");
  if (s.derived_schedule?.basis !== "derived_from_verified_runs") throw new Error("basis label wrong");
});

Deno.test("empty input → all nulls, no invention", () => {
  const s = summarizePayrollRuns([], "2026-09-02");
  if (s.runs.length !== 0 || s.current_run || s.most_recent_completed || s.derived_schedule) throw new Error("empty must stay empty");
});

Deno.test("mapRun passes through only verified fields", () => {
  const m = mapRun({ id: "x", run_state: "PAID", check_date: "2026-08-28", secret_extra: "drop-me", pay_period: { start_date: "a", end_date: "b", pay_frequency: "WEEKLY" } });
  if ((m as Record<string, unknown>).secret_extra !== undefined) throw new Error("unverified field leaked through");
  if (m.pay_period?.pay_frequency !== "WEEKLY") throw new Error("pay_period lost");
});
