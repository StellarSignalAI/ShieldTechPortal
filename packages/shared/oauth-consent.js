/* OAuth 2.1 consent screen — the portal's Authorization Path for the Supabase
   Auth OAuth server (Authentication → OAuth Server → Authorization Path:
   /oauth/consent). Third-party clients (ChatGPT Business connecting to the
   ShieldTech MCP servers) redirect users here with ?authorization_id=; the
   signed-in user reviews the client + scopes and approves or denies.

   NEVER-BLANK CONTRACT: a shell renders synchronously before any async work,
   global error handlers repaint failures visibly, and every phase is wrapped —
   a runtime error can degrade this page but can no longer blank it.
   (The historical blank screen was asset-path 404s under /oauth/* — fixed by
   the /oauth/assets rewrite in apps/portal/vercel.json.)

   Plain DOM on purpose: no app shell, no business data. Sign-in (password or
   Google) keeps the FULL current URL, so the user always lands back on this
   exact consent request — never the dashboard. RBAC: only office roles
   (Admin/Staff/Manager) can approve, mirroring what the MCP servers enforce
   server-side on every call anyway. */
import { supabase, supabaseConfigured } from './supabase.js';

const AUTH_ID = new URLSearchParams(window.location.search).get('authorization_id');
const OFFICE = ['Admin', 'Staff', 'Manager'];

/* Structured, secret-free logging (no tokens, codes, cookies, or credentials). */
const olog = (evt, extra) => {
  try { console.log(JSON.stringify({ evt: `oauth.consent.${evt}`, path: window.location.pathname, has_authorization_id: Boolean(AUTH_ID), ...extra })); } catch { /* noop */ }
};

const el = (tag, style, text) => {
  const n = document.createElement(tag);
  if (style) n.setAttribute('style', style);
  if (text != null) n.textContent = text;
  return n;
};

const S = {
  page: 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0e14;color:#e5ecf5;font-family:Montserrat,system-ui,sans-serif;padding:20px;',
  card: 'max-width:440px;width:100%;background:rgba(18,24,33,0.97);border:1px solid rgba(63,169,245,0.25);border-radius:14px;padding:28px;',
  h: 'font-size:17px;font-weight:700;margin:0 0 6px;',
  sub: 'font-size:12px;color:#8fa3b8;margin:0 0 18px;line-height:1.5;',
  label: 'font-size:9px;font-weight:700;letter-spacing:0.1em;color:#8fa3b8;text-transform:uppercase;margin:14px 0 4px;',
  val: 'font-size:13px;color:#e5ecf5;word-break:break-all;',
  input: 'width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:10px;border-radius:8px;border:1px solid rgba(63,169,245,0.25);background:#0a0e14;color:#e5ecf5;font-size:13px;',
  btnRow: 'display:flex;gap:10px;margin-top:20px;',
  approve: 'flex:1;padding:11px;border-radius:8px;border:1px solid rgba(52,211,153,0.5);background:rgba(52,211,153,0.15);color:#34d399;font-size:13px;font-weight:700;cursor:pointer;',
  deny: 'flex:1;padding:11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:transparent;color:#8fa3b8;font-size:13px;font-weight:700;cursor:pointer;',
  ghost: 'width:100%;padding:11px;border-radius:8px;border:1px solid rgba(63,169,245,0.35);background:transparent;color:#3fa9f5;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;',
  err: 'font-size:12px;color:#fbbf24;margin-top:12px;line-height:1.5;',
  denied: 'font-size:12px;color:#f87171;border:1px solid rgba(248,113,113,0.4);border-radius:8px;padding:10px 12px;margin-top:16px;line-height:1.5;',
};

function shell(title, subtitle) {
  document.body.innerHTML = '';
  const page = el('div', S.page);
  const card = el('div', S.card);
  card.appendChild(el('div', 'font-size:11px;font-weight:700;letter-spacing:0.14em;color:#3fa9f5;margin-bottom:6px;', 'SHIELDTECH SECURITY'));
  card.appendChild(el('div', 'font-size:10px;color:#8fa3b8;margin-bottom:14px;', 'ShieldTech HR & Payroll — authorization'));
  card.appendChild(el('h1', S.h, title));
  if (subtitle) card.appendChild(el('p', S.sub, subtitle));
  page.appendChild(card);
  document.body.appendChild(page);
  return card;
}

