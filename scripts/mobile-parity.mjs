/* Mobile parity gate: drive EVERY desktop screen id on the mobile surface.
   Asserts each renders (non-blank), logs console errors, and that no screen
   silently falls back to the Home dashboard. */
import { chromium, devices } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4180/';
const SCREENS = JSON.parse(fs.readFileSync(process.env.SCREEN_JSON, 'utf8'));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const page = await ctx.newPage();
const errors = [];
let current = '(load)';
page.on('console', m => { if (m.type() === 'error') errors.push({ screen: current, text: m.text().slice(0, 200) }); });
page.on('pageerror', e => errors.push({ screen: current, text: String(e).slice(0, 200) }));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Fingerprint of the Home fallback so we can detect silent fallbacks.
await page.evaluate(() => window.__shieldNav('custom-dashboard'));
await page.waitForTimeout(500);
const homeText = await page.evaluate(() => document.querySelector('.m-screen').innerText.trim().slice(0, 200));

const bad = [];
for (const id of SCREENS) {
  if (id === 'login' || id === 'custom-dashboard') continue;
  current = id;
  await page.evaluate(s => window.__shieldNav(s), id);
  await page.waitForTimeout(450);
  const txt = await page.evaluate(() => document.querySelector('.m-screen').innerText.trim());
  const fellBack = txt.slice(0, 200) === homeText;
  if (txt.length < 20) bad.push({ id, why: 'blank' });
  else if (fellBack) bad.push({ id, why: 'fell back to Home' });
}

// Full-view toggle smoke: dispatch is native and has a desktop map entry.
current = 'full-toggle';
await page.evaluate(() => window.__shieldNav('dispatch'));
await page.waitForTimeout(400);
const fullBtn = page.locator('button', { hasText: 'Full' }).first();
let fullOk = false;
if (await fullBtn.count()) {
  await fullBtn.click(); await page.waitForTimeout(600);
  const t = await page.evaluate(() => document.querySelector('.m-screen').innerText.trim());
  fullOk = t.length > 20;
}

console.log('screens driven:', SCREENS.length - 2);
console.log('unreachable/fallback:', JSON.stringify(bad));
console.log('full-view toggle:', fullOk ? 'OK' : 'FAIL');
console.log('console errors:', JSON.stringify(errors.slice(0, 15), null, 1));
await browser.close();
process.exit(bad.length || !fullOk || errors.length ? 1 : 0);
