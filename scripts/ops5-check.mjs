import { chromium, devices } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
const root = '/home/user/ShieldTechPortal/apps/portal/dist';
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(root, 'index.html');
  res.setHeader('Content-Type', mime[extname(p)] || 'application/octet-stream');
  res.end(readFileSync(p));
}).listen(4181);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/supabase|fetch|Failed to load|net::|ERR_/i.test(m.text())) errs.push('[console] ' + m.text()); });
await page.goto('http://localhost:4181/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const screens = ['chat','messages','invoices','estimates','timesheets','expenses','employees','pricebook','product-library','documents','users','outbox','secret-weapon','assets','forecast','health','wallboard','digest','portal-settings','integrations','studio','service-plans','onboarding','service-reports','statuspage','marketing','survey-cloud','copilot','intel','margin-xray','rr-builder','rfp','roi','customer','timeline','autobid'];
const results = [];
for (const s of screens) {
  const before = errs.length;
  await page.evaluate(id => window.__shieldNav(id), s);
  await page.waitForTimeout(700);
  const desk = await page.evaluate(() => document.querySelector('.m-screen').dataset.desk);
  const textLen = await page.evaluate(() => document.querySelector('.m-screen').innerText.length);
  results.push(`${s}: data-desk=${desk} text=${textLen}${errs.length>before ? ' ERRORS:' + errs.slice(before).join(' | ') : ''}`);
}
console.log(results.join('\n'));
await page.evaluate(() => window.__shieldNav('digest'));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/m-digest.png' });
await page.evaluate(() => window.__shieldNav('secret-weapon'));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/m-sw.png' });
console.log('TOTAL PAGE ERRORS:', errs.length, errs.slice(0,5).join(' || '));
await browser.close(); srv.close();
