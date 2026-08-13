import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://localhost:4175/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const r = await page.evaluate(() => {
  // Intercept the notify path to verify the WO → job mapping without a backend.
  let captured = null;
  const orig = window.notifyJobAssigned;
  window.notifyJobAssigned = (job, techs) => { captured = { job, techs }; };
  window.notifyWorkOrderAssigned({ id: 'WO-9100', type: 'Install', customer: 'Metro Bank', site: '1 Main St', scheduled: '2026-09-10', scope: '4 cameras', notes: 'lift needed', assignedTo: 'uuid-123' });
  window.notifyJobAssigned = orig;
  return { type: typeof window.notifyWorkOrderAssigned, captured };
});
console.log(JSON.stringify(r, null, 2));
console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
const ok = r.type === 'function' && r.captured && r.captured.job.title === 'Install — Metro Bank' && r.captured.job.date === '2026-09-10' && r.captured.techs[0] === 'uuid-123' && !errors.length;
process.exit(ok ? 0 : 1);
