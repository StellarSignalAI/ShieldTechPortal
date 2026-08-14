/* Receipts pipeline client — window.__shieldReceipts.
   Techs and office quick-snap receipts into a shared inbox; the office
   converts each to a categorized expense in one click.
     snap(fileOrDataUrl, {note, vendor, amount, jobRef})
                       → upload to the private receipts bucket + inbox row
     list(status?)     → rows (RLS: staff see all, techs see their own)
     imageUrl(row)     → short-lived signed URL for the receipt image
     convert(id, {vendor, amount, category}) → mark converted (the caller
                       writes the expense record to the expense store)
     dismiss(id)
   Degrades gracefully (ok:false) when Supabase isn't configured. */
import { supabase, supabaseConfigured } from './supabase.js';

async function me() {
  const { data } = await supabase.auth.getSession();
  return (data && data.session && data.session.user) || null;
}

async function snap(input, meta = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'Backend not configured' };
  try {
    const user = await me();
    if (!user) return { ok: false, error: 'sign in required' };
    const blob = typeof input === 'string' ? await (await fetch(input)).blob() : input;
    const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
    const path = `${user.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('receipts')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg' });
    if (upErr) return { ok: false, error: upErr.message };
    const { data, error } = await supabase.from('receipts').insert({
      uploaded_by: user.id,
      uploader_name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || null,
      path, note: meta.note || null, vendor: meta.vendor || null,
      amount: meta.amount != null && meta.amount !== '' ? Number(meta.amount) : null,
      job_ref: meta.jobRef || null,
      expense_category: meta.category || null,
    }).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function list(status) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured', data: [] };
  let q = supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: data || [] };
}

async function imageUrl(row) {
  if (!supabaseConfigured || !row || !row.path) return null;
  try {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(row.path, 60 * 60);
    return (data && data.signedUrl) || null;
  } catch { return null; }
}

async function convert(id, patch = {}) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured' };
  const user = await me();
  const { error } = await supabase.from('receipts').update({
    status: 'converted',
    vendor: patch.vendor ?? undefined,
    amount: patch.amount != null && patch.amount !== '' ? Number(patch.amount) : undefined,
    expense_category: patch.category || null,
    converted_by: user ? user.id : null,
    converted_at: new Date().toISOString(),
  }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function dismiss(id) {
  if (!supabaseConfigured) return { ok: false, error: 'not configured' };
  const { error } = await supabase.from('receipts').update({ status: 'dismissed' }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

window.__shieldReceipts = { snap, list, imageUrl, convert, dismiss };
