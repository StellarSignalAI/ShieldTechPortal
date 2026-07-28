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
}).listen(4183);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:4183/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);

// 1. Money tab → Invoices → create an invoice
await page.evaluate(() => window.__shieldNav('finance'));
await page.waitForTimeout(700);
await page.locator('button', { hasText: 'Invoices' }).first().click();
await page.waitForTimeout(400);
await page.locator('button', { hasText: '+' }).first().click();
await page.waitForTimeout(400);
await page.locator('input[placeholder="Customer name"]').fill('Edit Test LLC');
await page.locator('input[placeholder="Work / line item"]').fill('CCTV install');
await page.locator('input[placeholder="0.00"]').fill('1000');
await page.locator('button', { hasText: 'Create Invoice' }).click();
await page.waitForTimeout(600);

// 2. Open it → Edit → change rate to 2500, add a line, save
await page.locator('.glass', { hasText: 'Edit Test LLC' }).first().click();
await page.waitForTimeout(500);
await page.locator('button', { hasText: '✎ Edit' }).click();
await page.waitForTimeout(500);
const rate = page.locator('input[placeholder="Rate"]').first();
await rate.fill('2500');
await page.locator('button', { hasText: '+ Add line item' }).click();
await page.locator('input[placeholder="Description"]').nth(1).fill('Programming');
await page.locator('input[placeholder="Rate"]').nth(1).fill('500');
await page.locator('button', { hasText: 'Save changes' }).click();
await page.waitForTimeout(700);
const listText = await page.locator('.m-screen').innerText();
console.log('invoice edited total visible:', listText.includes('3,000') ? 'YES $3,000' : 'NO — ' + (listText.match(/\$[\d,]+/g) || []).slice(0,6).join(' '));

// 3. Directory invoices screen → tap row opens editor
await page.evaluate(() => window.__shieldNav('invoices'));
await page.waitForTimeout(700);
await page.locator('.glass', { hasText: 'Edit Test' }).first().click();
await page.waitForTimeout(500);
const editorOpen = await page.locator('text=Edit INV').count();
console.log('directory tap→editor:', editorOpen > 0 ? 'YES' : 'NO');
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/m-editor.png' });
await page.locator('button', { hasText: 'Cancel' }).click();

// 4. Estimate edit button exists on Money → Estimates
await page.evaluate(() => window.__shieldNav('finance'));
await page.waitForTimeout(600);
await page.locator('button', { hasText: 'Estimates' }).first().click();
await page.waitForTimeout(500);
console.log('estimate edit buttons:', await page.locator('button', { hasText: '✎ Edit' }).count());

// 5. Disclosure collapsed by default on rfp; expands via chip
await page.evaluate(() => window.__shieldNav('rfp'));
await page.waitForTimeout(600);
const deskBefore = await page.locator('[data-desk="true"]').count();
await page.locator('button', { hasText: 'Open the full toolset' }).click();
await page.waitForTimeout(700);
const deskAfter = await page.locator('[data-desk="true"]').count();
console.log('suite collapsed→expanded:', deskBefore, '→', deskAfter);
await page.screenshot({ path: '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/m-rfp.png' });
console.log('PAGE ERRORS:', errs.length, errs.slice(0,3).join('|'));
await browser.close(); srv.close();
