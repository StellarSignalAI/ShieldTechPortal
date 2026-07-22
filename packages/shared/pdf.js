/* Real document export — browser-native, no dependencies. Renders a branded,
   print-styled HTML document and opens the print dialog (Save as PDF on every
   OS/mobile). window.__shieldPdf.exportDoc(). Pulls identity from brandStore. */

function brand() {
  try { return (window.brandStore && window.brandStore.get()) || {}; } catch { return {}; }
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const money = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* doc = { kind:'invoice'|'estimate'|'proposal', number, date, customer,
          to:[lines], meta:[{k,v}], lineItems:[{desc,qty,rate}], notes,
          sections:[{title, body|rows}], total? } */
export function exportDoc(doc) {
  const b = brand();
  const items = doc.lineItems || [];
  const computed = items.reduce((s, l) => s + (Number(l.qty) || 1) * (Number(l.rate) || 0), 0);
  const total = doc.total != null ? doc.total : computed;
  const title = doc.kind === 'estimate' ? 'ESTIMATE' : doc.kind === 'proposal' ? 'PROPOSAL' : 'INVOICE';

  const itemRows = items.map(l => `<tr>
    <td>${esc(l.desc)}</td>
    <td class="r">${esc(l.qty ?? 1)}</td>
    <td class="r">${money(l.rate)}</td>
    <td class="r">${money((Number(l.qty) || 1) * (Number(l.rate) || 0))}</td></tr>`).join('');

  const sections = (doc.sections || []).map(sec => `
    <div class="sec"><h3>${esc(sec.title)}</h3>
      ${sec.body ? `<p>${esc(sec.body)}</p>` : ''}
      ${sec.rows ? `<ul>${sec.rows.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title} ${esc(doc.number || '')}</title>
  <style>
    @page { margin: 18mm; }
    * { box-sizing: border-box; }
    body { font: 13px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; color: #10161d; margin: 0; }
    .hd { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #3FA9F5; padding-bottom: 14px; }
    .co { font-size: 19px; font-weight: 700; color: #0b2b47; }
    .co small { display: block; font-size: 11px; font-weight: 400; color: #5c6f86; margin-top: 3px; }
    .doc { text-align: right; }
    .doc .t { font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #3FA9F5; }
    .doc .n { font-size: 12px; color: #5c6f86; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; margin: 20px 0; }
    .meta .box { font-size: 12px; }
    .meta .lbl { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #98a7b8; margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #98a7b8; border-bottom: 1px solid #d9e2ec; padding: 7px 6px; }
    th.r, td.r { text-align: right; }
    td { padding: 8px 6px; border-bottom: 1px solid #eef2f6; }
    .tot { margin-top: 14px; text-align: right; }
    .tot .row { display: inline-flex; gap: 30px; padding: 4px 0; font-size: 13px; }
    .tot .grand { font-size: 18px; font-weight: 800; color: #0b2b47; border-top: 2px solid #10161d; padding-top: 8px; }
    .sec { margin-top: 18px; } .sec h3 { font-size: 13px; color: #0b2b47; margin: 0 0 5px; }
    .sec p, .sec li { font-size: 12px; color: #34434f; }
    .notes { margin-top: 22px; font-size: 11px; color: #5c6f86; border-top: 1px solid #eef2f6; padding-top: 10px; }
    .pay { margin-top: 16px; padding: 12px 16px; background: #eef7ff; border: 1px solid #cfe6fb; border-radius: 8px; font-size: 12px; }
    .pay a { color: #1a72c4; font-weight: 700; }
  </style></head><body>
    <div class="hd">
      <div class="co">${esc(b.company || 'ShieldTech Solutions LLC')}
        <small>${esc(b.address || '')}${b.phone ? ' · ' + esc(b.phone) : ''}${b.email ? ' · ' + esc(b.email) : ''}${b.license ? ' · ' + esc(b.license) : ''}</small></div>
      <div class="doc"><div class="t">${title}</div><div class="n">${esc(doc.number || '')}${doc.date ? ' · ' + esc(doc.date) : ''}</div></div>
    </div>
    <div class="meta">
      <div class="box"><div class="lbl">Bill To</div>${esc(doc.customer || '')}${(doc.to || []).map(l => `<div>${esc(l)}</div>`).join('')}</div>
      <div class="box r">${(doc.meta || []).map(m => `<div><span class="lbl">${esc(m.k)}</span> ${esc(m.v)}</div>`).join('')}</div>
    </div>
    ${items.length ? `<table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="tot"><div class="row grand"><span>Total</span><span>${money(total)}</span></div></div>` : ''}
    ${sections}
    ${doc.payLink ? `<div class="pay">Pay online: <a href="${esc(doc.payLink)}">${esc(doc.payLink)}</a></div>` : ''}
    ${doc.notes ? `<div class="notes">${esc(doc.notes)}</div>` : ''}
    <script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { // popup blocked (common on mobile) — fall back to a data-URL download
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(doc.kind || 'document')}-${doc.number || Date.now()}.html`;
    a.click();
    return { ok: true, via: 'download' };
  }
  w.document.write(html); w.document.close();
  return { ok: true, via: 'print' };
}

window.__shieldPdf = { exportDoc };
