import { chromium, devices } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
// 1) iPhone viewport → mobile shell
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errs.push('[mobile] ' + m.text()); });
page.on('pageerror', e => errs.push('[mobile pageerror] ' + e.message));
await page.goto('http://localhost:4180/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const surface = await page.evaluate(() => document.documentElement.dataset.surface);
const hasTabBar = await page.locator('nav button').count();
const headerLogo = await page.locator('header img[alt="ShieldTech"]').count();
console.log('mobile surface:', surface, '| tab buttons:', hasTabBar, '| header logo:', headerLogo);
// tap through bottom tabs
for (const label of ['Schedule', 'Field', 'Money', 'All', 'Home']) {
  const btn = page.locator('nav button', { hasText: label }).first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(600); }
}
// open drawer
await page.locator('header button[aria-label="Menu"]').click();
await page.waitForTimeout(500);
// AI button
await page.locator('header button[title="ShieldTech AI"]').count().then(c => console.log('AI button:', c));
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/23b42647-8c71-5479-8c00-e2839f2842b4/scratchpad/mobile-home.png' });
await ctx.close();
// 2) iPhone + ?desktop=1 → desktop shell
const ctx2 = await browser.newContext({ ...devices['iPhone 13'] });
const page2 = await ctx2.newPage();
await page2.goto('http://localhost:4180/?desktop=1', { waitUntil: 'networkidle' });
await page2.waitForTimeout(1200);
console.log('override surface:', await page2.evaluate(() => document.documentElement.dataset.surface));
await ctx2.close();
// 3) desktop viewport → desktop
const ctx3 = await browser.newContext();
const page3 = await ctx3.newPage();
await page3.goto('http://localhost:4180/', { waitUntil: 'networkidle' });
await page3.waitForTimeout(800);
console.log('desktop surface:', await page3.evaluate(() => document.documentElement.dataset.surface));
await ctx3.close();
await browser.close();
console.log('console errors:', JSON.stringify(errs.slice(0, 10), null, 1));
