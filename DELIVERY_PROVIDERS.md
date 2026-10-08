# Delivery providers in CODFlow

## SIFT Livraison — preserved and ready
The existing SIFT Livraison integration is intentionally preserved as the verified provider integration.

- Base URL: `https://app.siftlivraison.com`
- Test/status list: `GET /api/client/get/list-status`
- Authentication: `Special-Token`
- Create order: `POST /api/client/post/store-commande`
- Real-time status updates: SIFT webhook endpoint already present in CODFlow
- Existing order dispatch logic remains active

## Other providers
The project now includes these providers in the delivery catalog:

- Amana
- Jibli
- Colis Privé
- Ozon Express
- Cathedis
- Speedaf

These are **not marked as API-ready** until official API documentation/credentials are supplied. This is deliberate: CODFlow must not invent endpoints, tokens, or claim a connection succeeded when no real provider API call occurred.

For each provider, activation should follow this checklist:

1. Obtain official API documentation.
2. Configure real API Base URL and test endpoint.
3. Configure the exact authentication method and credential fields.
4. Implement/create shipment mapping.
5. Implement webhook or status polling.
6. Map provider statuses to CODFlow statuses.
7. Only then set `hasApi=true`.

This keeps the SIFT integration working while making the rest of the provider architecture safe to extend.
