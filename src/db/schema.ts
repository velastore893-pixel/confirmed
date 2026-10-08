import {
  pgTable, text, varchar, integer, decimal, boolean, timestamp,
  jsonb, uuid, index, uniqueIndex, pgEnum, serial, bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "employee", "client"]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending", "approved", "rejected",
]);
export const storeStatusEnum = pgEnum("store_status", ["pending", "active", "suspended"]);
export const orderStatusEnum = pgEnum("order_status", [
  "new", "assigned", "calling", "confirmed", "sent_to_delivery",
  "in_transit", "out_for_delivery", "delivered", "returned",
  "no_answer", "callback", "cancelled", "delayed",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", "created", "pending_review", "approved", "sent_to_client", "paid", "overdue", "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "verified", "rejected"]);
export const callbackStatusEnum = pgEnum("callback_status", ["pending", "completed", "missed", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "order_new", "order_assigned", "order_confirmed", "order_delivered", "order_returned",
  "store_pending", "store_activated", "store_suspended",
  "invoice_created", "invoice_approved", "invoice_sent", "invoice_paid", "invoice_overdue",
  "payment_received", "payment_verified",
  "employee_suspended", "employee_reactivated",
  "callback_scheduled", "callback_due",
  "integration_error", "system_alert",
]);
export const ecommercePlatformEnum = pgEnum("ecommerce_platform", ["shopify", "youcan", "woocommerce", "prestashop", "google_sheets"]);

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: roleEnum("role").notNull(),
  approvalStatus: approvalStatusEnum("approval_status").notNull().default("approved"),
  isActive: boolean("is_active").notNull().default(true),
  locale: varchar("locale", { length: 5 }).default("ar"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_users_role").on(t.role),
  index("idx_users_active").on(t.isActive),
  index("idx_users_approval_status").on(t.approvalStatus),
]);

// ─── Sessions ────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sessions_user").on(t.userId),
  index("idx_sessions_token").on(t.token),
]);