function renderFatal(msg) {
  const card = shell('Something went wrong', 'The authorization screen hit an unexpected error. Close this tab and start the connection again from the requesting application; if it repeats, contact a ShieldTech admin.');
  card.appendChild(el('div', S.err, msg || 'Unknown error'));
}

async function whoAmI() {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return null;
  let role = null, name = null;
  try {
    const { data: p } = await supabase.from('profiles').select('role,name').eq('id', u.user.id).maybeSingle();
    role = p?.role || null; name = p?.name || null;
  } catch { /* profile lookup best-effort; role stays null → treated as unauthorized */ }
  return { id: u.user.id, email: u.user.email, role, name: name || u.user.email };
}

function renderLogin(note) {
  const card = shell('Sign in to continue', 'An application is requesting access to ShieldTech on your behalf. Sign in with your portal account to review the request — you will come straight back to this authorization, not the dashboard.');
  if (note) card.appendChild(el('div', S.err, note));

  const email = el('input', S.input); email.type = 'email'; email.placeholder = 'Work email'; email.autocomplete = 'username';
  const pass = el('input', S.input); pass.type = 'password'; pass.placeholder = 'Password'; pass.autocomplete = 'current-password';
  const btn = el('button', S.approve, 'Sign in');
  const gbtn = el('button', S.ghost, 'Continue with Google');
  const err = el('div', S.err, '');
  card.appendChild(email); card.appendChild(pass); card.appendChild(btn); card.appendChild(gbtn); card.appendChild(err);

  const go = async () => {
    btn.disabled = true; btn.textContent = 'Signing in…'; err.textContent = '';
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
      if (error) { err.textContent = error.message; return; }
      olog('login.ok');
      main();
    } catch (e) {
      err.textContent = String(e && e.message || e);
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  };
  btn.addEventListener('click', go);
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  gbtn.addEventListener('click', async () => {
    gbtn.disabled = true; gbtn.textContent = 'Opening Google…';
    // Same-origin round-trip back to THIS exact URL (authorization_id included).
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) { err.textContent = error.message; gbtn.disabled = false; gbtn.textContent = 'Continue with Google'; }
  });
}

function renderConsent(who, details) {
  const client = details.client || details;
  const clientName = client.client_name || client.name || client.client_id || 'Unknown application';
  const redirectUri = client.redirect_uri || (client.redirect_uris || [])[0] || details.redirect_uri || '';
  const scopes = String(details.scope || '').split(' ').filter(Boolean);
  const office = OFFICE.includes(who.role);
  olog('consent.render', { user: who.id, role_authorized: office });

  const card = shell('Authorize access', `${clientName} is requesting access to ShieldTech on your behalf.`);
  const row = (l, v) => { card.appendChild(el('div', S.label, l)); card.appendChild(el('div', S.val, v)); };
  row('Signed in as', `${who.name} (${who.role || 'no role'})`);
  row('Application', clientName);
  if (redirectUri) row('Redirects to', redirectUri);
  row('Requested scopes', scopes.length ? scopes.join(', ') : '(default profile access)');
  card.appendChild(el('p', S.sub + 'margin-top:14px;',
    'Approving lets this application use the ShieldTech HR & Payroll tools as you — HR, employee, timecard, ' +
    'compensation and payroll functions, limited by your portal role. Consequential HR/payroll actions still ' +
    'require separate human Admin approval inside the portal, and Rippling credentials are never shared with ' +
    'the application.'));

  const err = el('div', S.err, '');
  const btns = el('div', S.btnRow);
  const deny = el('button', S.deny, 'Deny');
  btns.appendChild(deny);

  if (office) {
    const approve = el('button', S.approve, 'Approve');
    btns.appendChild(approve);
    approve.addEventListener('click', () => decide('approve', approve, err));
  } else {
    card.appendChild(el('div', S.denied,
      `Access denied for your role (${who.role || 'none'}). Only office accounts — Admin, Staff or Manager — may ` +
      'authorize applications to act on ShieldTech HR & payroll data. You can deny this request, or ask an admin.'));
    olog('consent.role_denied', { user: who.id, role: who.role });
  }
  card.appendChild(btns); card.appendChild(err);
  deny.addEventListener('click', () => decide('deny', deny, err));
}

