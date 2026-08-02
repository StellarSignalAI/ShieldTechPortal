/* Money-core flow check: numbering, dual-shape docs, proposal → doc → project
   → progress invoice → payment. Runs against apps/portal/dist. */
import { chromium } from 'playwright';
import http from 'http';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const DIST = new URL('../apps/portal/dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] || 'application/octet-stream');
  createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(4187, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://localhost:4187/#/dashboard');
await page.waitForTimeout(2500);

const result = await page.evaluate(() => {
  const out = {};
  try {
    localStorage.clear();
    window.invoiceStore.set([]); window.estimateStore.set([]);
    window.proposalStore.set([]); window.projectStore.set([]);

    /* 1. Numbering: three invoices, all distinct, sequential */
    const a = window.addInvoice({ customer_name: 'Test Co', total: 100 });
    const b = window.addInvoice({ customer_name: 'Test Co', total: 200 });
    const c = window.addInvoice({ customer_name: 'Test Co', total: 300 });
    out.invoiceNums = [a.doc_number, b.doc_number, c.doc_number];
    out.distinctNums = new Set(out.invoiceNums).size === 3;
    out.nextInvoiceNumAgrees = window.nextInvoiceNum() !== a.doc_number;

    /* 2. Dual shape */
    out.dualShape = !!(a.num && a.doc_number && a.customer && a.customer_name && a.amount === a.total && Array.isArray(a.lines));

    /* 3. Proposal record → doc → accept → project */
    const pid = window.nextProposalId();
    const rec = { id: pid, customer: 'Acme Test', title: 'T', status: 'draft',
      blocks: window.defaultProposalBlocks('Acme Test', 'T') };
    window.proposalStore.set([rec]);
    const doc = window.proposalToDoc(rec);
    out.docNum = doc.doc_number;
    out.docMatchesProposal = doc.doc_number === pid && doc.total > 0 && (doc.lines || []).length > 0;
    const proj = window.acceptEstimateToProject(doc, 'manual');
    out.projectCreated = !!proj.number && proj.contractTotal === doc.total;
    out.scopeCarried = (proj.notes || '').includes('Scope:');

    /* 4. Progress invoice from the project */
    const r = window.createProgressInvoice(proj.number, 50);
    out.progress = r.ok && Math.abs(r.amount - doc.total / 2) < 1;
    out.progressNumDistinct = r.ok && !out.invoiceNums.includes(r.invoice.doc_number);

    /* 5. Pay: mark the progress invoice paid via saveDocEdit */
    const inv = r.invoice;
    window.saveDocEdit('invoice', { num: inv.num, customer: inv.customer, status: 'paid', lines: inv.lines, total: inv.amount });
    const after = window.invoiceStore.get().find(x => (x.num || x.doc_number) === inv.num);
    out.paid = after && after.status === 'paid' && after.balance === 0;

    /* 6. Bid → pipeline (idempotent) */
    const d1 = window.bidToPipeline({ bidId: 'bid-1', customer: 'Gov', title: 'Job', total: 5000 });
    const d2 = window.bidToPipeline({ bidId: 'bid-1', customer: 'Gov', title: 'Job', total: 5000 });
    out.bidDoc = d1.doc_number;
    out.bidIdempotent = d1.doc_number === d2.doc_number &&
      window.estimateStore.get().filter(x => x.bid_ref === 'bid-1').length === 1;

    out.ok = out.distinctNums && out.dualShape && out.docMatchesProposal && out.projectCreated &&
      out.scopeCarried && out.progress && out.progressNumDistinct && out.paid && out.bidIdempotent;
  } catch (e) { out.error = String(e && e.stack || e); }
  return out;
});

console.log(JSON.stringify(result, null, 2));
console.log('PAGE ERRORS:', errs.length, errs.slice(0, 3));
await browser.close();
server.close();
process.exit(result.ok && errs.length === 0 ? 0 : 1);
