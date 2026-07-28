import { chromium, devices } from 'playwright';
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
}).listen(4184);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:4184/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
// Mock the bids API with a finished, approval-ready bid
await page.evaluate(() => {
  const bid = {
    id: 'b1', status: 'proposal', selected_tier: 'medium',
    tiers: { low: { price: 24500, marginPct: 18, pitch: '' }, medium: { price: 29850, marginPct: 30, pitch: '' }, aggressive: { price: 36200, marginPct: 42, pitch: '' } },
    scope: { summary: 'CCTV replacement across 3 municipal buildings.', confidence: 'high', assumptions: ['Existing conduit reusable'], exclusions: [], missingInfo: ['Confirm camera count in Annex B'] },
    line_items: [{ desc: 'Axis P3265-V dome', qty: 24, unitCost: 285, hours: 1.5 }, { desc: 'NVR 64ch', qty: 1, unitCost: 1850, hours: 4 }],
    labor_hours: 46, labor_rate: 145, material_cost: 8690, cost_total: 15360,
    docs_read: [{ url: 'https://sam.gov/opp/abc', fetched: true, note: '' }, { url: 'https://city.gov/rfp.pdf', fetched: false, note: 'binary' }],
    proposal_html: '<html><body><h1>Proposal</h1><p>Full proposal body…</p></body></html>', sent_at: null, sent_to: null,
  };
  window.__shieldBids = {
    list: async () => ({ ok: true, data: [{ id: 'o1', title: 'City Hall CCTV Modernization', buyer: 'City of Camden', state: 'NJ', due_at: '2026-08-15', source_url: 'https://sam.gov/opp/abc', bid }] }),
    proposal: async (id, tier) => ({ ok: true, data: { bidId: id, tier, proposalHtml: '<html><body><h1>Proposal ' + tier + '</h1></body></html>' } }),
    markSent: async () => ({ ok: true }), build: async () => ({ ok: true }), buildPending: async () => ({ ok: true, data: { built: 0 } }),
  };
  window.__shieldNav('autobid');
});
await page.waitForTimeout(900);
const queue = await page.locator('text=Ready for your approval').count();
await page.locator('.glass', { hasText: 'City Hall CCTV' }).first().click();
await page.waitForTimeout(700);
const price = await page.locator('text=$29,850').count();
const approveBtns = await page.locator('button', { hasText: 'Approve &' }).count();
await page.locator('button', { hasText: 'How this price was built' }).click();
await page.waitForTimeout(400);
const math = await page.locator('text=Labor — 46h').count();
const verify = await page.locator('text=VERIFY AT SOURCE').count();
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/m-bidreview.png', fullPage: false });
console.log('queue header:', queue, '| price:', price, '| approve buttons:', approveBtns, '| math panel:', math, '| verify flags:', verify, '| errors:', errs.length, errs.slice(0,2).join('|'));
await browser.close(); srv.close();