async function decide(action, btn, err) {
  btn.disabled = true; btn.textContent = action === 'approve' ? 'Approving…' : 'Denying…';
  try {
    const fn = action === 'approve' ? supabase.auth.oauth.approveAuthorization : supabase.auth.oauth.denyAuthorization;
    // supabase-js redirects the browser to data.redirect_url itself; the manual
    // assign below is the fallback if that behavior is ever disabled.
    const { data, error } = await fn.call(supabase.auth.oauth, AUTH_ID);
    if (error) {
      olog(`${action}.error`, { code: error.code || null, message: error.message });
      err.textContent = error.message;
      btn.disabled = false; btn.textContent = action === 'approve' ? 'Approve' : 'Deny';
      return;
    }
    olog(`${action}.ok`, { redirected: Boolean(data && data.redirect_url) });
    if (data && data.redirect_url) window.location.assign(data.redirect_url);
    else shell('Done', action === 'approve'
      ? 'Access approved. You can close this tab and return to the application.'
      : 'Request denied. You can close this tab.');
  } catch (e) {
    olog(`${action}.throw`, { message: String(e && e.message || e) });
    err.textContent = String(e && e.message || e);
    btn.disabled = false; btn.textContent = action === 'approve' ? 'Approve' : 'Deny';
  }
}

async function main() {
  shell('Checking this request…', 'Verifying your session and the authorization request.');

  const who = await whoAmI();
  if (!who) { olog('login.required'); renderLogin(); return; }
  olog('session.ok', { user: who.id, role: who.role });

  if (!supabase.auth.oauth || typeof supabase.auth.oauth.getAuthorizationDetails !== 'function') {
    olog('sdk.missing_oauth_api');
    renderFatal('This build of the portal does not include the OAuth authorization API (supabase-js too old). Redeploy the portal with @supabase/supabase-js ≥ 2.99.');
    return;
  }

  const { data: details, error } = await supabase.auth.oauth.getAuthorizationDetails(AUTH_ID);
  if (error || !details) {
    olog('details.error', { code: (error && error.code) || null, message: (error && error.message) || 'no data' });
    const card = shell('Invalid or expired authorization request',
      'This request could not be loaded. It may have expired, been used already, or the link is malformed. Close this tab and start the connection again from the requesting application.');
    if (error) card.appendChild(el('div', S.err, `${error.message}${error.code ? ` (${error.code})` : ''}`));
    return;
  }
  // Consent was already granted earlier: Supabase returns only a redirect_url.
  if (details.redirect_url && !details.client && !details.scope) {
    olog('details.already_consented');
    window.location.assign(details.redirect_url);
    return;
  }
  renderConsent(who, details);
}

(function boot() {
  document.title = 'Authorize — ShieldTech';
  window.addEventListener('error', (e) => { olog('window.error', { message: String(e.message).slice(0, 200) }); renderFatal(String(e.message)); });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String((e.reason && e.reason.message) || e.reason || 'unhandled rejection').slice(0, 200);
    olog('window.rejection', { message: msg });
    renderFatal(msg);
  });

  if (!supabaseConfigured) { olog('not_configured'); shell('Not configured', 'The authentication backend is not configured for this deployment.'); return; }
  if (!AUTH_ID) {
    olog('missing_authorization_id');
    shell('Missing OAuth authorization request.',
      'This page must be opened by an application requesting access — no authorization_id is present in the URL. Close this tab and start the connection again from the requesting application (e.g. ChatGPT).');
    return;
  }
  main().catch((e) => { olog('main.throw', { message: String(e && e.message || e).slice(0, 200) }); renderFatal(String(e && e.message || e)); });
})();
