/* Deterministic labor & financial calculation engine. Pure functions only —
   no I/O, no globals — so every number shown in the HR/BI screens (and every
   figure handed to the AI advisor as grounded context) comes from here, never
   from LLM arithmetic. Unit tests: tests/labor-calc.test.mjs (node --test).
   Exposed as window.__shieldLaborCalc for the vendored proto screens. */

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/* Weekly hours → regular/overtime split. threshold defaults to the FLSA 40h
   week; otMultiplier to 1.5×. Both stay configurable — never hardcode a
   jurisdiction into a caller. */
export function otSplit(weeklyHours, { threshold = 40, otMultiplier = 1.5 } = {}) {
  const h = Math.max(0, Number(weeklyHours) || 0);
  const overtime = Math.max(0, h - threshold);
  return { regular: r2(h - overtime), overtime: r2(overtime), otMultiplier };
}

/* Gross weekly pay for an hourly worker. Returns null (not 0) when the rate
   is unknown — missing data must render as missing, never as a number. */
export function weeklyGross(weeklyHours, rate, opts) {
  if (rate == null || isNaN(Number(rate))) return null;
  const { regular, overtime, otMultiplier } = otSplit(weeklyHours, opts);
  return r2(regular * Number(rate) + overtime * Number(rate) * otMultiplier);
}

/* Loaded (fully burdened) cost from configurable components:
   [{key,label,type:'percent'|'per_hour'|'per_period',value,enabled}]
   percent applies to gross; per_hour × hours; per_period × periods. */
export function loadedCost(gross, hours, components = [], periods = 1) {
  if (gross == null) return { loaded: null, extra: null, breakdown: {} };
  let extra = 0;
  const breakdown = {};
  for (const c of components || []) {
    if (!c || c.enabled === false) continue;
    const v = Number(c.value) || 0;
    const amt = c.type === 'percent' ? gross * (v / 100)
      : c.type === 'per_hour' ? (Number(hours) || 0) * v
      : (Number.isFinite(Number(periods)) ? Number(periods) : 1) * v;
    breakdown[c.key] = r2(amt);
    extra += amt;
  }
  return { loaded: r2(gross + extra), extra: r2(extra), breakdown };
}

/* Effective loaded hourly rate — what an hour actually costs the company. */
export function loadedHourlyRate(rate, components = []) {
  if (rate == null) return null;
  const { loaded } = loadedCost(Number(rate), 1, components, 0); // per-period items excluded from an hourly view
  return loaded;
}

/* Hire vs. overtime: given sustained extra weekly hours, compare covering them
   with OT on the existing crew vs. a new hire. Every figure in the result is
   shown to the user with its inputs (the UI renders this as "the math"). */
export function hireVsOvertime({
  extraWeeklyHours, avgRate, newHireRate, components = [], weeks = 52,
  otMultiplier = 1.5, hireFixedCostPerPeriod = 0,
}) {
  const h = Number(extraWeeklyHours) || 0;
  if (avgRate == null || newHireRate == null) return null;
  const otWeekly = loadedCost(h * Number(avgRate) * otMultiplier, h, components, 0);
  const hireWeekly = loadedCost(h * Number(newHireRate), h, components, 1);
  const otTotal = r2(otWeekly.loaded * weeks);
  const hireTotal = r2(hireWeekly.loaded * weeks + (Number(hireFixedCostPerPeriod) || 0));
  return {
    inputs: { extraWeeklyHours: h, avgRate: Number(avgRate), newHireRate: Number(newHireRate), weeks, otMultiplier, hireFixedCostPerPeriod: Number(hireFixedCostPerPeriod) || 0 },
    overtime: { weekly: otWeekly.loaded, total: otTotal },
    hire: { weekly: hireWeekly.loaded, total: hireTotal },
    savingsWithHire: r2(otTotal - hireTotal),
    breakEvenWeeks: hireWeekly.loaded < otWeekly.loaded && Number(hireFixedCostPerPeriod) > 0
      ? Math.ceil(Number(hireFixedCostPerPeriod) / (otWeekly.loaded - hireWeekly.loaded)) : 0,
  };
}

/* Staffing forecast: backlog hours vs. weekly capacity. */
export function staffingForecast({ backlogHours, techs, hoursPerTechWeek = 40, utilization = 0.8 }) {
  const cap = (Number(techs) || 0) * (Number(hoursPerTechWeek) || 0) * Math.min(1, Math.max(0, Number(utilization) || 0));
  const backlog = Math.max(0, Number(backlogHours) || 0);
  return {
    inputs: { backlogHours: backlog, techs: Number(techs) || 0, hoursPerTechWeek: Number(hoursPerTechWeek) || 0, utilization: Number(utilization) || 0 },
    weeklyCapacity: r2(cap),
    weeksToClear: cap > 0 ? r2(backlog / cap) : null,
    techsForFourWeeks: (Number(hoursPerTechWeek) && Number(utilization))
      ? Math.ceil(backlog / (4 * Number(hoursPerTechWeek) * Number(utilization))) : null,
  };
}

