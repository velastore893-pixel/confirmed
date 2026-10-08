-- Prevent the same external platform order from being imported twice for one store.
-- PostgreSQL permits multiple NULL external_order_id values, so manual orders remain unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_orders_store_external
  ON orders (store_id, external_order_id);

-- Required only for databases created before Google Sheets support was added.
ALTER TYPE ecommerce_platform ADD VALUE IF NOT EXISTS 'google_sheets';
