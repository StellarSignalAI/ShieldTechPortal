/* OAuth 2.1 consent screen — the portal's Authorization Path for the Supabase
   Auth OAuth server (Authentication → OAuth Server → Authorization Path:
   /oauth/consent). Third-party clients (e.g. ChatGPT Business connecting to
   the ShieldTech MCP servers) redirect users here with an ?authorization_id=;
   the signed-in user reviews the client + scopes and approves or denies.
   Plain DOM on purpose: this page must work before (and without) the app
   shell, and never loads any business data. RBAC: only office roles
   (Admin/Staff/Manager) may approve — matching what the MCP servers enforce
   server-side anyway. */
import { supabase, supabaseConfigured } from './supabase.js';

const el = (tag, style, text) => {
  const n = document.createElement(tag);
  if (style) n.setAttribute('style', style);
  if (text != null) n.textContent = text;
  return n;
};

const S = {
  page: 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0e14;color:#e5ecf5;font-family:Montserrat,system-ui,sans-serif;padding:20px;',
  card: 'max-width:420px;width:100%;background:rgba(18,24,33,0.95);border:1px solid rgba(63,169,245,0.25);border-radius:14px;padding:28px;',
  h: 'font-size:17px;font-weight:700;margin:0 0 6px;',
  sub: 'font-size:12px;color:#8fa3b8;margin:0 0 18px;line-height:1.5;',
  label: 'font-size:9px;font-weight:700;letter-spacing:0.1em;color:#8fa3b8;text-transform:uppercase;margin:14px 0 4px;',
  val: 'font-size:13px;color:#e5ecf5;word-break:break-all;',
  input: 'width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:10px;border-radius:8px;border:1px solid rgba(63,169,245,0.25);background:#0a0e14;color:#e5ecf5;font-size:13px;',
  btnRow: 'display:flex;gap:10px;margin-top:20px;',
  approve: 'flex:1;padding:11px;border-radius:8px;border:1px solid rgba(52,211,153,0.5);background:rgba(52,211,153,0.15);color:#34d399;font-size:13px;font-weight:700;cursor:pointer;',
  deny: 'flex:1;padding:11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:transparent;color:#8fa3b8;font-size:13px;font-weight:700;cursor:pointer;',
  err: 'font-size:12px;color:#fbbf24;margin-top:12px;line-height:1.5;',
};

function shell(title, subtitle) {
  document.body.innerHTML = '';
  const page = el('div', S.page);
  const card = el('div', S.card);
  card.appendChild(el('div', 'font-size:11px;font-weight:700;letter-spacing:0.14em;color:#3fa9f5;margin-bottom:14px;', 'SHIELDTECH SECURITY'));
  card.appendChild(el('h1', S.h, title));
  if (subtitle) card.appendChild(el('p', S.sub, subtitle));
  page.appendChild(card);
  document.body.appendChild(page);
  return card;
}

async function myRole() {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return null;
  const { data: p } = await supabase.from('profiles').select('role,name').eq('id', u.user.id).maybeSingle();
  return { id: u.user.id, email: u.user.email, role: p?.role || null, name: p?.name || u.user.email };
}

function renderLogin(onSignedIn, note) {
  const card = shell('Sign in to continue', 'An application is requesting access to your ShieldTech account. Sign in with your portal credentials to review the request.');
  if (note) card.appendChild(el('div', S.err, note));
  const email = el('input', S.input); email.type = 'email'; email.placeholder = 'Work email'; email.autocomplete = 'username';
  const pass = el('input', S.input); pass.type = 'password'; pass.placeholder = 'Password'; pass.autocomplete = 'current-password';
  const btn = el('button', S.approve, 'Sign in');
  const err = el('div', S.err, '');
  card.appendChild(email); card.appendChild(pass); card.appendChild(btn); card.appendChild(err);
  const go = async () => {
    btn.disabled = true; btn.textContent = 'Signing in…'; err.textContent = '';
    const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
    if (error) { err.textContent = error.message; btn.disabled = false; btn.textContent = 'Sign in'; return; }
    onSignedIn();
  };
  btn.addEventListener('click', go);
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

async function renderConsent(authorizationId) {
  const who = await myRole();
  if (!who) { renderLogin(() => renderConsent(authorizationId)); return; }

  const { data: details, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !details) {
    shell('Authorization request not found', (error && error.message) || 'This request may have expired. Close this tab and start again from the connecting application.');
    return;
  }
  const client = details.client || details;
  const clientName = client.client_name || client.name || client.client_id || 'Unknown application';
  const scopes = (details.scope || '').split(' ').filter(Boolean);
  const office = ['Admin', 'Staff', 'Manager'].includes(who.role);

  const card = shell('Authorize access', `${clientName} is requesting access to ShieldTech on your behalf.`);
  card.appendChild(el('div', S.label, 'Signed in as'));
  card.appendChild(el('div', S.val, `${who.name} (${who.role || 'no role'})`));
  card.appendChild(el('div', S.label, 'Application'));
  card.appendChild(el('div', S.val, clientName));
  if (client.redirect_uri || (client.redirect_uris || [])[0]) {
    card.appendChild(el('div', S.label, 'Redirects to'));
    card.appendChild(el('div', S.val, client.redirect_uri || client.redirect_uris[0]));
  }
  card.appendChild(el('div', S.label, 'Requested scopes'));
  card.appendChild(el('div', S.val, scopes.length ? scopes.join(', ') : '(default profile access)'));
  card.appendChild(el('p', S.sub + 'margin-top:14px;',
    'Approving lets this application call the ShieldTech MCP servers as you. Your role limits what it can do; ' +
    'consequential HR/payroll actions still require separate human Admin approval inside the portal, and Rippling ' +
    'credentials are never shared with the application.'));

  const err = el('div', S.err, '');
  const row = el('div', S.btnRow);
  const deny = el('button', S.deny, 'Deny');
  const approve = el('button', S.approve, office ? 'Approve' : 'Approve (blocked)');
  if (!office) {
    approve.disabled = true;
    err.textContent = 'Only office accounts (Admin/Staff/Manager) may authorize MCP access. You can deny the request.';
  }
  row.appendChild(deny); row.appendChild(approve);
  card.appendChild(row); card.appendChild(err);

  const finish = (data, fallbackMsg) => {
    const url = data && (data.redirect_to || data.redirect_url || data.url);
    if (url) window.location.assign(url);
    else shell('Done', fallbackMsg);
  };
  approve.addEventListener('click', async () => {
    if (!office) return;
    approve.disabled = true; approve.textContent = 'Approving…';
    const { data, error: e } = await supabase.auth.oauth.approveAuthorization(authorizationId);
    if (e) { err.textContent = e.message; approve.disabled = false; approve.textContent = 'Approve'; return; }
    finish(data, 'Access approved. You can close this tab and return to the application.');
  });
  deny.addEventListener('click', async () => {
    deny.disabled = true; deny.textContent = 'Denying…';
    const { data, error: e } = await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (e) { err.textContent = e.message; deny.disabled = false; deny.textContent = 'Deny'; return; }
    finish(data, 'Request denied. You can close this tab.');
  });
}

(function boot() {
  document.title = 'Authorize — ShieldTech';
  if (!supabaseConfigured) { shell('Not configured', 'Authentication backend is not configured.'); return; }
  const id = new URLSearchParams(window.location.search).get('authorization_id');
  if (!id) { shell('Missing authorization request', 'This page must be opened by an application requesting access (no authorization_id present).'); return; }
  renderConsent(id);
})();
