import { chromium, devices } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
const root = '/home/user/ShieldTechPortal/apps/portal/dist';
const shots = '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/audit';
mkdirSync(shots, { recursive: true });
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png' };
const srv = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(root, 'index.html');
  res.setHeader('Content-Type', mime[extname(p)] || 'application/octet-stream');
  res.end(readFileSync(p));
}).listen(4185);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
const errsAll = [];
page.on('pageerror', e => errsAll.push(e.message));
await page.goto('http://localhost:4185/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
// Mock bids so autobid renders with data
await page.evaluate(() => {
  const bid = { id:'b1', status:'proposal', selected_tier:'medium', tiers:{low:{price:24500,marginPct:18},medium:{price:29850,marginPct:30},aggressive:{price:36200,marginPct:42}}, scope:{summary:'s',confidence:'high',assumptions:[],missingInfo:[]}, line_items:[], labor_hours:46, labor_rate:145, material_cost:8690, cost_total:15360, docs_read:[], proposal_html:'<html><body>p</body></html>' };
  window.__shieldBids = { list: async () => ({ ok:true, data:[{ id:'o1', title:'City Hall CCTV Modernization', buyer:'City of Camden', state:'NJ', due_at:'2026-08-15', bid }] }), proposal: async()=>({ok:true,data:{proposalHtml:''}}), markSent: async()=>({ok:true}), build: async()=>({ok:true}), buildPending: async()=>({ok:true,data:{built:0}}) };
});
const ids = await page.evaluate(() => {
  const set = new Set(['custom-dashboard','calendar','dispatch','finance','m-more','sitescan','autobid']);
  Object.keys(window.M_NATIVE || {}).forEach(k => set.add(k));
  (window.M_NATIVE_IDS || []).forEach(k => set.add(k));
  Object.keys(window.M_OPS5 || {}).forEach(k => set.add(k));
  return [...set];
});
const report = [];
for (const id of ids) {
  const before = errsAll.length;
  try {
    await page.evaluate(i => window.__shieldNav(i), id);
    await page.waitForTimeout(650);
    const m = await page.evaluate(() => {
      const s = document.querySelector('.m-screen');
      const wide = [];
      s.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > window.innerWidth + 2 && el.children.length < 30) wide.push((el.className||el.tagName).toString().slice(0,30));
      });
      return {
        desk: s.dataset.desk,
        overflowX: s.scrollWidth - s.clientWidth,
        text: s.innerText.length,
        wide: wide.slice(0,3),
      };
    });
    report.push({ id, ...m, errs: errsAll.length - before });
    await page.screenshot({ path: `${shots}/${id}.png` });
  } catch (e) { report.push({ id, fail: String(e).slice(0,80) }); }
}
const bad = report.filter(r => r.fail || r.desk === 'true' || (r.overflowX||0) > 6 || r.errs || (r.text||0) < 60);
console.log('TOTAL SCREENS:', report.length);
console.log('ISSUES:');
bad.forEach(r => console.log(' ', JSON.stringify(r)));
console.log('CLEAN:', report.filter(r => !bad.includes(r)).map(r => `${r.id}(${r.text})`).join(' '));
await browser.close(); srv.close();
