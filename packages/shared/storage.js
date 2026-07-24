/* Real file/document persistence for every ShieldTech surface (portal, tech,
   customer, mobile). One helper so anything a user uploads — team-member
   documents, receipts, work-order photos, proposal/contract PDFs, asset
   imports — lands in Supabase Storage and is tracked in the `attachments`
   registry, instead of living only as a session-local object URL.

   window.__shieldStorage:
     uploadFile(file, meta)      → File/Blob → Supabase Storage; returns
                                    {ok, url, id, name, size, mime} or a local
                                    {ok, url:objectURL,...} fallback offline.
     uploadDataUrl(dataUrl, meta)→ same, for canvas/camera data URLs.
     listAttachments(filter)     → rows from the attachments registry.
     removeAttachment(id)        → delete object + registry row.

   meta: { bucket?='documents', folder?='misc', name?, entity?, entityId?,
           shared?=true }  — `shared` rows are visible to all Admin/Staff;
   otherwise the row is owner-scoped. */
import { supabase, supabaseConfigured } from './supabase.js';

const DEFAULT_BUCKET = 'documents';

const slug = (s) => String(s || '')
  .toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';

const extOf = (name, mime) => {
  const m = /\.([a-z0-9]{1,8})$/i.exec(name || '');
  if (m) return m[1].toLowerCase();
  if (mime && mime.includes('/')) return mime.split('/')[1].split('+')[0].slice(0, 8);
  return 'bin';
};

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

// Core upload path shared by uploadFile / uploadDataUrl. `blob` is a Blob/File.
async function put(blob, meta = {}) {
  const bucket = meta.bucket || DEFAULT_BUCKET;
  const folder = slug(meta.folder || 'misc');
  const name = meta.name || (blob && blob.name) || 'file';
  const mime = meta.mime || (blob && blob.type) || 'application/octet-stream';
  const size = (blob && blob.size) || 0;

  if (supabaseConfigured) {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess && sess.session && sess.session.user && sess.session.user.id;
      if (uid) {
        const id = 'att-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        const path = `${folder}/${id}-${slug(name).replace(/\.[a-z0-9]+$/i, '')}.${extOf(name, mime)}`;
        const { error: upErr } = await supabase.storage
          .from(bucket).upload(path, blob, { contentType: mime, upsert: true });
        if (!upErr) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          const url = (pub && pub.publicUrl) || null;
          // Track it — best-effort; a missing table must not fail the upload.
          try {
            await supabase.from('attachments').insert({
              id, owner: uid, bucket, path, name, mime, size,
              url, entity: meta.entity || null, entity_id: meta.entityId || null,
              shared: meta.shared !== false,
            });
          } catch { /* registry optional */ }
          return { ok: true, id, url, path, bucket, name, mime, size };
        }
      }
    } catch { /* fall through to local */ }
  }
  // Offline / unconfigured: hand back a session object URL so the UI still works.
  const url = (typeof URL !== 'undefined' && URL.createObjectURL) ? URL.createObjectURL(blob) : null;
  return { ok: true, id: 'local-' + Date.now().toString(36), url, name, mime, size, local: true };
}

export async function uploadFile(file, meta = {}) {
  if (!file) return { ok: false, error: 'No file' };
  return put(file, { name: file.name, mime: file.type, ...meta });
}

export async function uploadDataUrl(dataUrl, meta = {}) {
  if (!dataUrl) return { ok: false, error: 'No data' };
  const blob = await dataUrlToBlob(dataUrl);
  return put(blob, meta);
}

export async function listAttachments(filter = {}) {
  if (!supabaseConfigured) return [];
  let q = supabase.from('attachments').select('*').order('created_at', { ascending: false });
  if (filter.entity) q = q.eq('entity', filter.entity);
  if (filter.entityId) q = q.eq('entity_id', filter.entityId);
  const { data } = await q;
  return data || [];
}

export async function removeAttachment(id) {
  if (!supabaseConfigured || !id) return { ok: false };
  const { data: row } = await supabase.from('attachments').select('bucket,path').eq('id', id).maybeSingle();
  if (row) { try { await supabase.storage.from(row.bucket).remove([row.path]); } catch { /* ignore */ } }
  await supabase.from('attachments').delete().eq('id', id);
  return { ok: true };
}

window.__shieldStorage = { uploadFile, uploadDataUrl, listAttachments, removeAttachment, DEFAULT_BUCKET };
