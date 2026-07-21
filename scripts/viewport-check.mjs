/* Verify mobile viewport fit + lock across device profiles on all three apps. */
import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const targets = [
  ['portal', 'http://localhost:4180/'],
  ['tech', 'http://localhost:4181/'],
  ['customer', 'http://localhost:4182/'],
];
const profiles = [
  ['iPhone 14', devices['iPhone 14']],
  ['iPhone SE', devices['iPhone SE']],
  ['Pixel 7', devices['Pixel 7']],
];

let fail = 0;
for (const [app, url] of targets) {
  for (const [name, profile] of profiles) {
    const ctx = await browser.newContext({ ...profile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const b = document.body.getBoundingClientRect();
      const shell = document.querySelector('.m-app-shell');
      const s = shell ? shell.getBoundingClientRect() : null;
      window.scrollTo(0, 80);
      return {
        vw, vh,
        bodyW: Math.round(b.width), bodyH: Math.round(b.height),
        shell: s ? { w: Math.round(s.width), h: Math.round(s.height) } : null,
        pageScrollY: window.scrollY,
        docOverflowX: document.documentElement.scrollWidth > vw,
      };
    });
    const locked = r.pageScrollY === 0 && !r.docOverflowX;
    const fits = r.shell && Math.abs(r.shell.h - r.vh) <= 1 && r.shell.w <= r.vw;
    const ok = locked && fits && errors.length === 0;
    if (!ok) fail++;
    console.log(`${app.padEnd(8)} ${name.padEnd(10)} vp ${r.vw}x${r.vh} shell ${r.shell ? r.shell.w + 'x' + r.shell.h : 'MISSING'} lock=${locked} fits=${fits} errors=${errors.length} ${ok ? 'OK' : 'FAIL'}`);
    if (errors.length) console.log('   ', errors.slice(0, 3));
    await ctx.close();
  }
}
await browser.close();
process.exit(fail ? 1 : 0);
