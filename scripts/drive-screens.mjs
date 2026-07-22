/* Drive every screen in SCREEN_LIST via window.__shieldNav, screenshot each,
   collect console errors. Run against the vite preview server. */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const OUT = process.env.SHOT_DIR || '/tmp/claude-0/-home-user-ShieldTechPortal/23b42647-8c71-5479-8c00-e2839f2842b4/scratchpad/shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push({ screen: current, text: m.text().slice(0, 300) }); });
page.on('pageerror', e => errors.push({ screen: current, text: String(e).slice(0, 300) }));

let current = '(load)';
await page.goto(BASE, { waitUntil: 'networkidle' });

const SCREEN_LIST = JSON.parse(fs.readFileSync(process.env.SCREEN_JSON, 'utf8'));

const results = [];
for (const id of SCREEN_LIST) {
  current = id;
  const before = errors.length;
  await page.evaluate(s => window.__shieldNav(s), id);
  await page.waitForTimeout(700);
  const bodyLen = await page.evaluate(() => document.getElementById('root').innerText.trim().length);
  await page.screenshot({ path: `${OUT}/${id}.png` });
  results.push({ id, textLen: bodyLen, newErrors: errors.length - before });
}

const blank = results.filter(r => r.textLen < 20);
console.log('screens driven:', results.length);
console.log('blank/near-blank:', JSON.stringify(blank));
console.log('console errors:', JSON.stringify(errors.slice(0, 30), null, 1));
if (errors.length > 30) console.log('...and', errors.length - 30, 'more errors');
await browser.close();
process.exit(blank.length || errors.length ? 1 : 0);