/* What-if scenario: apply a rate change / headcount change / utilization change
   to a weekly labor baseline. baseline: {weeklyHours, avgRate}. */
export function scenario(kind, baseline, params, components = []) {
  const hours = Number(baseline?.weeklyHours) || 0;
  const rate = baseline?.avgRate;
  if (rate == null) return null;
  const base = loadedCost(hours * Number(rate), hours, components, 1).loaded;
  let next = base;
  const p = params || {};
  if (kind === 'rate_change') {
    next = loadedCost(hours * Number(p.newAvgRate ?? rate), hours, components, 1).loaded;
  } else if (kind === 'headcount') {
    const dH = (Number(p.deltaTechs) || 0) * (Number(p.hoursPerTechWeek) || 40);
    next = loadedCost((hours + dH) * Number(rate), hours + dH, components, 1).loaded;
  } else if (kind === 'utilization') {
    const factor = (Number(p.newUtilization) || 1) / (Number(p.currentUtilization) || 1);
    next = loadedCost(hours * factor * Number(rate), hours * factor, components, 1).loaded;
  } else {
    return null;
  }
  return {
    kind, inputs: { baseline: { weeklyHours: hours, avgRate: Number(rate) }, ...p },
    weeklyBefore: base, weeklyAfter: next, weeklyDelta: r2(next - base), annualDelta: r2((next - base) * 52),
  };
}

/* Billing rate needed so an hour billed at it leaves marginPct after the
   loaded hourly cost. margin = (rate - cost) / rate → rate = cost / (1 - m). */
export function billingRateForMargin(loadedHourlyCost, marginPct) {
  const m = Number(marginPct) / 100;
  if (loadedHourlyCost == null || !(m >= 0) || m >= 1) return null;
  return r2(Number(loadedHourlyCost) / (1 - m));
}

/* Compensation change analysis: current vs proposed pay. Direct + loaded
   annual deltas, weekly payroll impact, and the billing rate required to
   preserve a target labor margin at the new loaded cost. Every output is
   deterministic from the inputs shown. */
export function compChange({ currentRate, proposedRate, hoursPerWeek = 40, weeksPerYear = 52, components = [], targetMarginPct = null }) {
  if (currentRate == null || proposedRate == null) return null;
  const cur = Number(currentRate), next = Number(proposedRate);
  const h = Number(hoursPerWeek) || 0, w = Number(weeksPerYear) || 52;
  const directAnnual = r2((next - cur) * h * w);
  const curLoaded = loadedCost(cur * h, h, components, 1).loaded;
  const nextLoaded = loadedCost(next * h, h, components, 1).loaded;
  const out = {
    inputs: { currentRate: cur, proposedRate: next, hoursPerWeek: h, weeksPerYear: w, targetMarginPct },
    directAnnualIncrease: directAnnual,
    loadedWeeklyBefore: curLoaded,
    loadedWeeklyAfter: nextLoaded,
    loadedWeeklyIncrease: r2(nextLoaded - curLoaded),
    loadedAnnualIncrease: r2((nextLoaded - curLoaded) * w),
    loadedHourlyBefore: loadedHourlyRate(cur, components),
    loadedHourlyAfter: loadedHourlyRate(next, components),
  };
  if (targetMarginPct != null) {
    out.requiredBillingRateBefore = billingRateForMargin(out.loadedHourlyBefore, targetMarginPct);
    out.requiredBillingRateAfter = billingRateForMargin(out.loadedHourlyAfter, targetMarginPct);
  }
  return out;
}

/* Group time entries (id, tech_id, work_date, hours, status) into per-tech
   weekly buckets keyed by Monday. countedStatuses defaults to payable ones. */
export function weeklyBuckets(entries, { counted = ['submitted', 'approved', 'synced', 'paid'] } = {}) {
  const set = new Set(counted);
  const out = new Map();
  for (const e of entries || []) {
    if (!set.has(e.status)) continue;
    const d = new Date(`${e.work_date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const wk = d.toISOString().slice(0, 10);
    const key = `${e.tech_id}|${wk}`;
    out.set(key, r2((out.get(key) || 0) + (Number(e.hours) || 0)));
  }
  return out;
}

export const __calc = { r2 };

if (typeof window !== 'undefined') {
  window.__shieldLaborCalc = { otSplit, weeklyGross, loadedCost, loadedHourlyRate, hireVsOvertime, staffingForecast, scenario, weeklyBuckets, billingRateForMargin, compChange };
}
