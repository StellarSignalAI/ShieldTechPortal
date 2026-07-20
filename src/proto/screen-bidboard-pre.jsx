// ============================================================
// Portal ↔ Bid Room bridge (pre) — capture portal globals
// that the Secret Weapon UI kit would otherwise overwrite.
// Loaded BEFORE sw/sw-ui.jsx in ShieldTech Portal.html.
// ============================================================
window.__portalIcon = window.Icon;
window.__portalSegmented = window.Segmented;
