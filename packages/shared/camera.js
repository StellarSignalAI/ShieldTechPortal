/* Real camera capture + photo persistence for all ShieldTech surfaces.
   window.__shieldCamera:
     startStream(videoEl, facing) → live camera preview (getUserMedia)
     stopStream(videoEl)
     captureFrame(videoEl)       → compressed JPEG dataURL
     savePhoto(dataUrl, meta)    → uploads to Supabase Storage ('site-photos')
                                   when configured; returns {url} or {dataUrl}. */
import { supabase, supabaseConfigured } from './supabase.js';

export async function startStream(videoEl, facing = 'environment') {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { ok: false, error: 'Camera not available in this browser' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    return { ok: true, stream };
  } catch (e) {
    return { ok: false, error: e && e.name === 'NotAllowedError' ? 'Camera permission denied' : String(e) };
  }
}

export function stopStream(videoEl) {
  const s = videoEl && videoEl.srcObject;
  if (s) { s.getTracks().forEach(t => t.stop()); videoEl.srcObject = null; }
}

export function captureFrame(videoEl, maxDim = 1280, quality = 0.72) {
  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  if (!vw || !vh) return null;
  const scale = Math.min(1, maxDim / Math.max(vw, vh));
  const c = document.createElement('canvas');
  c.width = Math.round(vw * scale); c.height = Math.round(vh * scale);
  c.getContext('2d').drawImage(videoEl, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

export async function savePhoto(dataUrl, meta = {}) {
  if (supabaseConfigured) {
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        const path = `${meta.wo || 'general'}/${meta.id || 'ph-' + Date.now()}.jpg`;
        const blob = await dataUrlToBlob(dataUrl);
        const { error } = await supabase.storage.from('site-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('site-photos').getPublicUrl(path);
          if (data && data.publicUrl) return { ok: true, url: data.publicUrl };
        }
      }
    } catch { /* fall through to local */ }
  }
  // Offline / unconfigured: keep a smaller local copy so state stays light.
  const img = new Image();
  await new Promise(res => { img.onload = res; img.src = dataUrl; });
  const scale = Math.min(1, 640 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { ok: true, dataUrl: c.toDataURL('image/jpeg', 0.6) };
}

window.__shieldCamera = { startStream, stopStream, captureFrame, savePhoto };
