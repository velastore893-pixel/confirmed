# Production hardening applied

- Session cookie is secure only in production so preview/local HTTP no longer immediately loses the login cookie.
- Production refuses a weak/missing JWT secret.
- Store platform/delivery credentials are encrypted at rest with AES-256-GCM through `CREDENTIALS_ENCRYPTION_KEY` (fallback: `JWT_SECRET`). Existing plaintext rows remain readable for migration compatibility.
- Delivery-company global credentials are encrypted before storage.
- Order creation now enforces tenant/store ownership for Client and Employee roles.
- New orders use the distribution engine with the required specificity order: Store+City > City > Region > Store > Global, percentage-weighted load balancing and `maxDailyOrders` capacity.
- SIFT remains the real delivery integration already configured. Other providers stay disabled until official API documentation is available.

## Before production
Set strong values for `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, and `SIFT_WEBHOOK_SECRET`. Existing plaintext credentials should be re-saved once after deployment so they are rewritten encrypted.

## Google Sheets auto-import and billing

Additional hardening completed:
- Google Sheets row-to-order import with header auto-detection and duplicate prevention.
- Protected scheduler endpoint: `GET /api/sync/google-sheets` using `CRON_SECRET`.
- Manual per-store sync endpoint: `POST /api/stores/{storeId}/sync-orders`.
- Transactional invoice generation using historical per-order client price and employee commission.
- Separate commission invoices per employee when a client billing period contains orders handled by multiple employees.

Before production on an existing database, run:
`migrations/20261007_google_sheets_billing.sql`

Configure a scheduler to call the Google Sheets sync endpoint at the interval appropriate for your operation.
