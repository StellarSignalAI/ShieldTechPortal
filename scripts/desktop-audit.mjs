import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
const root = '/home/user/ShieldTechPortal/apps/portal/dist';
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png' };
const srv = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(root, 'index.html');
  res.setHeader('Content-Type', mime[extname(p)] || 'application/octet-stream');
  res.end(readFileSync(p));
}).listen(4187);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errsAll = [];
page.on('pageerror', e => errsAll.push(e.message));
await page.goto('http://localhost:4187/#/custom-dashboard', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const ids = await page.evaluate(() => Object.keys(window.NAV_ITEMS ? {} : {})); // placeholder
const screenList = await page.evaluate(() => (window.NAV_GROUPS || []).flatMap(g => g.items.map(i => i.id)));
const bad = [];
for (const id of screenList) {
  const before = errsAll.length;
  try {
    await page.evaluate(i => window.__shieldNav(i), id);
    await page.waitForTimeout(450);
    const missing = await page.evaluate(() => document.body.innerText.includes('Screen module not loaded'));
    const textLen = await page.evaluate(() => document.body.innerText.length);
    if (missing || errsAll.length > before || textLen < 400) bad.push({ id, missing, errs: errsAll.slice(before), textLen });
  } catch (e) { bad.push({ id, fail: String(e).slice(0, 90) }); }
}
console.log('DESKTOP SCREENS DRIVEN:', screenList.length);
console.log('PROBLEMS:', JSON.stringify(bad, null, 1).slice(0, 3000));
console.log('TOTAL PAGE ERRORS:', errsAll.length);
await browser.close(); srv.close();
