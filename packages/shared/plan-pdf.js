/* PDF plan-set import — turns a multi-page PDF into per-sheet images so the
   Plan Room can treat every page as a drawing (markup, pins, chat). Rendering
   happens in the browser via pdf.js (lazy-loaded chunk, worker included by
   Vite), at print-quality resolution.

   window.__shieldPlanPdf.importPdf(file, onProgress?) →
     { ok, pages: [{ name, blob, width, height }] } | { ok:false, error }
   onProgress(done, total) fires after each rendered page. */

const MAX_PAGES = 40;          // guardrail — a 200-sheet set would melt phones
const TARGET_WIDTH = 2200;     // px; crisp enough to zoom into dimension text

let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function importPdf(file, onProgress) {
  try {
    const pdfjs = await loadPdfjs();
    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data }).promise;
    const total = Math.min(doc.numPages, MAX_PAGES);
    const truncated = doc.numPages > MAX_PAGES;
    const base = String(file.name || 'plans').replace(/\.pdf$/i, '');
    const pages = [];
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      const vp1 = page.getViewport({ scale: 1 });
      const scale = Math.min(4, TARGET_WIDTH / vp1.width);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.88));
      page.cleanup();
      if (!blob) continue;
      pages.push({
        name: total > 1 ? `${base} — Sheet ${i} of ${doc.numPages}` : base,
        blob, width: canvas.width, height: canvas.height,
      });
      if (onProgress) { try { onProgress(i, total); } catch {} }
    }
    try { doc.destroy(); } catch {}
    if (!pages.length) return { ok: false, error: 'No pages could be rendered' };
    return { ok: true, pages, truncated, numPages: doc.numPages };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'PDF import failed' };
  }
}

window.__shieldPlanPdf = { importPdf, MAX_PAGES };
