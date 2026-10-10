# ShieldTech Design Language — dark SaaS (mobile-first)

The visual system for the ShieldTech apps: a premium dark, mono-accented SaaS
look. Inspired by the dark-SaaS mobile genre (immersive OLED surfaces, mono
headings, one vivid accent, spectrum data viz, frosted cards, floating pill
nav) — built as **ShieldTech's own** language with original assets and branding,
not a copy of any specific third-party design.

First surface shipped on it: the **shared credential/login screen**
(`packages/shared/proto/screen-login.jsx`), which every app renders through
`ShieldAuthGate`, so sign-in is identical across portal, tech, customer, sales
and on mobile.

## Tokens (measured / chosen)

### Color
| Role | Value |
| --- | --- |
| Screen base | `#060410` |
| Card / surface | `#0C0A14` (indigo-tinted near-black) |
| Elevated surface | `#141221` |
| Hairline border | `rgba(255,255,255,0.08)` |
| Border (strong/focusable) | `rgba(255,255,255,0.16)` |
| Text — primary | `#FAFAFB` |
| Text — secondary | `#A1A0A6` |
| Text — tertiary / labels | `#656365` |
| **Accent (indigo)** | `#6366F1` · hover `#7D7CF5` · glow `rgba(99,102,241,0.55)` |
| Ambient gradient | `#6E3AA6` → `#84329E` → `#3A2597` over `#060410` |
| Status — ok / warn / critical | `#4ED99A` / `#FBBF24` / `#FF6B6B` |

Vivid color comes from **content** (rim-lit avatars, the rainbow spectrum/
performance bar), not from chrome. Chrome stays black + white + gray + one
indigo accent.

### Type
- **Headings:** Geist Mono (medium, slight positive tracking) — the mono/sans
  contrast is the signature.
- **Body / UI:** Geist (`'Geist', -apple-system, 'Segoe UI', Roboto, sans-serif`).
- **Hero metric:** Geist 700–800, tight tracking, large.
- Loaded via Google Fonts `<link>` in each app's `index.html`.

### Shape & motion
- Radii: main cards ~24px · nested ~18px · inputs/buttons 12px · pills 100px.
- Depth from hairline borders + soft shadows (not heavy drop shadows).
- Motion: short, springy (`cubic-bezier(.22,1,.36,1)`, 120–180ms); button press
  dips ~0.98; honor `prefers-reduced-motion`.

## Signature components
- **Rainbow spectrum/performance bar** — dense vertical ticks, red→orange→
  yellow→green→cyan→blue→violet gradient.
- **Frosted-glass sub-card** — translucent, blurred, indigo-tinted, light top border.
- **Neon-lit avatars** — circular, colored rim-glow; production uses real
  headshots with a colored rim treatment (original art/placeholders meanwhile).
- **Floating pill nav** — rounded dark bar of line icons + a circular brand button.
- **Stat/metric cards** — mono label, large value, delta pill, sparkline.

## Rollout
1. ✅ Shared credential/login screen (all apps + mobile).
2. Tech app home (Overview / Performance / Tasks) in this language, live data.
3. Portal / customer / sales surfaces.
