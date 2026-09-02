// Pure helpers over VERIFIED Rippling payroll-run objects.
// Contract source: official @rippling/rippling-sdk 0.2.0-alpha.85 type
// declarations (resources/payroll-runs/payroll-runs.d.ts, 2026-09-02):
//   GET /payroll-runs/ → { id, approval_deadline, approved_at, check_date,
//     company_entity_id, country_code, debit_date, lock_deadline, paid_at,
//     pay_period { start_date, end_date, pay_frequency }, payment_type,
//     run_state (e.g. DRAFT, APPROVED, PAID), run_type (REGULAR, OFF_CYCLE,
//     CORRECTION), title }  — requires the "Global Payroll" entitlement.
// All fields are passed through unmodified; nothing here invents values.

export interface PayrollRunLite {
  id?: string;
  title?: string;
  run_state?: string;
  run_type?: string;
  check_date?: string;
  debit_date?: string;
  paid_at?: string;
  approved_at?: string;
  approval_deadline?: string;
  pay_period?: { start_date?: string; end_date?: string; pay_frequency?: string };
  payment_type?: string;
  country_code?: string;
}

/* Keep only the verified fields (drop anything else the API may add). */
export function mapRun(r: Record<string, unknown>): PayrollRunLite {
  const pp = (r.pay_period ?? null) as PayrollRunLite["pay_period"] | null;
  return {
    id: r.id as string | undefined,
    title: r.title as string | undefined,
    run_state: r.run_state as string | undefined,
    run_type: r.run_type as string | undefined,
    check_date: r.check_date as string | undefined,
    debit_date: r.debit_date as string | undefined,
    paid_at: r.paid_at as string | undefined,
    approved_at: r.approved_at as string | undefined,
    approval_deadline: r.approval_deadline as string | undefined,
    pay_period: pp ? { start_date: pp.start_date, end_date: pp.end_date, pay_frequency: pp.pay_frequency } : undefined,
    payment_type: r.payment_type as string | undefined,
    country_code: r.country_code as string | undefined,
  };
}

const day = (s?: string) => (s ?? "").slice(0, 10);

export interface PayrollRunsSummary {
  runs: PayrollRunLite[]; // newest first by check_date
  current_run: PayrollRunLite | null; // pay_period covers today
  most_recent_completed: PayrollRunLite | null; // run_state PAID, latest
  derived_schedule: {
    pay_frequency: string | null;
    next_check_date: string | null;
    basis: "derived_from_verified_runs";
  } | null;
}

/* Summarize a list of verified runs for "current period / last completed /
   schedule" questions. todayISO is the business date (America/New_York).
   - current_run: a run whose pay_period includes today (ties → latest check_date).
   - most_recent_completed: run_state === "PAID", ordered by paid_at then check_date.
   - derived_schedule: the modal pay_frequency across runs + the earliest future
     check_date — explicitly labeled as derived, never presented as a
     schedule API (Rippling exposes no pay-schedule read in the SDK). */
export function summarizePayrollRuns(rawRuns: Record<string, unknown>[], todayISO: string): PayrollRunsSummary {
  const runs = rawRuns.map(mapRun).sort((a, b) => day(b.check_date).localeCompare(day(a.check_date)));
  if (runs.length === 0) return { runs, current_run: null, most_recent_completed: null, derived_schedule: null };

  const current_run = runs.find((r) => {
    const s = day(r.pay_period?.start_date), e = day(r.pay_period?.end_date);
    return s && e && s <= todayISO && todayISO <= e;
  }) ?? null;

  const paid = runs.filter((r) => (r.run_state ?? "").toUpperCase() === "PAID")
    .sort((a, b) => (day(b.paid_at) || day(b.check_date)).localeCompare(day(a.paid_at) || day(a.check_date)));
  const most_recent_completed = paid[0] ?? null;

  const freq = new Map<string, number>();
  for (const r of runs) {
    const f = r.pay_period?.pay_frequency;
    if (f) freq.set(f, (freq.get(f) ?? 0) + 1);
  }
  const pay_frequency = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const future = runs.map((r) => day(r.check_date)).filter((d) => d && d > todayISO).sort();
  const derived_schedule = pay_frequency || future.length
    ? { pay_frequency, next_check_date: future[0] ?? null, basis: "derived_from_verified_runs" as const }
    : null;

  return { runs, current_run, most_recent_completed, derived_schedule };
}
