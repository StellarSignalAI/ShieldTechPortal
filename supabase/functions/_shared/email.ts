// ShieldTech Security — unified transactional email design system.
//
// ONE master visual identity for every automated email the platform sends:
// black/near-black shell, charcoal panels, white/gray type, ShieldTech light
// blue accents. Table-based layout + inline styles so it renders correctly in
// Gmail, Outlook, Apple Mail, and mobile clients. No JS, no gradients, no
// stock imagery. Every template returns { subject, html, text } — always pass
// BOTH html and text to Resend for the plain-text fallback.
//
// Build emails from the exported components (eyebrow, heading, para, infoCard,
// kvRow, cta, alertBox, successBox, securityNote, supportBlock, …) and wrap
// with shell(). Do NOT hand-roll one-off HTML documents in edge functions.

/* ── Brand ── */
export const EMAIL_BRAND = {
  company: "ShieldTech Security LLC",
  shortName: "ShieldTech Security",
  tagline: "Low Voltage. Zero Punch List.",
  phone: "484-800-1220",
  site: "ShieldTechSolutions.com",
  siteUrl: "https://shieldtechsolutions.com",
  support: "customer@shieldtechsolutions.com",
};

/* ── Palette ── */
const BG = "#090B0D";        // main background
const HEADER = "#050607";    // header / footer
const CARD = "#111519";      // panels
const BORDER = "#26313A";    // borders
const WHITE = "#FFFFFF";     // primary text
const TEXT2 = "#B8C0C7";     // secondary text
const MUTED = "#7E8A94";     // muted text
const BLUE = "#62B5E5";      // ShieldTech light blue
const BLUE_DIM = "rgba(98,181,229,0.12)";
const OK = "#4ADE80";        // success (used WITH a label, never color-only)
const WARN = "#F0B429";      // alert   (used WITH a label, never color-only)

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const RADIUS = "3px";

const portalBase = () =>
  (Deno.env.get("PORTAL_URL") ?? "https://portal.shieldtechsolutions.com").replace(/\/+$/, "");
const logoUrl = () => `${portalBase()}/uploads/ShieldTech%20Logo%20Transparent%20MK3.png`;

/* ── Safety: escape every dynamic value dropped into markup ── */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const money = (n: unknown) =>
  "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ══════════════ Components ══════════════ */

/* Small uppercase status/category label. */
export function eyebrow(label: string, color = BLUE): string {
  return `<div style="margin:0 0 14px;">
    <span style="display:inline-block;padding:4px 10px;border:1px solid ${color};border-radius:${RADIUS};
      color:${color};font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;
      font-family:${FONT};">${label}</span></div>`;
}

export function heading(t: string): string {
  return `<h1 style="margin:0 0 12px;color:${WHITE};font-size:22px;line-height:1.3;font-weight:700;
    letter-spacing:-0.01em;font-family:${FONT};">${t}</h1>`;
}

export function para(t: string): string {
  return `<p style="margin:0 0 16px;color:${TEXT2};font-size:14px;line-height:1.65;font-family:${FONT};">${t}</p>`;
}

export function mutedPara(t: string): string {
  return `<p style="margin:0 0 14px;color:${MUTED};font-size:12px;line-height:1.6;font-family:${FONT};">${t}</p>`;
}

export function divider(): string {
  return `<div style="border-top:1px solid ${BORDER};margin:20px 0;font-size:0;line-height:0;">&nbsp;</div>`;
}

/* Key/value row for information cards. highlight=true renders the value in
   ShieldTech blue monospace (temporary passwords, amounts, references). */
export function kvRow(label: string, value: string, opts: { highlight?: boolean; mono?: boolean } = {}): string {
  const color = opts.highlight ? BLUE : WHITE;
  const family = opts.highlight || opts.mono ? MONO : FONT;
  const weight = opts.highlight ? 700 : 600;
  const size = opts.highlight ? "16px" : "14px";
  return `<tr>
    <td style="padding:12px 0 3px;color:${MUTED};font-size:10px;font-weight:700;letter-spacing:0.16em;
      text-transform:uppercase;font-family:${FONT};">${label}</td></tr>
  <tr><td style="padding:0 0 12px;border-bottom:1px solid ${BORDER};color:${color};font-size:${size};
      font-weight:${weight};font-family:${family};word-break:break-all;line-height:1.5;">${value}</td></tr>`;
}

