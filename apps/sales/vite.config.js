import { shieldViteConfig } from '../../packages/shared/vite-shared-config.js';
// shieldViteConfig uses a relative base, so the same build serves at
// sales.shieldtechsolutions.com AND mounted under
// portal.shieldtechsolutions.com/sales/ (live fallback until the dedicated
// domain is attached in Vercel).
export default shieldViteConfig();
