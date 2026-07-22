// Mobile surface manifest: everything the desktop portal loads, plus the
// mobile modules from "ShieldTech Mobile.html" in that shell's script order
// (mobile names don't collide with desktop ones, so appending is safe).
import './proto-manifest.js';

/* Mobile UI + native screens */
import './proto/mobile-ui.jsx';
import './proto/mobile-native-1.jsx';
import './proto/mobile-native-2.jsx';
import './proto/mobile-wiring.jsx';
import './proto/mobile-calendar.jsx';
import './proto/mobile-monitoring.jsx';
import './proto/mobile-ops.jsx';
import './proto/mobile-ops2.jsx';
import './proto/mobile-ops3.jsx';
import './proto/mobile-ops4.jsx';
import './proto/image-slot.js';
import './proto/mobile-finance.jsx';
import './proto/mobile-builders.jsx';
import './proto/mobile-survey.jsx';

/* SiteScan / SurveyScan capture suite (data files already load in the base manifest) */
import './proto/sitescan-capture.jsx';
import './proto/sitescan-vr.jsx';
import './proto/sitescan-export.jsx';
import './proto/sitescan-main.jsx';
import './proto/surveyscan-docs.jsx';
import './proto/surveyscan-tools.jsx';
import './proto/surveyscan-ai.jsx';
import './proto/surveyscan-estimate.jsx';
import './proto/surveyscan-hub.jsx';

/* QBO mobile mirror + the mobile app shell itself */
import './proto/mobile-finance-qbo.jsx';
import './proto/mobile-app.jsx';
import './proto/shared-invoicing.jsx';
import './proto/screen-estimates-invoices.jsx';
import './proto/screen-invoice-builder.jsx';
import './proto/screen-fleet.jsx';
import './proto/screen-fleet-share.jsx';
import './proto/screen-outbox.jsx';
import './proto/screen-secret-weapon.jsx';
import './proto/shared-context.jsx';
