import { db } from "./index";
import {
  users, clients, employees, ecommercePlatforms, deliveryCompanies,
  stores, orders, orderItems, orderStatusHistory, customers,
  distributionRules, notifications, activityLogs, systemSettings,
} from "./schema";
import { hashPassword } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) pw += chars[bytes[i] % chars.length];
  return pw;
}

export async function seed() {
  console.log("Seeding database...");

  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@codflow.ma")).limit(1);
  if (existingAdmin.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  const adminTempPw = process.env.ADMIN_INITIAL_PASSWORD || generateTempPassword();
  const emp1TempPw = generateTempPassword();
  const emp2TempPw = generateTempPassword();
  const clientTempPw = generateTempPassword();

  const adminHash = await hashPassword(adminTempPw);
  const [admin] = await db.insert(users).values({
    email: "admin@codflow.ma", passwordHash: adminHash,
    firstName: "Admin", lastName: "System", role: "admin", phone: "+212600000000", locale: "ar",
  }).returning();

  console.log(`\n=== INITIAL ACCOUNTS (save these!) ===`);
  console.log(`Admin:    admin@codflow.ma / ${adminTempPw}`);

  const emp1Hash = await hashPassword(emp1TempPw);
  const [emp1User] = await db.insert(users).values({
    email: "yusuf@codflow.ma", passwordHash: emp1Hash,
    firstName: "Yusuf", lastName: "Alami", role: "employee", phone: "+212611111111", locale: "fr",
  }).returning();
  const [emp1] = await db.insert(employees).values({
    userId: emp1User.id, commissionPerOrder: "3.00", maxDailyOrders: 50,
  }).returning();
  console.log(`Employee: yusuf@codflow.ma / ${emp1TempPw}`);

  const emp2Hash = await hashPassword(emp2TempPw);
  const [emp2User] = await db.insert(users).values({
    email: "hamza@codflow.ma", passwordHash: emp2Hash,
    firstName: "Hamza", lastName: "Benani", role: "employee", phone: "+212622222222", locale: "ar",
  }).returning();
  const [emp2] = await db.insert(employees).values({
    userId: emp2User.id, commissionPerOrder: "3.50", maxDailyOrders: 40,
  }).returning();
  console.log(`Employee: hamza@codflow.ma / ${emp2TempPw}`);

  const clientHash = await hashPassword(clientTempPw);
  const [client1User] = await db.insert(users).values({
    email: "mohammed@nukhba.ma", passwordHash: clientHash,
    firstName: "Mohammed", lastName: "Tazi", role: "client", phone: "+212633333333", locale: "ar",
  }).returning();
  const [client1] = await db.insert(clients).values({
    userId: client1User.id, companyName: "NUKHBA", city: "Marrakech", region: "Marrakech-Safi",
    defaultPricePerOrder: "10.00", address: "123 Rue Marrakech",
  }).returning();
  console.log(`Client:   mohammed@nukhba.ma / ${clientTempPw}`);

  const [client2User] = await db.insert(users).values({
    email: "sara@stylemaroc.ma", passwordHash: clientHash,
    firstName: "Sara", lastName: "Idrissi", role: "client", phone: "+212644444444", locale: "fr",
  }).returning();
  const [client2] = await db.insert(clients).values({
    userId: client2User.id, companyName: "Style Maroc", city: "Casablanca", region: "Casablanca-Settat",
    defaultPricePerOrder: "12.00", address: "456 Blvd Casablanca",
  }).returning();
  console.log(`Client:   sara@stylemaroc.ma / ${clientTempPw}`);
  console.log(`====================================\n`);

  const [platformShopify] = await db.insert(ecommercePlatforms).values({ name: "Shopify", slug: "shopify", icon: "🛒" }).returning();
  const [platformYoucan] = await db.insert(ecommercePlatforms).values({ name: "YouCan", slug: "youcan", icon: "🛍️" }).returning();
  const [platformWoo] = await db.insert(ecommercePlatforms).values({ name: "WooCommerce", slug: "woocommerce", icon: "🏪" }).returning();
  const [platformPresta] = await db.insert(ecommercePlatforms).values({ name: "PrestaShop", slug: "prestashop", icon: "🏬" }).returning();
  await db.insert(ecommercePlatforms).values({ name: "Google Sheets", slug: "google_sheets", icon: "📊" }).returning();

  const [del1] = await db.insert(deliveryCompanies).values({
    name: "Amana", slug: "amana", isActive: true, hasApi: false,
    codAvailable: true, cities: [], regions: [],
    config: { integrationState: "needs_documentation", notes: "Official API documentation required before enabling automatic dispatch." },
  }).returning();
  const [del2] = await db.insert(deliveryCompanies).values({
    name: "Jibli", slug: "jibli", isActive: true, hasApi: false,
    codAvailable: true, cities: [], regions: [],
    config: { integrationState: "needs_documentation", notes: "Official API documentation required before enabling automatic dispatch." },
  }).returning();
  await db.insert(deliveryCompanies).values([
    { name: "Colis Privé", slug: "colis-prive", isActive: true, hasApi: false, codAvailable: true, cities: [], regions: [], config: { integrationState: "needs_documentation" } },
    { name: "Ozon Express", slug: "ozon-express", isActive: true, hasApi: false, codAvailable: true, cities: [], regions: [], config: { integrationState: "needs_documentation" } },
    { name: "Cathedis", slug: "cathedis", isActive: true, hasApi: false, codAvailable: true, cities: [], regions: [], config: { integrationState: "needs_documentation" } },
    { name: "Speedaf", slug: "speedaf", isActive: true, hasApi: false, codAvailable: true, cities: [], regions: [], config: { integrationState: "needs_documentation" } },
  ]);
  await db.insert(deliveryCompanies).values({
    name: "SIFT Livraison", slug: "sift-livraison", isActive: true, hasApi: true,
    apiBaseUrl: "https://app.siftlivraison.com", codAvailable: true,
    cities: [], regions: [],
    config: {
      integrationState: "ready",
      authType: "custom",
      authHeader: "Special-Token",
      authPrefix: "",
      testPath: "/api/client/get/list-status",
      testMethod: "GET",
      createOrderPath: "/api/client/post/store-commande",
      peutOuvrirDefault: true,
      changeDefault: false,
      statusMap: { "Nouvelle": "sent_to_delivery", "Livrée": "delivered" },
    },
  }).returning();

  const [store1] = await db.insert(stores).values({
    clientId: client1.id, assignedEmployeeId: emp1.id, name: "NUKHBA Online",
    platformId: platformShopify.id, deliveryCompanyId: del1.id,
    status: "active", pricePerOrder: "10.00", commissionPerOrder: "3.00",
    url: "https://nukhba.myshopify.com",
  }).returning();
  const [store2] = await db.insert(stores).values({
    clientId: client2.id, assignedEmployeeId: emp2.id, name: "Style Maroc Store",
    platformId: platformYoucan.id, deliveryCompanyId: del2.id,
    status: "active", pricePerOrder: "12.00", commissionPerOrder: "3.50",
    url: "https://stylemaroc.youcan.shop",
  }).returning();
  await db.insert(stores).values({
    clientId: client1.id, name: "NUKHBA PrestaShop",
    platformId: platformPresta.id, deliveryCompanyId: del1.id,
    status: "pending", url: "https://nukhba.ma",
  });

  const customersData = [
    { clientId: client1.id, name: "Ahmed Bennani", phone: "+212655111111", city: "Marrakech", region: "Marrakech-Safi", address: "78 Rue Atlas" },
    { clientId: client1.id, name: "Fatima Zahra", phone: "+212655222222", city: "Casablanca", region: "Casablanca-Settat", address: "12 Rue Mohammed V" },
    { clientId: client1.id, name: "Karim Alami", phone: "+212655333333", city: "Rabat", region: "Rabat-Sale-Kenitra", address: "45 Ave Hassan II" },
    { clientId: client2.id, name: "Nadia Fassi", phone: "+212655444444", city: "Fes", region: "Fes-Meknes", address: "90 Derb Fes" },
    { clientId: client2.id, name: "Omar Tazi", phone: "+212655555555", city: "Tangier", region: "Tanger-Tetouan", address: "12 Rue de la Plage" },
  ];
  const insertedCustomers = await db.insert(customers).values(customersData).returning();

  const statuses = ["new", "assigned", "calling", "confirmed", "sent_to_delivery", "in_transit", "delivered", "returned", "no_answer", "callback", "cancelled"] as const;
  const products = [
    ["T-shirt Premium", "Sneakers Classic"], ["Dress Summer", "Sunglasses"], ["Jacket Winter", "Scarf Silk"],
    ["Pants Slim", "Hat Cotton"], ["Shirt Formal", "Belt Leather"],
  ];

  const orderData: Array<{
    orderNumber: string; clientId: string; storeId: string; customerId: string;
    assignedEmployeeId: string; deliveryCompanyId: string;
    status: typeof statuses[number]; amount: string; codAmount: string;
    customerName: string; customerPhone: string; customerCity: string; customerRegion: string; customerAddress: string;
    trackingNumber: string | null; confirmedAt: Date | null; deliveredAt: Date | null;
    priceAtOrder: string; commissionAtOrder: string;
  }> = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const c = i < 20 ? client1 : client2;
    const s = i < 20 ? store1 : store2;
    const emp = i < 20 ? emp1 : emp2;
    const del = i < 20 ? del1 : del2;
    const cust = i < 20 ? insertedCustomers[i % 3] : insertedCustomers[3 + (i % 2)];
    const status = statuses[i % statuses.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000);
    const amount = (Math.floor(Math.random() * 500) + 50).toFixed(2);

    const entry: typeof orderData[0] = {
      orderNumber: generateOrderNumber() + i,
      clientId: c.id, storeId: s.id, customerId: cust.id,
      assignedEmployeeId: emp.id, deliveryCompanyId: del.id,
      status, amount, codAmount: amount,
      customerName: cust.name, customerPhone: cust.phone || "",
      customerCity: cust.city || "", customerRegion: cust.region || "",
      customerAddress: cust.address || "",
      trackingNumber: status === "delivered" || status === "in_transit" || status === "returned" ? `TRK${1000 + i}` : null,
      confirmedAt: ["confirmed", "sent_to_delivery", "in_transit", "out_for_delivery", "delivered", "returned"].includes(status) ? new Date(createdAt.getTime() + 3600000) : null,
      deliveredAt: status === "delivered" ? new Date(createdAt.getTime() + 86400000) : null,
      priceAtOrder: c.id === client1.id ? "10.00" : "12.00",
      commissionAtOrder: emp.id === emp1.id ? "3.00" : "3.50",
    };
    orderData.push(entry);
  }

  const insertedOrders = await db.insert(orders).values(orderData).returning();

  const itemsData: Array<{ orderId: string; productName: string; quantity: number; unitPrice: string; totalPrice: string }> = [];
  for (const order of insertedOrders) {
    const prods = products[Math.floor(Math.random() * products.length)];
    for (const prod of prods) {
      const qty = Math.floor(Math.random() * 3) + 1;
      const price = (Math.floor(Math.random() * 150) + 30).toFixed(2);
      itemsData.push({ orderId: order.id, productName: prod, quantity: qty, unitPrice: price, totalPrice: (parseFloat(price) * qty).toFixed(2) });
    }
  }
  await db.insert(orderItems).values(itemsData);

  const historyData: Array<{ orderId: string; newStatus: typeof statuses[number]; previousStatus: typeof statuses[number] | null; changedByUserId: string; createdAt: Date }> = [];
  for (const order of insertedOrders) {
    historyData.push({ orderId: order.id, newStatus: "new" as typeof statuses[number], previousStatus: null, changedByUserId: admin.id, createdAt: new Date(order.createdAt || new Date()) });
    if (order.status !== "new") {
      historyData.push({ orderId: order.id, newStatus: "assigned" as typeof statuses[number], previousStatus: "new" as typeof statuses[number], changedByUserId: admin.id, createdAt: new Date((order.createdAt || new Date()).getTime() + 60000) });
    }
  }
  await db.insert(orderStatusHistory).values(historyData);

  await db.insert(distributionRules).values([
    { employeeId: emp1.id, storeId: store1.id, percentage: 60, priority: 1, isActive: true },
    { employeeId: emp2.id, storeId: store1.id, percentage: 40, priority: 1, isActive: true },
    { employeeId: emp1.id, city: "Marrakech", percentage: 30, priority: 2, isActive: true },
    { employeeId: emp2.id, city: "Casablanca", percentage: 70, priority: 2, isActive: true },
    { employeeId: emp1.id, percentage: 50, priority: 5, isActive: true },
    { employeeId: emp2.id, percentage: 50, priority: 5, isActive: true },
  ]);

  await db.insert(systemSettings).values([
    { key: "default_price_per_order", value: "10.00", category: "pricing" },
    { key: "default_commission_per_order", value: "3.00", category: "pricing" },
    { key: "delivery_retry_count", value: "3", category: "delivery" },
    { key: "system_name", value: "CODFlow", category: "identity" },
    { key: "primary_color", value: "#2563eb", category: "identity" },
    { key: "secondary_color", value: "#7c3aed", category: "identity" },
    { key: "accent_color", value: "#0891b2", category: "identity" },
    { key: "bank_name", value: "Attijariwafa Bank", category: "finance" },
    { key: "bank_account", value: "MA123 4567 8901 2345 6789 0123", category: "finance" },
    { key: "bank_rib", value: "011 780 0001 2345 6789 0123 45", category: "finance" },
  ]);

  await db.insert(notifications).values([
    { userId: admin.id, type: "store_pending", title: "New store pending activation", body: "NUKHBA PrestaShop requires activation", isRead: false, relatedType: "store" },
    { userId: admin.id, type: "order_new", title: "New orders received", body: "5 new orders from NUKHBA", isRead: false, relatedType: "order" },
    { userId: emp1User.id, type: "order_assigned", title: "New orders assigned", body: "You have 3 new orders to handle", isRead: false, relatedType: "order" },
    { userId: client1User.id, type: "store_activated", title: "Store activated", body: "NUKHBA Online is now active", isRead: true, relatedType: "store" },
  ]);

  await db.insert(activityLogs).values([
    { userId: admin.id, action: "system.seeded", entityType: "system", newValue: { message: "Database seeded" } },
    { userId: admin.id, action: "store.activated", entityType: "store", entityId: store1.id, newValue: { status: "active" } },
    { userId: admin.id, action: "store.activated", entityType: "store", entityId: store2.id, newValue: { status: "active" } },
  ]);

  console.log("Database seeded successfully!");
}

seed()
  .then(() => {
    console.log("Seed completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

