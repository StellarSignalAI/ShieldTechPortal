/* Render-test for the ShieldTech email design system: renders EVERY template,
   asserts brand/palette/link invariants, and screenshots desktop + mobile. */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright';

const OUT = '/tmp/claude-0/-home-user-ShieldTechPortal/8a452262-39c0-53e2-b9b4-2efc2a31f737/scratchpad/emails';
fs.mkdirSync(OUT, { recursive: true });

// Bundle the Deno TS module to JS, shimming Deno.env.
execSync(`npx esbuild supabase/functions/_shared/email.ts --bundle --format=esm --outfile=${OUT}/email.mjs`, { stdio: 'inherit' });
globalThis.Deno = { env: { get: () => undefined } };
const E = await import(`${OUT}/email.mjs`);

const LINK = 'https://portal.shieldtechsolutions.com/x?token=abc';
const samples = {
  'registration-credentials': E.credentialsEmail({ name: 'Jordan Rivera', email: 'jordan.rivera@verylongcompanydomainname.com', password: 'ST-Ab2xk-9QmPz-R7w4', portalName: 'Customer Portal', accessUrl: 'https://customer.shieldtechsolutions.com' }),
  'registration-google': E.googleWelcomeEmail({ name: 'Dana', portalName: 'ShieldTech Portal', accessUrl: 'https://portal.shieldtechsolutions.com' }),
  'invite-technician': E.technicianInviteEmail({ name: 'Mike Reyes', email: 'mike@example.com', password: 'ST-Kk3mn-2Qw9p-X1z8', techUrl: 'https://tech.shieldtechsolutions.com', installUrl: 'https://tech.shieldtechsolutions.com/get-tech.html' }),
  'invite-sales': E.salesInviteEmail({ name: 'Sam Lee', email: 'sam@example.com', password: 'ST-Pp5dh-7Rt2k-M4c9', salesUrl: 'https://portal.shieldtechsolutions.com/sales', installUrl: 'https://portal.shieldtechsolutions.com/sales/apps' }),
  'password-reset': E.resetEmail({ email: 'user@example.com', password: 'ST-Zz1aa-3Bb5c-D7e9', portalUrl: 'https://portal.shieldtechsolutions.com', resend: false }),
  'invite-resend': E.resetEmail({ email: 'user@example.com', password: 'ST-Zz1aa-3Bb5c-D7e9', portalUrl: 'https://tech.shieldtechsolutions.com', resend: true }),
  'invoice': E.invoiceEmail({ ref: 'INV-2871', customer: 'Riverside Medical <Group>', amount: 12480.5, due: '2026-09-15', lines: [{ desc: '8× Axis dome cameras', qty: 8, rate: 890 }, { desc: 'Installation labor', qty: 24, rate: 125 }, { desc: 'NVR & licensing', qty: 1, rate: 2360.5 }], link: LINK }),
  'invoice-reminder': E.invoiceReminderEmail({ ref: 'INV-2860', amount: 4200, dueDate: '2026-07-20', daysPast: 12, link: LINK }),
  'proposal': E.proposalEmail({ ref: 'PROP-1042', customer: 'Harbor View Condos', amount: 38500, link: LINK }),
  'job-assigned': E.jobAssignedEmail({ name: 'Mike Reyes', title: 'Metro Bank — Camera Install', customer: 'Metro Bank', site: '1200 Market St', date: '2026-09-04', endDate: '2026-09-05', startTime: '9:00 AM', hours: 6, notes: 'Lift needed for <exterior> domes', jobRef: 'WO-2871' }),
  'timesheet-rejected': E.timesheetRejectedEmail({ name: 'Mike Reyes', workDate: '2026-09-04', hours: 4, jobRef: 'WO-2871', note: 'Hours overlap the Metro Bank job — split the <entry> into two' }),
  'notification': E.notificationEmail({ subject: 'Job Assigned | ShieldTech Security', headline: 'New job assignment', label: 'Job Assigned', message: 'Metro Bank — Camera Install\n\nScheduled Sep 4, 9:00 AM at 1200 Market St.\nCrew: Mike Reyes.', ctaLabel: 'View Job →', ctaUrl: LINK }),
};

const errs = [];
const check = (name, cond, msg) => { if (!cond) errs.push(`${name}: ${msg}`); };

for (const [name, mail] of Object.entries(samples)) {
  fs.writeFileSync(`${OUT}/${name}.html`, mail.html);
  fs.writeFileSync(`${OUT}/${name}.txt`, mail.text);
  check(name, /\| ShieldTech Security$/.test(mail.subject), `subject format: ${mail.subject}`);
  check(name, mail.html.includes('ShieldTech%20Logo%20Transparent%20MK3.png'), 'real logo asset missing');
  check(name, mail.html.includes('#090B0D') && mail.html.includes('#62B5E5'), 'palette missing');
  check(name, mail.html.includes('LOW VOLTAGE. ZERO PUNCH LIST.') || mail.html.toLowerCase().includes('low voltage. zero punch list.'), 'tagline missing');
  check(name, mail.html.includes('484-800-1220'), 'phone missing');
  check(name, mail.html.includes('customer@shieldtechsolutions.com'), 'support email missing');
  check(name, !mail.html.includes('href="#"'), 'placeholder # link found');
  check(name, !/gradient/i.test(mail.html), 'gradient found');
  check(name, !mail.html.includes('<script'), 'script tag found');
  check(name, mail.text.includes('SHIELDTECH SECURITY'), 'text fallback footer missing');
}
// Escaping: the "<Group>" customer must be escaped in html.
check('invoice', samples['invoice'].html.includes('&lt;Group&gt;'), 'dynamic value not escaped');
check('invoice', !samples['invoice'].html.includes('Medical <Group>'), 'raw angle brackets leaked');
// Temp password highlighted in blue.
check('registration-credentials', /color:#62B5E5[^>]*>ST-Ab2xk/.test(samples['registration-credentials'].html.replace(/\s+/g, '')), 'temp password not blue-highlighted');
// Registration spec strings.
const reg = samples['registration-credentials'];
check('registration-credentials', reg.subject === 'You Are Successfully Registered | ShieldTech Security', `subject: ${reg.subject}`);
for (const s of ['Account Activated', 'Welcome to ShieldTech Security', 'Username', 'Temporary Password', 'Access Portal', 'Access Your Account', 'create a new password after your first sign-in', 'Need assistance']) {
  check('registration-credentials', new RegExp(s, 'i').test(reg.html), `missing: ${s}`);
}

// ── Visual render: desktop 700px + mobile 390px ──
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name] of Object.entries(samples)) {
  for (const [label, width] of [['desktop', 700], ['mobile', 390]]) {
    const page = await (await browser.newContext({ viewport: { width, height: 1400 } })).newPage();
    await page.goto('file://' + `${OUT}/${name}.html`);
    await page.waitForTimeout(120);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(name, overflow <= 2, `${label} horizontal overflow ${overflow}px`);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(name, bg === 'rgb(9, 11, 13)', `${label} body bg ${bg}`);
    await page.screenshot({ path: `${OUT}/${name}-${label}.png`, fullPage: true });
    await page.context().close();
  }
}
await browser.close();

console.log(`templates rendered: ${Object.keys(samples).length} (html+text+2 screenshots each)`);
console.log('assertion failures:', errs.length ? errs : 'none');
process.exit(errs.length ? 1 : 0);
