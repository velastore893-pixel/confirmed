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
  // Generate a strong 16-char password
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) pw += chars[bytes[i] % chars.length];
  return pw;
}

export async function seed() {
  console.log("Seeding database...");

  // Check if admin exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@codflow.ma")).limit(1);
  if (existingAdmin.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  // Generate strong temporary passwords
  const adminTempPw = process.env.ADMIN_INITIAL_PASSWORD || generateTempPassword();
  const emp1TempPw = generateTempPassword();
  const emp2TempPw = generateTempPassword();
  const clientTempPw = generateTempPassword();

  // Create admin
  const adminHash = await hashPassword(adminTempPw);
  const [admin] = await db.insert(users).values({
    email: "admin@codflow.ma", passwordHash: adminHash,
    firstName: "Admin", lastName: "System", role: "admin", phone: "+212600000000", locale: "ar",
  }).returning();

  console.log(`\n=== INITIAL ACCOUNTS (save these!) ===`);
  console.log(`Admin:    admin@codflow.ma / ${adminTempPw}`);

  // Create employees
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

  // Create clients
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

  // E-commerce platforms
  const [platformShopify] = await db.insert(ecommercePlatforms).values({ name: "Shopify", slug: "shopify", icon: "🛒" }).returning();
  const [platformYoucan] = await db.insert(ecommercePlatforms).values({ name: "YouCan", slug: "youcan", icon: "🛍️" }).returning();
  const [platformWoo] = await db.insert(ecommercePlatforms).values({ name: "WooCommerce", slug: "woocommerce", icon: "🏪" }).returning();
  const [platformPresta] = await db.insert(ecommercePlatforms).values({ name: "PrestaShop", slug: "prestashop", icon: "🏬" }).returning();
  await db.insert(ecommercePlatforms).values({ name: "Google Sheets", slug: "google_sheets", icon: "📊" }).returning();
