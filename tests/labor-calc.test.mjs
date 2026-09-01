// node --test tests/labor-calc.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  otSplit, weeklyGross, loadedCost, loadedHourlyRate,
  hireVsOvertime, staffingForecast, scenario, weeklyBuckets,
} from '../packages/shared/labor-calc.js';

test('otSplit splits at the threshold', () => {
  assert.deepEqual(otSplit(38), { regular: 38, overtime: 0, otMultiplier: 1.5 });
  assert.deepEqual(otSplit(46), { regular: 40, overtime: 6, otMultiplier: 1.5 });
  assert.equal(otSplit(50, { threshold: 44 }).overtime, 6);
  assert.equal(otSplit(-5).regular, 0);
});

test('weeklyGross pays OT at the multiplier and returns null without a rate', () => {
  assert.equal(weeklyGross(40, 30), 1200);
  assert.equal(weeklyGross(45, 30), 40 * 30 + 5 * 45); // 1425
  assert.equal(weeklyGross(45, null), null);
  assert.equal(weeklyGross(45, 'nope'), null);
});

test('loadedCost applies percent, per_hour and per_period components', () => {
  const components = [
    { key: 'taxes', type: 'percent', value: 10 },
    { key: 'gear', type: 'per_hour', value: 1 },
    { key: 'insurance', type: 'per_period', value: 50 },
    { key: 'off', type: 'percent', value: 99, enabled: false },
  ];
  const { loaded, extra, breakdown } = loadedCost(1000, 40, components, 1);
  assert.equal(breakdown.taxes, 100);
  assert.equal(breakdown.gear, 40);
  assert.equal(breakdown.insurance, 50);
  assert.equal(breakdown.off, undefined);
  assert.equal(extra, 190);
  assert.equal(loaded, 1190);
  assert.equal(loadedCost(null, 40, components).loaded, null); // missing stays missing
});

test('loadedHourlyRate excludes per-period items', () => {
  const components = [
    { key: 'taxes', type: 'percent', value: 20 },
    { key: 'insurance', type: 'per_period', value: 500 },
  ];
  assert.equal(loadedHourlyRate(30, components), 36);
  assert.equal(loadedHourlyRate(null, components), null);
});

test('hireVsOvertime shows its inputs and totals consistently', () => {
  const out = hireVsOvertime({ extraWeeklyHours: 10, avgRate: 40, newHireRate: 30, weeks: 10, hireFixedCostPerPeriod: 500 });
  // OT: 10h × $40 × 1.5 = $600/wk → $6000; hire: 10h × $30 = $300/wk → $3000 + $500
  assert.equal(out.overtime.weekly, 600);
  assert.equal(out.hire.weekly, 300);
  assert.equal(out.overtime.total, 6000);
  assert.equal(out.hire.total, 3500);
  assert.equal(out.savingsWithHire, 2500);
  assert.equal(out.breakEvenWeeks, Math.ceil(500 / 300));
  assert.equal(hireVsOvertime({ extraWeeklyHours: 10, avgRate: null, newHireRate: 30 }), null);
});

test('staffingForecast computes capacity and weeks-to-clear', () => {
  const out = staffingForecast({ backlogHours: 640, techs: 4, hoursPerTechWeek: 40, utilization: 0.8 });
  assert.equal(out.weeklyCapacity, 128);
  assert.equal(out.weeksToClear, 5);
  assert.equal(out.techsForFourWeeks, Math.ceil(640 / (4 * 40 * 0.8)));
  assert.equal(staffingForecast({ backlogHours: 100, techs: 0 }).weeksToClear, null);
});

test('scenario rate_change / headcount / utilization deltas', () => {
  const baseline = { weeklyHours: 200, avgRate: 30 };
  const rateUp = scenario('rate_change', baseline, { newAvgRate: 33 });
  assert.equal(rateUp.weeklyDelta, 600);
  assert.equal(rateUp.annualDelta, 31200);
  const addTech = scenario('headcount', baseline, { deltaTechs: 1, hoursPerTechWeek: 40 });
  assert.equal(addTech.weeklyDelta, 1200);
  const util = scenario('utilization', baseline, { currentUtilization: 0.8, newUtilization: 0.9 });
  assert.equal(util.weeklyDelta, 750);
  assert.equal(scenario('bogus', baseline, {}), null);
  assert.equal(scenario('rate_change', { weeklyHours: 10, avgRate: null }, { newAvgRate: 5 }), null);
});

test('weeklyBuckets groups payable statuses by tech and Monday', () => {
  const entries = [
    { tech_id: 'a', work_date: '2026-08-31', hours: 8, status: 'approved' },  // Monday
    { tech_id: 'a', work_date: '2026-09-02', hours: 6, status: 'submitted' },
    { tech_id: 'a', work_date: '2026-09-06', hours: 4, status: 'draft' },     // not counted
    { tech_id: 'b', work_date: '2026-09-06', hours: 5, status: 'paid' },      // Sunday → same week
  ];
  const buckets = weeklyBuckets(entries);
  assert.equal(buckets.get('a|2026-08-31'), 14);
  assert.equal(buckets.get('b|2026-08-31'), 5);
  assert.equal(buckets.size, 2);
});

test('billingRateForMargin inverts the margin formula', async () => {
  const { billingRateForMargin } = await import('../packages/shared/labor-calc.js');
  assert.equal(billingRateForMargin(60, 40), 100); // $60 cost at 40% margin → $100
  assert.equal(billingRateForMargin(60, 100), null);
  assert.equal(billingRateForMargin(null, 40), null);
});

test('compChange computes direct, loaded, and required-billing deltas', async () => {
  const { compChange } = await import('../packages/shared/labor-calc.js');
  const components = [{ key: 'burden', type: 'percent', value: 25 }];
  const out = compChange({ currentRate: 38, proposedRate: 40, hoursPerWeek: 40, components, targetMarginPct: 40 });
  assert.equal(out.directAnnualIncrease, 2 * 40 * 52);       // $4,160
  assert.equal(out.loadedWeeklyBefore, 38 * 40 * 1.25);      // 1900
  assert.equal(out.loadedWeeklyAfter, 40 * 40 * 1.25);       // 2000
  assert.equal(out.loadedAnnualIncrease, 100 * 52);          // $5,200
  assert.equal(out.loadedHourlyAfter, 50);
  assert.equal(out.requiredBillingRateAfter, 83.33); // 50 / 0.6, rounded to cents
  assert.equal(compChange({ currentRate: null, proposedRate: 40 }), null);
});
