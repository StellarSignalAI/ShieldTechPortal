// Branded ShieldTech transactional email — matches the app UI: near-black
// background, brand blue (#3FA9F5), white type, ShieldTech logo. Table-based +
// inline styles so it renders in Gmail/Outlook/Apple Mail. Shared by
// invite-user and manage-user so every system email looks the same.

const BRAND = "#3FA9F5";
const BG = "#05070A";
const CARD = "#0B0F16";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#E8EEF5";
const MUTED = "#8A97A6";

const portalBase = () =>
  (Deno.env.get("PORTAL_URL") ?? "https://portal.shieldtechsolutions.com").replace(/\/+$/, "");

const logoUrl = () => `${portalBase()}/uploads/ShieldTech%20Logo%20Transparent%20MK3.png`;

// A single button styled as a filled brand pill.
function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#04121F;
    font-weight:700;font-size:15px;text-decoration:none;padding:13px 28px;border-radius:10px;
    font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${label}</a>`;
}

// A labelled credential row (monospace value on a subtle chip).
function credRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:${MUTED};font-size:12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${label}</td>
    <td style="padding:6px 0;text-align:right;">
      <span style="display:inline-block;background:rgba(63,169,245,0.10);border:1px solid ${BORDER};
        border-radius:6px;padding:4px 10px;color:${TEXT};font-size:13px;
        font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${value}</span>
    </td>
  </tr>`;
}

// Wrap body content in the branded shell (logo header + card + footer).
function shell(innerHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td align="center" style="padding-bottom:22px;">
          <img src="${logoUrl()}" alt="ShieldTech" width="180"
            style="display:block;height:auto;max-width:180px;" />
        </td></tr>
        <tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:32px;">
          ${innerHtml}
        </td></tr>
        <tr><td align="center" style="padding-top:20px;color:${MUTED};font-size:11px;
          font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          ShieldTech Solutions · Security Operations Platform<br/>
          This is an automated message — please don't reply.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const h = (t: string) =>
  `<h1 style="margin:0 0 10px;color:${TEXT};font-size:20px;font-weight:600;
    font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${t}</h1>`;
const p = (t: string) =>
  `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.55;
    font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${t}</p>`;

export interface InviteEmail { html: string; subject: string; }

// Domain (@shieldtechsolutions.com) invitee — signs in with Google SSO, no password.
export function googleWelcomeEmail(opts: { name?: string; apps: string; portalUrl: string }): InviteEmail {
  const hi = opts.name ? `Hi ${opts.name.split(/\s+/)[0]},` : "Welcome,";
  const inner =
    h("Your ShieldTech account is ready") +
    p(`${hi} your workspace access has been set up. Because you're on the ShieldTech Solutions
       domain, just sign in with your Google account — there's no password to manage.`) +
    p(`<strong style="color:${TEXT};">Access:</strong> ${opts.apps}`) +
    `<div style="padding:6px 0 4px;">${button("Sign in with Google", opts.portalUrl)}</div>` +
    p(`On the sign-in screen, choose <em>Continue with Google</em> and use your
       @shieldtechsolutions.com account.`);
  return { subject: "Welcome to ShieldTech — sign in with Google", html: shell(inner) };
}

// External invitee — gets a temporary password to set on first login.
export function credentialsEmail(opts: {
  name?: string; email: string; password: string; apps: string; portalUrl: string;
}): InviteEmail {
  const hi = opts.name ? `Hi ${opts.name.split(/\s+/)[0]},` : "Welcome,";
  const inner =
    h("You've been invited to ShieldTech") +
    p(`${hi} an account has been created for you on the ShieldTech platform. Use the temporary
       password below to sign in — you'll set your own password on first login.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="margin:4px 0 18px;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};padding:6px 0;">
       ${credRow("Username", opts.email)}
       ${credRow("Temporary password", opts.password)}
       ${credRow("Applications", opts.apps)}
     </table>` +
    `<div style="padding:2px 0 6px;">${button("Sign in to ShieldTech", opts.portalUrl)}</div>`;
  return { subject: "Your ShieldTech account", html: shell(inner) };
}

// Admin reset / resend — new temporary password.
export function resetEmail(opts: {
  email: string; password: string; portalUrl: string; resend: boolean;
}): InviteEmail {
  const inner =
    h(opts.resend ? "Your ShieldTech invitation" : "Your ShieldTech password was reset") +
    p(opts.resend
      ? "Here are your ShieldTech sign-in details. You'll set your own password on first login."
      : "An administrator reset your password. Use the temporary password below to sign in, then set a new one.") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="margin:4px 0 18px;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};padding:6px 0;">
       ${credRow("Username", opts.email)}
       ${credRow("Temporary password", opts.password)}
     </table>` +
    `<div style="padding:2px 0 6px;">${button("Sign in to ShieldTech", opts.portalUrl)}</div>`;
  return { subject: opts.resend ? "Your ShieldTech invitation" : "Your ShieldTech password was reset", html: shell(inner) };
}
