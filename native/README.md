# ShieldTech native apps (Android + iOS)

Three Capacitor projects — `portal/`, `tech/`, `customer/` — each a thin native
shell that loads the LIVE production app (`server.url` in
`<app>/capacitor.config.json`). Because the web apps self-update on every
deploy, the installed native apps are always current: no store re-submission,
no reinstall.

| App | Bundle id | Loads |
|---|---|---|
| portal | `com.shieldtech.portal` | https://portal.shieldtechsolutions.com |
| tech | `com.shieldtech.tech` | https://tech.shieldtechsolutions.com |
| customer | `com.shieldtech.customer` | https://customer.shieldtechsolutions.com |
| sales | `com.shieldtech.sales` | https://sales.shieldtechsolutions.com |

## Android APKs (automated)

`.github/workflows/mobile-apps.yml` builds all three APKs on every push that
touches `native/**` (or manually via Actions → "Build mobile apps" → Run) and
refreshes the rolling GitHub release **mobile-apps-latest**, so these download
links never change:

- `…/releases/download/mobile-apps-latest/shieldtech-portal.apk`
- `…/releases/download/mobile-apps-latest/shieldtech-tech.apk`
- `…/releases/download/mobile-apps-latest/shieldtech-customer.apk`

The customer-facing download page is `/get-apps.html` on any of the three apps.

**Stable signing (recommended):** without repo secrets the workflow signs each
run with a fresh keystore — installs work, but updating requires uninstalling
first. To fix that once and forever:

```bash
keytool -genkeypair -v -keystore shieldtech.keystore -alias shieldtech \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 shieldtech.keystore   # → ANDROID_KEYSTORE_B64
```

Add repo secrets `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS` (Settings → Secrets → Actions). Keep the keystore file
safe — it is the app's identity. Play Store publishing later uses the same
projects (`bundleRelease` → .aab) with a Google Play developer account ($25
one-time).

## iOS

Apple does not allow direct IPA downloads — iOS distribution is either the
App Store/TestFlight (needs an Apple Developer account, $99/yr) or the
Add-to-Home-Screen install that already works today (Safari → Share → Add to
Home Screen; instructions on `/get-apps.html`).

When the Apple Developer account exists:

```bash
cd native/<app> && npm ci && npx cap sync ios
npx cap open ios       # opens Xcode (macOS)
```

In Xcode: set the Team under Signing & Capabilities → Product → Archive →
Distribute (TestFlight or App Store). CI compiles the iOS projects unsigned on
every run so they never rot.

## Local development

```bash
cd native/<app>
npm ci
npx cap sync            # pushes www/ + config into android/ and ios/
npx cap open android    # Android Studio
```

Icons/splash come from `native/assets/` (`icon.png` 1024², `splash*.png`
2732²) via `npx @capacitor/assets generate --ios --android` run inside each
app folder (the per-app `assets/` copies are gitignored; regenerate any time).
