# Platform connection cleanup

Updated the client store onboarding so each e-commerce platform uses platform-specific connection names instead of generic/random API fields.

- **YouCan**: removed manual API Base URL / token / test-endpoint fields. The UI now explains that YouCan must be connected through a YouCan App/Client authorization flow and remains Not verified until that developer integration exists.
- **Shopify**: uses **Admin API access token** and **Admin API version**. Store URL remains the common Store URL field. Connection test builds the Admin API shop endpoint server-side.
- **WooCommerce**: uses **REST API Consumer Key** and **REST API Consumer Secret**.
- **PrestaShop**: uses **Webservice Key**.

No platform is marked Connected without a real provider request.
