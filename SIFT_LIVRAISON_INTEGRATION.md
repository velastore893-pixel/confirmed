# SIFT Livraison integration

Implemented from the SIFT API documentation screenshots supplied for this project.

## Connection test
- GET `https://app.siftlivraison.com/api/client/get/list-status`
- Header: `Special-Token: <client token>`

## Create shipment after confirmation
- POST `https://app.siftlivraison.com/api/client/post/store-commande`
- Header: `Special-Token: <client token>`
- Required payload mapped by CODFlow: `code_suivi`, `destinataire`, `telephone`, `adresse`, `prix`, `ville`, `marchandise`, `qte`, `peut_ouvrir`, `change`.
- CODFlow keeps the order as `confirmed` when SIFT rejects the request; it moves to `sent_to_delivery` only after a successful provider response.

## Real-time delivery status
CODFlow exposes:
`POST /api/webhooks/sift?secret=<SIFT_WEBHOOK_SECRET>`

Configure a long random `SIFT_WEBHOOK_SECRET` in production, then send the full URL to SIFT support on WhatsApp as requested by their documentation.

Webhook payload fields accepted: `reference`, `status`, `reporter`, `comment`.

Confirmed status mappings from the supplied docs:
- `Nouvelle` -> `sent_to_delivery`
- `Livrée` -> `delivered`

Unknown SIFT statuses are preserved in the activity log and do not silently change CODFlow's internal status. Add extra mappings in the SIFT delivery-company `config.statusMap` after confirming the exact status titles returned by `list-status`.

## Last-status endpoint
The supplied docs show `GET https://app.siftlivraison.com/api/client/get/last-status` with a `code_suivi` parameter. The screenshot does not specify the exact transport form for that GET parameter, so this build does not guess whether SIFT expects query-string or another format. Webhooks are used for automatic updates until that detail is confirmed.
