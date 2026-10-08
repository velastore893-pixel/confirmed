# Google Sheets order synchronization

Google Sheets can be used as an order source without asking the merchant for a Google API key.

## Client flow
1. Choose **Google Sheets** as the platform.
2. Paste the Google Sheet URL.
3. The sheet must be readable by the server (for link-only mode: **Anyone with the link → Viewer**).
4. Test the platform connection.
5. After the store is active, orders can be imported manually or by the protected sync endpoint.

## Automatic import
Protected endpoint:

```text
GET /api/sync/google-sheets
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` in production and configure your deployment scheduler/cron service to call that URL at your desired interval. The endpoint synchronizes all active, connected Google Sheets stores.

Manual per-store sync (authenticated):

```text
POST /api/stores/{storeId}/sync-orders
```

## Duplicate prevention
Each imported row gets a stable `externalOrderId`. If the sheet contains an order ID/number column, that value is preferred. Otherwise CODFlow hashes the row content. A database unique index on `(store_id, external_order_id)` prevents duplicate imports even when two sync jobs overlap.

## Supported columns
CODFlow auto-detects common Arabic/French/English headers for:
- order ID / order number
- customer name
- phone
- city / region
- address
- COD amount / total / price
- product
- quantity
- SKU/reference
- notes

For custom headers, store a mapping in `stores.platform_config.sheetMapping`, for example:

```json
{
  "sheetMapping": {
    "externalOrderId": "N° Commande",
    "customerName": "Nom complet",
    "customerPhone": "Téléphone",
    "customerCity": "Ville",
    "customerAddress": "Adresse",
    "amount": "Montant COD",
    "productName": "Produit",
    "quantity": "Qté"
  }
}
```

## Database migration
Run `migrations/20261007_google_sheets_billing.sql` on an existing database before enabling sync.