/* Dark information/details card. Pass kvRow(...) rows and/or raw inner html. */
export function infoCard(rowsHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:${CARD};border:1px solid ${BORDER};border-radius:${RADIUS};margin:6px 0 20px;">
    <tr><td style="padding:8px 20px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
    </td></tr></table>`;
}

/* Line-item table (invoices / quotes) inside a card. */
export function lineTable(lines: Array<{ desc?: unknown; qty?: unknown; rate?: unknown }>, total?: number): string {
  const rows = lines.slice(0, 14).map((l) =>
    `<tr>
      <td style="padding:9px 12px 9px 0;border-bottom:1px solid ${BORDER};color:${TEXT2};font-size:13px;font-family:${FONT};line-height:1.5;">
        ${esc(l.desc)}${Number(l.qty) > 1 ? `<br/><span style="color:${MUTED};font-size:11px;font-family:${MONO};">${Number(l.qty)} × ${money(l.rate)}</span>` : ""}
      </td>
      <td align="right" valign="top" style="padding:9px 0;border-bottom:1px solid ${BORDER};color:${WHITE};font-size:13px;font-weight:600;font-family:${MONO};white-space:nowrap;">${money((Number(l.qty) || 1) * (Number(l.rate) || 0))}</td>
    </tr>`).join("");
  const totalRow = total != null
    ? `<tr>
        <td style="padding:14px 12px 2px 0;color:${WHITE};font-size:14px;font-weight:700;font-family:${FONT};">Total</td>
        <td align="right" style="padding:14px 0 2px;color:${BLUE};font-size:20px;font-weight:700;font-family:${MONO};white-space:nowrap;">${money(total)}</td>
      </tr>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:${CARD};border:1px solid ${BORDER};border-radius:${RADIUS};margin:6px 0 20px;">
    <tr><td style="padding:12px 20px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${totalRow}</table>
    </td></tr></table>`;
}

/* Primary light-blue CTA button. Full-width on mobile via max-width table. */
export function cta(label: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
    <tr><td>
      <a href="${url}"
        style="display:block;text-align:center;background:${BLUE};color:#04121F;
        font-weight:700;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;
        padding:15px 24px;border-radius:${RADIUS};font-family:${FONT};">${label}</a>
    </td></tr></table>`;
}

/* Secondary outline button / link. */
export function secondaryLink(label: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
    <tr><td>
      <a href="${url}"
        style="display:block;text-align:center;background:${BLUE_DIM};border:1px solid ${BORDER};color:${WHITE};
        font-weight:600;font-size:13px;text-decoration:none;padding:12px 22px;border-radius:${RADIUS};
        font-family:${FONT};">${label}</a>
    </td></tr></table>`;
}

/* Alert/warning box (labelled — never color-only). */
export function alertBox(text: string, label = "Attention"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:${CARD};border:1px solid ${WARN};border-left:3px solid ${WARN};border-radius:${RADIUS};margin:6px 0 18px;">
    <tr><td style="padding:14px 18px;">
      <div style="color:${WARN};font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;font-family:${FONT};margin-bottom:5px;">⚠ ${label}</div>
      <div style="color:${TEXT2};font-size:13px;line-height:1.6;font-family:${FONT};">${text}</div>
    </td></tr></table>`;
}

/* Success state box (labelled — never color-only). */
export function successBox(text: string, label = "Confirmed"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:${CARD};border:1px solid ${OK};border-left:3px solid ${OK};border-radius:${RADIUS};margin:6px 0 18px;">
    <tr><td style="padding:14px 18px;">
      <div style="color:${OK};font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;font-family:${FONT};margin-bottom:5px;">✓ ${label}</div>
      <div style="color:${TEXT2};font-size:13px;line-height:1.6;font-family:${FONT};">${text}</div>
    </td></tr></table>`;
}

/* Security notice — for authentication-sensitive emails. */
export function securityNote(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="border-top:1px solid ${BORDER};margin:4px 0 0;">
    <tr><td style="padding:14px 0 0;">
      <div style="color:${BLUE};font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;font-family:${FONT};margin-bottom:4px;">Security</div>
      <div style="color:${MUTED};font-size:12px;line-height:1.6;font-family:${FONT};">${text}</div>
    </td></tr></table>`;
}

