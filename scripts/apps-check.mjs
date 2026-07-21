import { chromium, devices } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
async function drive(name, url, viewport, tabsSel, tabLabels) {
  const ctx = await browser.newContext(viewport ? { ...devices[viewport] } : {});
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errs.push(`[${name}] ` + m.text().slice(0, 200)); });
  page.on('pageerror', e => errs.push(`[${name} pageerror] ` + e.message.slice(0, 200)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const txt = (await page.locator('body').innerText()).trim();
  console.log(name, '| body chars:', txt.length, txt.length < 20 ? '⚠ BLANK' : '');
  for (const label of tabLabels) {
    const btn = page.locator(`${tabsSel} button`, { hasText: label }).first();
    if (await btn.count()) { await btn.click(); await page.waitForTimeout(500); }
    else errs.push(`[${name}] missing tab: ${label}`);
  }
  await ctx.close();
}
await drive('tech', 'http://localhost:4181/', 'iPhone 13', 'nav', ['Photos', 'Time', 'Assets', 'Expenses', 'AI', 'More', 'Today']);
await drive('customer', 'http://localhost:4182/', null, 'div', ['Security Score', 'Sites', 'Devices', 'Photos', 'Footage', 'Access', 'Tickets', 'Approvals', 'Invoices', 'Planner', 'Compliance', 'Drill', 'Claims', 'Remote', 'Concierge', 'Reports', 'Dashboard']);
await browser.close();
console.log('console errors:', errs.length ? JSON.stringify(errs.slice(0, 12), null, 1) : 'none');
