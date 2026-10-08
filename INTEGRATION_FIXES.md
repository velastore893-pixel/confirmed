# Store & Delivery connection fixes

The previous connection test was a placeholder: it validated fields and then returned `success: true` without calling any external provider.

This version changes that behavior:

- Store connection tests now perform a real HTTP request.
- WooCommerce and PrestaShop use real authenticated probe requests.
- Shopify requires an explicit API test path so an obsolete hard-coded API version is not silently used.
- YouCan requires the real API base URL/token/test endpoint from the merchant's YouCan API setup. CODFlow will not show "Connected" unless that endpoint responds successfully.
- Delivery companies are now configured by Admin with API Base URL, Test Path and authentication mode.
- Client onboarding asks for provider-specific delivery credentials instead of always asking for a generic API key.
- Delivery connection tests now call the configured delivery API and only mark the store connected after a successful response.
- Connection failures return useful status/error details instead of fake success.
- Testing now targets the exact store card selected (the previous UI always tested `stores[0]`).

## Important

This project does not contain official credentials or provider-specific API documentation. To make YouCan or a Moroccan delivery provider actually connect, use the exact API endpoint/authentication values supplied by that provider. This version intentionally refuses to fake a successful connection when those values are not configured.
