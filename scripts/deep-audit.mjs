/* Deep interaction audit: for every portal screen, click each visible button and
   classify — opened a window (modal/sheet/dialog), navigated, changed the DOM,
   or DID NOTHING (dead / toast-only). Reports dead buttons per screen with
   their labels, plus JS errors. */
import { chromium } from 'playwright';
import fs from 'fs';

const SCREENS = JSON.parse(fs.readFileSync(process.env.SCREEN_JSON, 'utf8'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
const jsErr = [];
p.on('pageerror', e => jsErr.push(String(e).slice(0, 100)));
await p.goto('http://localhost:4180/', { waitUntil: 'networkidle' });

const dead = {};   // screen -> [labels]
const errored = [];

for (const id of SCREENS) {
  if (id === 'login') continue;
  await p.evaluate(s => window.__shieldNav(s), id).catch(() => {});
  await p.waitForTimeout(350);
  const before = jsErr.length;

  const labels = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('main button')]
      .filter(x => x.offsetParent && x.innerText.trim().length > 1)
      .slice(0, 14);
    return btns.map(x => x.innerText.trim().slice(0, 28));
  });

  const deadHere = [];
  for (let i = 0; i < labels.length; i++) {
    const res = await p.evaluate((idx) => {
      const btns = [...document.querySelectorAll('main button')]
        .filter(x => x.offsetParent && x.innerText.trim().length > 1).slice(0, 14);
      const btn = btns[idx];
      if (!btn) return { skip: true };
      const domN = document.body.querySelectorAll('*').length;
      const scr = window.__shieldCurrentScreen || (window.location.hash || '');
      const toastN = document.querySelectorAll('[class*="toast"], [style*="bottom: 24"]').length;
      try { btn.click(); } catch { return { label: btn.innerText.trim().slice(0, 28), changed: false }; }
      return new Promise(r => setTimeout(() => {
        const modal = document.querySelector('[role="dialog"], div[style*="z-index: 4001"], div[style*="zIndex: 4001"], div[style*="9000"], div[style*="10000"]');
        const domN2 = document.body.querySelectorAll('*').length;
        const grew = domN2 > domN + 3;
        const opened = !!modal || grew;
        r({ label: btn.innerText.trim().slice(0, 28), changed: opened });
      }, 260));
    }, i).catch(() => ({ skip: true }));
    if (res && !res.skip && !res.changed) deadHere.push(res.label);
    // reset: close modals + renav
    await p.evaluate(() => {
      document.querySelectorAll('[role="dialog"] button, div[style*="4001"] button').forEach(x => { const t = x.innerText.trim(); if (t === '✕' || t === '×' || t === 'Cancel' || t === 'Close') x.click(); });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await p.evaluate(s => window.__shieldNav(s), id).catch(() => {});
    await p.waitForTimeout(120);
  }
  if (deadHere.length) dead[id] = [...new Set(deadHere)];
  if (jsErr.length > before) errored.push(`${id}: ${jsErr.slice(before).join(' | ').slice(0, 100)}`);
}

console.log('=== DEAD/TOAST-ONLY BUTTONS BY SCREEN ===');
const entries = Object.entries(dead).sort((a, b2) => b2[1].length - a[1].length);
for (const [scr, labels] of entries) console.log(`${scr} (${labels.length}): ${labels.join(', ')}`);
console.log('\n=== JS ERRORS ON INTERACTION ===');
console.log(errored.join('\n') || 'none');
console.log(`\nTotal screens with dead buttons: ${entries.length}`);
await b.close();
