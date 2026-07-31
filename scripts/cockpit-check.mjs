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
}).listen(4186);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:4186/#/cockpit', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
// Seed a couple of live rows so the columns show real content
await page.evaluate(() => {
  window.addInvoice({ customer_name: 'Acme Dental', total: 4800, status: 'open', due_date: '2026-07-20', lines: [{ desc: 'Quarterly monitoring', qty: 1, rate: 4800 }] });
  window.addEstimate({ customer_name: 'Metro Bank', total: 18500, status: 'pending', lines: [{ desc: 'Branch CCTV refresh', qty: 1, rate: 18500 }] });
  window.jobStore.set(() => [{ id: 'j1', title: 'NVR swap — Acme Dental', day: ((new Date().getDay()+6)%7)+1, start: 9, dur: 3, type: 'repair', techs: ['MR'], value: 1200 }]);
  const bid = { id:'b1', status:'proposal', selected_tier:'medium', tiers:{medium:{price:29850,marginPct:30}}, scope:{confidence:'high'}, proposal_html:'<html><body>p</body></html>', sent_at:null };
  window.__shieldBids = { list: async () => ({ ok:true, data:[{ id:'o1', title:'City Hall CCTV Modernization', buyer:'City of Camden', due_at:'2026-08-15', bid }] }), markSent: async()=>({ok:true}) };
  window.__shieldNav('cockpit');
});
await page.waitForTimeout(1200);
console.log('cockpit text len:', (await page.locator('.glass').count()), 'glass cards | errors:', errs.length, errs.slice(0,2).join('|'));
// Peek panel test
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/cockpit-main.png' });
await page.locator('.glass', { hasText: 'INV-' }).last().click().catch(()=>{});
await page.waitForTimeout(600);
console.log('peek open:', await page.locator('text=Open full editor').count());
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/cockpit.png' });
await browser.close(); srv.close();
