/* Generates the Technician-app logo family from the ShieldTech brand emblem:
   the shield mark + a wrench badge (field-service), in the brand blue gradient.
   Outputs web icons (favicon/PWA, maskable) and Android launcher mipmaps.
   Run from repo root: node scripts/make-tech-logo.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const EMBLEM = path.join(ROOT, 'packages/shared/public/uploads/ShieldTech Emblem Transparent MK1 .png');
const emblemB64 = fs.readFileSync(EMBLEM).toString('base64');

/* Wrench badge: dark disc, brand-gradient ring + wrench stroke (lucide path). */
const BADGE = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="stg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4DA6F5"/><stop offset="1" stop-color="#1E62D0"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="#0A0E14"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="url(#stg)" stroke-width="5"/>
  <g transform="translate(50 50) scale(2.1) translate(-12 -12)">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      fill="none" stroke="url(#stg)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

/* Icon composition: the wrench badge ALONE is the app icon (per Daniel) —
   the ShieldTech shield stays only in in-app branding, not on the icon.
   artPct scales the badge inside the canvas (for icon safe zones). */
const page1024 = (artPct, bg) => `<!doctype html><html><body style="margin:0;width:1024px;height:1024px;position:relative;${bg ? `background:${bg};` : ''}">
  <div style="position:absolute;left:50%;top:50%;width:${artPct * 1024}px;height:${artPct * 1024}px;transform:translate(-50%,-50%)">${BADGE}</div>
</body></html>`;
void emblemB64; // shield emblem no longer composed into icons

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 } });
const page = await ctx.newPage();

const shots = {};
async function render(key, { artPct, bg, transparent }) {
  await page.setContent(page1024(artPct, bg), { waitUntil: 'networkidle' });
  shots[key] = await page.screenshot({ omitBackground: !!transparent });
}

/* Master transparent mark, home-screen tiles, and adaptive foreground.
   The wrench badge IS the app icon — full-bleed, nothing else on it. */
await render('mark', { artPct: 0.98, transparent: true });      // favicon (transparent wrench disc)
await render('tile', { artPct: 0.98, bg: '#05070A' });          // iOS home screen + legacy Android launcher (full bleed)
await render('maskable', { artPct: 0.80, bg: '#05070A' });      // Android PWA maskable (art inside the 80% safe circle)
await render('fg', { artPct: 1.0, transparent: true });         // adaptive foreground — the launcher XML insets 16.7%/side to the safe zone

/* Resize helper: draw a shot onto a canvas at target size (in-page, lossless). */
async function resize(buf, size) {
  const b64 = Buffer.from(buf).toString('base64');
  await page.setContent(`<canvas id="c" width="${size}" height="${size}"></canvas>`);
  return Buffer.from(await page.evaluate(async ({ b64, size }) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
    const c = document.getElementById('c'), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, size, size);
    return c.toDataURL('image/png').split(',')[1];
  }, { b64, size }), 'base64');
}

const out = (p, buf) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); console.log('wrote', p, buf.length); };

/* Web: favicon (transparent), home-screen icon (full-bleed tile), maskable. */
out(path.join(ROOT, 'packages/shared/public/sw/shieldtech-tech-emblem.png'), await resize(shots.mark, 512));
out(path.join(ROOT, 'packages/shared/public/sw/shieldtech-tech-icon.png'), await resize(shots.tile, 512));
out(path.join(ROOT, 'packages/shared/public/sw/shieldtech-tech-maskable.png'), await resize(shots.maskable, 512));

/* Android launcher mipmaps (native/tech). */
const DENSITIES = { ldpi: [36, 81], mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
for (const [d, [launcher, fg]] of Object.entries(DENSITIES)) {
  const dir = path.join(ROOT, `native/tech/android/app/src/main/res/mipmap-${d}`);
  if (!fs.existsSync(dir)) continue;
  out(path.join(dir, 'ic_launcher.png'), await resize(shots.tile, launcher));
  out(path.join(dir, 'ic_launcher_round.png'), await resize(shots.tile, launcher));
  out(path.join(dir, 'ic_launcher_foreground.png'), await resize(shots.fg, fg));
}

await browser.close();
console.log('done');
