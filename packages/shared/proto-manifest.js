// Prototype modules, imported in the exact order the HTML shell loaded them.
// This list mirrors the <script> tags in the prototype's "ShieldTech Portal.html".
// Sections still being vendored in are commented until their files land.

/* Shared */
import './proto/icons.jsx';
import './proto/shared-components.jsx';
import './proto/shared-state.jsx';
import './proto/shared-context.jsx';
import './proto/shell.jsx';
import './proto/photos-shared.jsx';

/* Widget Studio engine (My Dashboard widgets) */
import './proto/st-widgets-core.jsx';
import './proto/st-widgets-ops.jsx';
import './proto/st-widgets-money.jsx';
import './proto/st-widgets-fun.jsx';
import './proto/st-widgets-more1.jsx';
import './proto/st-widgets-more2.jsx';

/* Screens */
import './proto/screen-login.jsx';
import './proto/screen-dashboard.jsx';
import './proto/screen-customer.jsx';
import './proto/screen-customer-expanded.jsx';
import './proto/ai-message.jsx';
import './proto/screen-shieldtech-ai.jsx';
import './proto/screen-crm.jsx';
import './proto/screen-studio.jsx';
import './proto/screen-studio-views.jsx';
import './proto/screen-product-library.jsx';
import './proto/screen-service-plans.jsx';
import './proto/screen-approvals.jsx';
import './proto/screen-extras.jsx';
import './proto/screen-monitoring.jsx';
import './proto/screen-breakthrough.jsx';
import './proto/screen-more.jsx';
import './proto/screen-portal-v2.jsx';
import './proto/screen-gold-1.jsx';
import './proto/screen-gold-2.jsx';

/* New Screens */
import './proto/calendar-month.jsx';
import './proto/screen-calendar.jsx';
import './proto/screen-photos.jsx';
import './proto/screen-punchlist.jsx';
import './proto/screen-digest.jsx';
import './proto/screen-survey-estimator.jsx';
import './proto/screen-sched-copilot.jsx';
import './proto/screen-monitoring-intel.jsx';
import './proto/churn-radar.jsx';
import './proto/screen-revenue-tools.jsx';
import './proto/screen-rfp-wallboard.jsx';
import './proto/screen-helpdesk.jsx';
import './proto/screen-workorder.jsx';
import './proto/screen-purchase-orders.jsx';
import './proto/screen-quote-to-cash.jsx';
import './proto/screen-mrr.jsx';
import './proto/screen-parts-req.jsx';
import './proto/screen-warranty.jsx';
import './proto/screen-subcontractors.jsx';
import './proto/screen-nps.jsx';
import './proto/screen-incident.jsx';
import './proto/screen-skills.jsx';
import './proto/screen-knowledge.jsx';

/* V2 Upgrades */
import './proto/screen-finance-v2.jsx';
import './proto/screen-finance-books.jsx';
import './proto/screen-finance-payments.jsx';
import './proto/screen-finance-extended.jsx';
import './proto/screen-qbo-core.jsx';
import './proto/screen-qbo-finance.jsx';
import './proto/screen-qbo-modules.jsx';
import './proto/screen-qbo-admin.jsx';
import './proto/screen-branding-studio.jsx';
import './proto/screen-dispatch-v2.jsx';
import './proto/screen-proposal-v2.jsx';
import './proto/screen-sales-tools.jsx';
import './proto/screen-project-wizard.jsx';
import './proto/screen-customization.jsx';
import './proto/screen-customers.jsx';
import './proto/screen-networkglue.jsx';
import './proto/screen-assets-v2.jsx';

/* Survey Scan → Survey Cloud (office review) */
import './proto/sitescan-data.jsx';
import './proto/sitescan-plan.jsx';
import './proto/surveyscan-data.jsx';
import './proto/screen-survey-cloud.jsx';

/* Tweaks */
import './proto/tweaks-panel.jsx';

/* Bid Board + guided Bid Room (lead engine, replaces Pipeline/CRM) */
import './proto/screen-bidboard-pre.jsx';
import './proto/sw/sw-data.jsx';
import './proto/sw/sw-ui.jsx';
import './proto/sw/sw-bidroom-data.jsx';
import './proto/sw/sw-bidroom-docs.jsx';
import './proto/sw/sw-bidroom-steps.jsx';
import './proto/sw/sw-bidroom.jsx';
import './proto/sw/sw-bidboard.jsx';
import './proto/sw/sw-bidroom-v2.jsx';
import './proto/sw/sw-blueprint.jsx';
import './proto/sw/sw-isoreplay.jsx';
import './proto/sw/sw-wargames.jsx';
import './proto/sw/sw-review.jsx';
import './proto/sw/sw-bidroom-v3.jsx';
import './proto/screen-bidboard.jsx';
import './proto/screen-auth.jsx';
import './proto/shared-invoicing.jsx';
import './proto/screen-estimates-invoices.jsx';
import './proto/screen-invoice-builder.jsx';
import './proto/screen-fleet.jsx';
import './proto/screen-fleet-share.jsx';
import './proto/screen-outbox.jsx';
import './proto/screen-secret-weapon.jsx';