/* Support / help section. */
export function supportBlock(text?: string): string {
  return `<p style="margin:14px 0 0;color:${MUTED};font-size:12px;line-height:1.6;font-family:${FONT};">
    ${text ?? "Need assistance?"} Contact
    <a href="mailto:${EMAIL_BRAND.support}" style="color:${BLUE};text-decoration:none;">${EMAIL_BRAND.support}</a></p>`;
}

/* ── Master shell: black header + centered logo + blue accent line + footer ── */
export function shell(innerHtml: string, preheader = ""): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${EMAIL_BRAND.shortName}</title></head>
<body style="margin:0;padding:0;background:${BG};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr><td align="center" style="padding:0 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${HEADER};border-radius:${RADIUS} ${RADIUS} 0 0;padding:26px 20px 22px;" align="center">
          <img src="${logoUrl()}" alt="${EMAIL_BRAND.shortName} — ${EMAIL_BRAND.tagline}" width="190"
            style="display:block;height:auto;max-width:190px;border:0;" />
        </td></tr>
        <!-- Accent line -->
        <tr><td style="background:${BLUE};height:2px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr><td style="background:${BG};border:1px solid ${BORDER};border-top:0;border-bottom:0;padding:30px 28px 26px;">
          ${innerHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${HEADER};border-radius:0 0 ${RADIUS} ${RADIUS};border-top:1px solid ${BORDER};padding:22px 20px 26px;" align="center">
          <div style="color:${WHITE};font-size:11px;font-weight:700;letter-spacing:0.22em;font-family:${FONT};">SHIELDTECH SECURITY</div>
          <div style="color:${BLUE};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;font-family:${FONT};margin:6px 0 10px;">${EMAIL_BRAND.tagline}</div>
          <div style="color:${MUTED};font-size:12px;font-family:${FONT};line-height:1.8;">
            ${EMAIL_BRAND.phone}<br/>
            <a href="${EMAIL_BRAND.siteUrl}" style="color:${TEXT2};text-decoration:none;">${EMAIL_BRAND.site}</a><br/>
            <a href="mailto:${EMAIL_BRAND.support}" style="color:${MUTED};text-decoration:none;">${EMAIL_BRAND.support}</a>
          </div>
          <div style="color:${MUTED};font-size:10px;font-family:${FONT};margin-top:12px;opacity:0.8;">
            This is an automated message from ${EMAIL_BRAND.company}.
          </div>
        </td></tr>

        <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* Plain-text footer for every fallback body. */
export function textFooter(): string {
  return [
    "", "—", "SHIELDTECH SECURITY", EMAIL_BRAND.tagline.toUpperCase(),
    EMAIL_BRAND.phone, EMAIL_BRAND.site, EMAIL_BRAND.support,
  ].join("\n");
}

export const subjectFor = (action: string) => `${action} | ${EMAIL_BRAND.shortName}`;

export interface InviteEmail { html: string; subject: string; text: string; }

/* ══════════════ Templates ══════════════ */

/* Portal routing: account type → destination. */
export function portalFor(rights: Record<string, boolean> | null | undefined, role?: string): { name: string; url: string } {
  const r = rights ?? {};
  const techUrl = (Deno.env.get("TECH_URL") ?? "https://tech.shieldtechsolutions.com").replace(/\/+$/, "");
  const salesUrl = (Deno.env.get("SALES_URL") ?? "https://portal.shieldtechsolutions.com/sales").replace(/\/+$/, "");
  const custUrl = (Deno.env.get("CUSTOMER_URL") ?? "https://customer.shieldtechsolutions.com").replace(/\/+$/, "");
  const portUrl = portalBase();
  if (role === "Technician" || (r.tech && !r.portal && !r.sales)) return { name: "Technician Portal", url: techUrl };
  if (role === "Sales" || (r.sales && !r.portal && !r.tech)) return { name: "Sales CRM", url: salesUrl };
  if (role === "Client" || (r.customer && !r.portal && !r.tech && !r.sales)) return { name: "Customer Portal", url: custUrl };
  return { name: "ShieldTech Portal", url: portUrl };
}

/* Registration / invite with credentials (email = username). */
export function credentialsEmail(opts: {
  name?: string; email: string; password: string; portalName: string; accessUrl: string; installUrl?: string;
}): InviteEmail {
  const hi = opts.name ? `${esc(opts.name.split(/\s+/)[0])}, your` : "Your";
  const html = shell(
    eyebrow("Account Activated") +
    heading(`Welcome to ${EMAIL_BRAND.shortName}`) +
    para(`${hi} account has been successfully registered and is ready for access.`) +
    infoCard(
      kvRow("Username", esc(opts.email)) +
      kvRow("Temporary Password", esc(opts.password), { highlight: true }) +
      kvRow("Access Portal", esc(opts.portalName)),
    ) +
    cta("Access Your Account →", opts.accessUrl) +
    (opts.installUrl ? secondaryLink("Add it to your phone's home screen", opts.installUrl) : "") +
    securityNote("For security, you'll be prompted to create a new password after your first sign-in. Your temporary password stops working as soon as you set your own.") +
    supportBlock(),
    "Your account is registered and ready for access.",
  );
  const text = [
    `Welcome to ${EMAIL_BRAND.shortName}`,
    "", "Your account has been successfully registered and is ready for access.",
    "", `USERNAME: ${opts.email}`, `TEMPORARY PASSWORD: ${opts.password}`, `ACCESS PORTAL: ${opts.portalName}`,
    "", `Access your account: ${opts.accessUrl}`,
    "", "For security, you'll be prompted to create a new password after your first sign-in.",
    `Need assistance? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("You Are Successfully Registered"), html, text };
}

/* Domain (@shieldtechsolutions.com) invitee — signs in with Google SSO. */
export function googleWelcomeEmail(opts: {
  name?: string; portalName: string; accessUrl: string; installUrl?: string;
}): InviteEmail {
  const hi = opts.name ? `${esc(opts.name.split(/\s+/)[0])}, your` : "Your";
  const html = shell(
    eyebrow("Account Activated") +
    heading(`Welcome to ${EMAIL_BRAND.shortName}`) +
    para(`${hi} account has been successfully registered and is ready for access.`) +
    infoCard(
      kvRow("Sign-In Method", "Google — no password needed") +
      kvRow("Access Portal", esc(opts.portalName)),
    ) +
    para(`Click the button below, choose <strong style="color:${WHITE};">Continue with Google</strong>, and use your @shieldtechsolutions.com email. That's it.`) +
    cta("Access Your Account →", opts.accessUrl) +
    (opts.installUrl ? secondaryLink("Add it to your phone's home screen", opts.installUrl) : "") +
    securityNote("Your access is protected by your Google account. Never share sign-in links from unexpected senders.") +
    supportBlock(),
    "Your account is registered — sign in with Google.",
  );
  const text = [
    `Welcome to ${EMAIL_BRAND.shortName}`,
    "", "Your account has been successfully registered and is ready for access.",
    "", "SIGN-IN METHOD: Google (no password needed)", `ACCESS PORTAL: ${opts.portalName}`,
    "", `Access your account: ${opts.accessUrl}`,
    "", `Need assistance? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("You Are Successfully Registered"), html, text };
}

/* Technician invite — one destination, the Tech Portal. */
export function technicianInviteEmail(opts: {
  name?: string; email: string; password?: string; techUrl: string; installUrl?: string; google?: boolean;
}): InviteEmail {
  if (opts.google) {
    const m = googleWelcomeEmail({ name: opts.name, portalName: "Technician Portal", accessUrl: opts.techUrl, installUrl: opts.installUrl });
    return { ...m, subject: subjectFor("Your Technician Portal Access") };
  }
  const m = credentialsEmail({
    name: opts.name, email: opts.email, password: opts.password ?? "",
    portalName: "Technician Portal", accessUrl: opts.techUrl, installUrl: opts.installUrl,
  });
  return { ...m, subject: subjectFor("Your Technician Portal Access") };
}

/* Sales invite — one destination, the Sales CRM. */
export function salesInviteEmail(opts: {
  name?: string; email: string; password?: string; salesUrl: string; installUrl?: string; google?: boolean;
}): InviteEmail {
  if (opts.google) {
    const m = googleWelcomeEmail({ name: opts.name, portalName: "Sales CRM", accessUrl: opts.salesUrl, installUrl: opts.installUrl });
    return { ...m, subject: subjectFor("Your Sales CRM Access") };
  }
  const m = credentialsEmail({
    name: opts.name, email: opts.email, password: opts.password ?? "",
    portalName: "Sales CRM", accessUrl: opts.salesUrl, installUrl: opts.installUrl,
  });
  return { ...m, subject: subjectFor("Your Sales CRM Access") };
}

/* Admin reset / resend — new temporary password. */
export function resetEmail(opts: {
  email: string; password: string; portalUrl: string; resend: boolean;
}): InviteEmail {
  const action = opts.resend ? "Your ShieldTech Invitation" : "Your Password Has Been Reset";
  const html = shell(
    eyebrow(opts.resend ? "Invitation" : "Password Reset") +
    heading(opts.resend ? "Your sign-in details" : "Your password was reset") +
    para(opts.resend
      ? "Here are your ShieldTech sign-in details. You'll set your own password on first login."
      : "An administrator reset your password. Use the temporary password below to sign in, then set a new one.") +
    infoCard(
      kvRow("Username", esc(opts.email)) +
      kvRow("Temporary Password", esc(opts.password), { highlight: true }),
    ) +
    cta("Access Your Account →", opts.portalUrl) +
    securityNote("This temporary password stops working the moment you set your own. If you didn't expect this email, contact us immediately.") +
    supportBlock(),
    opts.resend ? "Your ShieldTech sign-in details." : "Your password was reset by an administrator.",
  );
  const text = [
    action,
    "", opts.resend
      ? "Here are your ShieldTech sign-in details. You'll set your own password on first login."
      : "An administrator reset your password. Use the temporary password below to sign in, then set a new one.",
    "", `USERNAME: ${opts.email}`, `TEMPORARY PASSWORD: ${opts.password}`,
    "", `Sign in: ${opts.portalUrl}`,
    "", `Need assistance? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor(opts.resend ? "Your ShieldTech Invitation" : "Your Password Has Been Changed"), html, text };
}

/* Invoice available. */
export function invoiceEmail(opts: {
  ref: string; customer: string; amount: number; due?: string | null;
  lines?: Array<{ desc?: unknown; qty?: unknown; rate?: unknown }>; link: string;
}): InviteEmail {
  const dueTxt = opts.due
    ? new Date(String(opts.due) + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const html = shell(
    eyebrow("Invoice Available") +
    heading(`Invoice ${esc(opts.ref)}`) +
    para(`Prepared for <strong style="color:${WHITE};">${esc(opts.customer)}</strong> by ${EMAIL_BRAND.company}.`) +
    infoCard(
      kvRow("Invoice Number", esc(opts.ref), { mono: true }) +
      kvRow("Amount Due", money(opts.amount), { highlight: true }) +
      (dueTxt ? kvRow("Due Date", dueTxt) : ""),
    ) +
    (opts.lines && opts.lines.length ? lineTable(opts.lines, opts.amount) : "") +
    cta("View Invoice →", opts.link) +
    mutedPara("You can pay securely online from the invoice page.") +
    supportBlock("Questions about this invoice?"),
    `Invoice ${opts.ref} — ${money(opts.amount)}${dueTxt ? ` due ${dueTxt}` : ""}.`,
  );
  const text = [
    `Invoice ${opts.ref}`,
    "", `Prepared for ${opts.customer} by ${EMAIL_BRAND.company}.`,
    "", `INVOICE NUMBER: ${opts.ref}`, `AMOUNT DUE: ${money(opts.amount)}`,
    ...(dueTxt ? [`DUE DATE: ${dueTxt}`] : []),
    "", `View & pay online: ${opts.link}`,
    "", `Questions? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("Invoice Available"), html, text };
}

/* Invoice reminder (overdue). */
export function invoiceReminderEmail(opts: {
  ref: string; amount: number; dueDate: string; daysPast: number; link: string;
}): InviteEmail {
  const dueTxt = new Date(opts.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const html = shell(
    eyebrow("Payment Reminder", WARN) +
    heading(`Invoice ${esc(opts.ref)} is past due`) +
    para(`This is a friendly reminder from ${EMAIL_BRAND.company}.`) +
    infoCard(
      kvRow("Invoice Number", esc(opts.ref), { mono: true }) +
      kvRow("Amount Due", money(opts.amount), { highlight: true }) +
      kvRow("Was Due", `${dueTxt} — ${opts.daysPast} day${opts.daysPast > 1 ? "s" : ""} ago`),
    ) +
    cta("View & Pay Invoice →", opts.link) +
    mutedPara("Already paid? Please disregard — payments can take a day to post.") +
    supportBlock("Questions about this invoice?"),
    `Invoice ${opts.ref} (${money(opts.amount)}) is ${opts.daysPast} day${opts.daysPast > 1 ? "s" : ""} past due.`,
  );
  const text = [
    `Invoice ${opts.ref} is past due`,
    "", `Amount due: ${money(opts.amount)} — was due ${dueTxt} (${opts.daysPast} day${opts.daysPast > 1 ? "s" : ""} ago).`,
    "", `View & pay: ${opts.link}`,
    "", "Already paid? Please disregard — payments can take a day to post.",
    `Questions? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("Invoice Reminder"), html, text };
}

/* Proposal available / approval requested. */
export function proposalEmail(opts: {
  ref: string; customer?: string | null; amount?: number | null; link: string;
}): InviteEmail {
  const html = shell(
    eyebrow("Proposal Available") +
    heading(`Proposal ${esc(opts.ref)}`) +
    para(`Prepared for <strong style="color:${WHITE};">${esc(opts.customer ?? "you")}</strong> by ${EMAIL_BRAND.company}.`) +
    infoCard(
      kvRow("Proposal Number", esc(opts.ref), { mono: true }) +
      (opts.amount ? kvRow("Proposal Total", money(opts.amount), { highlight: true }) : ""),
    ) +
    para("Please review your proposal and confirm your decision on the secure page below. Accepting starts your project — our team follows up to schedule kickoff.") +
    cta("View Proposal →", opts.link) +
    supportBlock("Questions about this proposal? Reply to this email or"),
    `Proposal ${opts.ref}${opts.amount ? ` — ${money(opts.amount)}` : ""} is ready for your review.`,
  );
  const text = [
    `Proposal ${opts.ref}`,
    "", `Prepared for ${opts.customer ?? "you"} by ${EMAIL_BRAND.company}.`,
    ...(opts.amount ? ["", `PROPOSAL TOTAL: ${money(opts.amount)}`] : []),
    "", "Review and respond on the secure page:", opts.link,
    "", `Questions? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("Proposal Available"), html, text };
}

/* Job / project assignment — sent to a technician the moment a scheduled
   project or job is assigned to them. */
export function jobAssignedEmail(opts: {
  name?: string | null; title: string; customer?: string | null; site?: string | null;
  date?: string | null; endDate?: string | null; startTime?: string | null;
  hours?: number | string | null; notes?: string | null; jobRef?: string | null;
}): InviteEmail {
  const hi = opts.name ? `${esc(String(opts.name).split(/\s+/)[0])}, you've` : "You've";
  const techUrl = (Deno.env.get("TECH_URL") ?? "https://tech.shieldtechsolutions.com").replace(/\/+$/, "");
  const fmtDay = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(`${iso}T12:00:00`);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };
  const when = fmtDay(opts.date);
  const until = opts.endDate && opts.endDate !== opts.date ? fmtDay(opts.endDate) : null;
  const html = shell(
    eyebrow("Job Assigned") +
    heading("You're On a New Job") +
    para(`${hi} been assigned to the following job. Full details, site access notes, and photo checklists are in your Technician Portal.`) +
    infoCard(
      (opts.jobRef ? kvRow("Job", esc(opts.jobRef), { mono: true }) : "") +
      kvRow("Project", esc(opts.title)) +
      (opts.customer ? kvRow("Customer", esc(opts.customer)) : "") +
      (opts.site ? kvRow("Site", esc(opts.site)) : "") +
      (when ? kvRow(until ? "Starts" : "Scheduled", esc(when), { highlight: true }) : "") +
      (until ? kvRow("Through", esc(until)) : "") +
      (opts.startTime ? kvRow("Start Time", esc(opts.startTime)) : "") +
      (opts.hours ? kvRow("Est. Hours", esc(String(opts.hours))) : ""),
    ) +
    (opts.notes ? para(`<strong style="color:${WHITE};">Notes:</strong> ${esc(opts.notes)}`) : "") +
    cta("Open Technician Portal →", techUrl) +
    supportBlock("Questions about this assignment? Reply to this email or"),
    `New job: ${opts.title}${when ? ` — ${when}` : ""}`,
  );
  const text = [
    "You're on a new job",
    "", `PROJECT: ${opts.title}`,
    ...(opts.jobRef ? [`JOB: ${opts.jobRef}`] : []),
    ...(opts.customer ? [`CUSTOMER: ${opts.customer}`] : []),
    ...(opts.site ? [`SITE: ${opts.site}`] : []),
    ...(when ? [`${until ? "STARTS" : "SCHEDULED"}: ${when}`] : []),
    ...(until ? [`THROUGH: ${until}`] : []),
    ...(opts.startTime ? [`START TIME: ${opts.startTime}`] : []),
    ...(opts.hours ? [`EST. HOURS: ${opts.hours}`] : []),
    ...(opts.notes ? ["", `NOTES: ${opts.notes}`] : []),
    "", `Open your Technician Portal: ${techUrl}`,
    "", `Questions? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("New Job Assigned"), html, text };
}

/* Timesheet rejection — tells the technician to fix and resubmit the entry. */
export function timesheetRejectedEmail(opts: {
  name?: string | null; workDate?: string | null; hours?: number | string | null;
  jobRef?: string | null; note?: string | null;
}): InviteEmail {
  const hi = opts.name ? `${esc(String(opts.name).split(/\s+/)[0])}, one` : "One";
  const techUrl = (Deno.env.get("TECH_URL") ?? "https://tech.shieldtechsolutions.com").replace(/\/+$/, "");
  const day = opts.workDate && /^\d{4}-\d{2}-\d{2}$/.test(String(opts.workDate))
    ? new Date(`${opts.workDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : (opts.workDate ?? null);
  const html = shell(
    eyebrow("Action Needed", WARN) +
    heading("Your Time Entry Was Returned") +
    para(`${hi} of your time entries was reviewed and sent back. Please open the Technician Portal, correct it, and resubmit.`) +
    infoCard(
      (day ? kvRow("Work Date", esc(day)) : "") +
      (opts.hours ? kvRow("Hours", esc(String(opts.hours))) : "") +
      (opts.jobRef ? kvRow("Project / Job", esc(opts.jobRef)) : "") +
      (opts.note ? kvRow("Reviewer Note", esc(opts.note), { highlight: true }) : ""),
    ) +
    (opts.note ? "" : para("No note was included — check with the office if you're unsure what needs to change.")) +
    cta("Fix Your Time Entry →", techUrl) +
    supportBlock("Questions about this review? Reply to this email or"),
    `Time entry ${day ? `for ${day} ` : ""}was returned — please fix and resubmit.`,
  );
  const text = [
    "Your time entry was returned",
    "", "One of your time entries was reviewed and sent back. Please correct it and resubmit.",
    ...(day ? ["", `WORK DATE: ${day}`] : []),
    ...(opts.hours ? [`HOURS: ${opts.hours}`] : []),
    ...(opts.jobRef ? [`PROJECT / JOB: ${opts.jobRef}`] : []),
    ...(opts.note ? [`REVIEWER NOTE: ${opts.note}`] : []),
    "", `Fix it in the Technician Portal: ${techUrl}`,
    "", `Questions? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("Time Entry Rejected"), html, text };
}

/* Timesheet submission — alerts the office that hours are waiting for review.
   Covers a single entry or a whole-week submit (count > 1). */
export function timesheetSubmittedEmail(opts: {
  techName?: string | null; workDate?: string | null; hours?: number | string | null;
  jobRef?: string | null; notes?: string | null; count?: number | null;
}): InviteEmail {
  const portalUrl = portalBase();
  const many = Number(opts.count) > 1;
  const who = opts.techName ? esc(opts.techName) : "A technician";
  const day = opts.workDate && /^\d{4}-\d{2}-\d{2}$/.test(String(opts.workDate))
    ? new Date(`${opts.workDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : (opts.workDate ?? null);
  const html = shell(
    eyebrow("Timesheet") +
    heading(many ? "Week of Time Entries Submitted" : "New Time Entry Submitted") +
    para(`${who} submitted ${many ? `${esc(String(opts.count))} time entries` : "a time entry"} for approval. Review ${many ? "them" : "it"} in the portal's approval queue.`) +
    infoCard(
      (opts.techName ? kvRow("Technician", esc(opts.techName)) : "") +
      (day ? kvRow(many ? "Latest Work Date" : "Work Date", esc(day)) : "") +
      (opts.hours ? kvRow("Hours", esc(String(opts.hours))) : "") +
      (opts.jobRef ? kvRow("Project / Job", esc(opts.jobRef)) : "") +
      (opts.notes ? kvRow("Notes", esc(opts.notes)) : ""),
    ) +
    cta("Review & Approve →", portalUrl) +
    supportBlock(),
    `${opts.techName ?? "A technician"} submitted ${many ? "time entries" : "a time entry"} for approval.`,
  );
  const text = [
    many ? "Week of time entries submitted" : "New time entry submitted",
    "", `${opts.techName ?? "A technician"} submitted ${many ? `${opts.count} time entries` : "a time entry"} for approval.`,
    ...(day ? ["", `WORK DATE: ${day}`] : []),
    ...(opts.hours ? [`HOURS: ${opts.hours}`] : []),
    ...(opts.jobRef ? [`PROJECT / JOB: ${opts.jobRef}`] : []),
    ...(opts.notes ? [`NOTES: ${opts.notes}`] : []),
    "", `Review in the portal: ${portalUrl}`,
    "", `Questions? Contact ${EMAIL_BRAND.support}`,
    textFooter(),
  ].join("\n");
  return { subject: subjectFor("Time Entry Submitted"), html, text };
}

/* Generic system notification — wraps ad-hoc messages (e.g. the Sales app's
   AI-drafted emails sent through send-email) in the master identity. */
export function notificationEmail(opts: {
  subject: string; headline?: string; message: string; label?: string;
  ctaLabel?: string; ctaUrl?: string;
}): InviteEmail {
  const paragraphs = opts.message.split(/\n{2,}/).map((p) => para(esc(p).replace(/\n/g, "<br/>"))).join("");
  const html = shell(
    eyebrow(opts.label ?? "Notification") +
    (opts.headline ? heading(esc(opts.headline)) : "") +
    paragraphs +
    (opts.ctaLabel && opts.ctaUrl ? cta(opts.ctaLabel, opts.ctaUrl) : "") +
    supportBlock(),
    opts.message.slice(0, 90),
  );
  const text = [
    opts.headline ?? opts.subject, "", opts.message,
    ...(opts.ctaUrl ? ["", opts.ctaUrl] : []),
    textFooter(),
  ].join("\n");
  return { subject: opts.subject, html, text };
}