// ─── Clients (extra profile for client role) ─────────────────────────────────
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  companyName: varchar("company_name", { length: 200 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  taxId: varchar("tax_id", { length: 100 }),
  website: text("website"),
  defaultPricePerOrder: decimal("default_price_per_order", { precision: 10, scale: 2 }).default("10.00"),
  bankName: varchar("bank_name", { length: 200 }),
  bankAccount: varchar("bank_account", { length: 200 }),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Employees (extra profile for employee role) ─────────────────────────────
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  commissionPerOrder: decimal("commission_per_order", { precision: 10, scale: 2 }).default("3.00"),
  maxDailyOrders: integer("max_daily_orders"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── E-commerce Platforms ────────────────────────────────────────────────────
export const ecommercePlatforms = pgTable("ecommerce_platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: ecommercePlatformEnum("slug").notNull(),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  configSchema: jsonb("config_schema"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Delivery Companies ─────────────────────────────────────────────────────
export const deliveryCompanies = pgTable("delivery_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  isActive: boolean("is_active").notNull().default(true),
  hasApi: boolean("has_api").notNull().default(false),
  apiBaseUrl: text("api_base_url"),
  codAvailable: boolean("cod_available").notNull().default(true),
  cities: jsonb("cities").default([]),
  regions: jsonb("regions").default([]),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deliveryCredentials = pgTable("delivery_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliveryCompanyId: uuid("delivery_company_id").notNull().references(() => deliveryCompanies.id),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  isEncrypted: boolean("is_encrypted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_delivery_creds_company").on(t.deliveryCompanyId),
]);

// ─── Stores ──────────────────────────────────────────────────────────────────
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  assignedEmployeeId: uuid("assigned_employee_id").references(() => employees.id),
  name: varchar("name", { length: 200 }).notNull(),
  platformId: uuid("platform_id").references(() => ecommercePlatforms.id),
  deliveryCompanyId: uuid("delivery_company_id").references(() => deliveryCompanies.id),
  status: storeStatusEnum("status").notNull().default("pending"),
  platformConfig: jsonb("platform_config").default({}),
  deliveryConfig: jsonb("delivery_config").default({}),
  pricePerOrder: decimal("price_per_order", { precision: 10, scale: 2 }),
  commissionPerOrder: decimal("commission_per_order", { precision: 10, scale: 2 }),
  url: text("url"),
  connectionStatus: varchar("connection_status", { length: 30 }).default("not_tested"),
  lastConnectionTestAt: timestamp("last_connection_test_at"),
  deliveryConnectionStatus: varchar("delivery_connection_status", { length: 30 }).default("not_tested"),
  lastDeliveryTestAt: timestamp("last_delivery_test_at"),
  platformCredentials: jsonb("platform_credentials").default({}),
  deliveryCredentials: jsonb("delivery_credentials").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_stores_client").on(t.clientId),
  index("idx_stores_status").on(t.status),
  index("idx_stores_employee").on(t.assignedEmployeeId),
]);

// ─── Customers ───────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_customers_client").on(t.clientId),
  index("idx_customers_phone").on(t.phone),
]);

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  storeId: uuid("store_id").notNull().references(() => stores.id),
  customerId: uuid("customer_id").references(() => customers.id),
  assignedEmployeeId: uuid("assigned_employee_id").references(() => employees.id),
  deliveryCompanyId: uuid("delivery_company_id").references(() => deliveryCompanies.id),
  status: orderStatusEnum("status").notNull().default("new"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  codAmount: decimal("cod_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 5 }).default("MAD"),
  customerName: varchar("customer_name", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 30 }),
  customerCity: varchar("customer_city", { length: 100 }),
  customerRegion: varchar("customer_region", { length: 100 }),
  customerAddress: text("customer_address"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  shipmentId: varchar("shipment_id", { length: 100 }),
  externalOrderId: varchar("external_order_id", { length: 100 }),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at"),
  deliveredAt: timestamp("delivered_at"),
  returnedAt: timestamp("returned_at"),
  priceAtOrder: decimal("price_at_order", { precision: 10, scale: 2 }),
  commissionAtOrder: decimal("commission_at_order", { precision: 10, scale: 2 }),
  isBilled: boolean("is_billed").notNull().default(false),
  billedInvoiceId: uuid("billed_invoice_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_orders_client").on(t.clientId),
  index("idx_orders_store").on(t.storeId),
  index("idx_orders_employee").on(t.assignedEmployeeId),
  index("idx_orders_status").on(t.status),
  index("idx_orders_delivery").on(t.deliveryCompanyId),
  index("idx_orders_created").on(t.createdAt),
  index("idx_orders_number").on(t.orderNumber),
  index("idx_orders_tracking").on(t.trackingNumber),
  uniqueIndex("uniq_orders_store_external").on(t.storeId, t.externalOrderId),
]);

// ─── Order Items ─────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  productName: varchar("product_name", { length: 300 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_order_items_order").on(t.orderId),
]);

// ─── Order Status History ────────────────────────────────────────────────────
export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  previousStatus: orderStatusEnum("previous_status"),
  newStatus: orderStatusEnum("new_status").notNull(),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id),
  reason: text("reason"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_status_history_order").on(t.orderId),
]);

// ─── Order Calls ─────────────────────────────────────────────────────────────
export const orderCalls = pgTable("order_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  callResult: varchar("call_result", { length: 50 }).notNull(),
  notes: text("notes"),
  calledAt: timestamp("called_at").notNull().defaultNow(),
}, (t) => [
  index("idx_calls_order").on(t.orderId),
]);

// ─── Callbacks ───────────────────────────────────────────────────────────────
export const callbacks = pgTable("callbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: callbackStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_callbacks_employee").on(t.employeeId),
  index("idx_callbacks_date").on(t.scheduledDate),
]);

// ─── Distribution Rules ─────────────────────────────────────────────────────
export const distributionRules = pgTable("distribution_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  storeId: uuid("store_id").references(() => stores.id),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  percentage: integer("percentage").notNull(),
  priority: integer("priority").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_dist_rules_employee").on(t.employeeId),
  index("idx_dist_rules_store").on(t.storeId),
  index("idx_dist_rules_active").on(t.isActive),
]);

// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // "client" or "commission"
  clientId: uuid("client_id").references(() => clients.id),
  employeeId: uuid("employee_id").references(() => employees.id),
  linkedInvoiceId: uuid("linked_invoice_id"), // links client<->commission invoices
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  orderCount: integer("order_count").notNull().default(0),
  pricePerOrder: decimal("price_per_order", { precision: 10, scale: 2 }).notNull().default("0.00"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0.00"),
  commissionPerOrder: decimal("commission_per_order", { precision: 10, scale: 2 }),
  commissionTotal: decimal("commission_total", { precision: 12, scale: 2 }),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  createdByEmployeeId: uuid("created_by_employee_id").references(() => employees.id),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_invoices_client").on(t.clientId),
  index("idx_invoices_employee").on(t.employeeId),
  index("idx_invoices_status").on(t.status),
  index("idx_invoices_type").on(t.type),
  index("idx_invoices_period").on(t.periodStart, t.periodEnd),
]);

// ─── Invoice Orders (links orders to invoices) ──────────────────────────────
export const invoiceOrders = pgTable("invoice_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  commission: decimal("commission", { precision: 12, scale: 2 }),
}, (t) => [
  index("idx_inv_orders_invoice").on(t.invoiceId),
  index("idx_inv_orders_order").on(t.orderId),
]);

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull().default("bank_transfer"),
  reference: varchar("reference", { length: 200 }),
  receiptPath: text("receipt_path"),
  proofPath: text("proof_path"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  verifiedByUserId: uuid("verified_by_user_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_payments_invoice").on(t.invoiceId),
  index("idx_payments_status").on(t.status),
]);

// ─── Notifications ───────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  isRead: boolean("is_read").notNull().default(false),
  relatedType: varchar("related_type", { length: 50 }),
  relatedId: uuid("related_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_notifications_user").on(t.userId),
  index("idx_notifications_read").on(t.isRead),
  index("idx_notifications_type").on(t.type),
]);

// ─── Activity Logs ───────────────────────────────────────────────────────────
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata").default({}),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_activity_user").on(t.userId),
  index("idx_activity_entity").on(t.entityType, t.entityId),
  index("idx_activity_created").on(t.createdAt),
]);

// ─── System Settings ────────────────────────────────────────────────────────
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  category: varchar("category", { length: 50 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_settings_key").on(t.key),
]);

// ─── Integration / API Logs ─────────────────────────────────────────────────
export const integrationLogs = pgTable("integration_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 100 }).notNull(),
  providerType: varchar("provider_type", { length: 50 }).notNull(), // "ecommerce" | "delivery"
  action: varchar("action", { length: 100 }).notNull(),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  statusCode: integer("status_code"),
  success: boolean("success").notNull().default(false),
  errorMessage: text("error_message"),
  orderId: uuid("order_id"),
  storeId: uuid("store_id"),
  deliveryCompanyId: uuid("delivery_company_id"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_integration_provider").on(t.provider),
  index("idx_integration_order").on(t.orderId),
]);

// ─── Relations ───────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, { fields: [users.id], references: [clients.userId] }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
  sessions: many(sessions),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  stores: many(stores),
  orders: many(orders),
  customers: many(customers),
  invoices: many(invoices),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  stores: many(stores),
  orders: many(orders),
  orderCalls: many(orderCalls),
  callbacks: many(callbacks),
  distributionRules: many(distributionRules),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  client: one(clients, { fields: [stores.clientId], references: [clients.id] }),
  assignedEmployee: one(employees, { fields: [stores.assignedEmployeeId], references: [employees.id] }),
  platform: one(ecommercePlatforms, { fields: [stores.platformId], references: [ecommercePlatforms.id] }),
  deliveryCompany: one(deliveryCompanies, { fields: [stores.deliveryCompanyId], references: [deliveryCompanies.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  assignedEmployee: one(employees, { fields: [orders.assignedEmployeeId], references: [employees.id] }),
  deliveryCompany: one(deliveryCompanies, { fields: [orders.deliveryCompanyId], references: [deliveryCompanies.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  calls: many(orderCalls),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  employee: one(employees, { fields: [invoices.employeeId], references: [employees.id] }),
  invoiceOrders: many(invoiceOrders),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));
