import { db } from "@/db";
import { distributionRules, employees, orders, users } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

function specificity(rule: typeof distributionRules.$inferSelect, storeId: string, city?: string | null, region?: string | null) {
  const cityMatch = !!rule.city && !!city && rule.city.trim().toLowerCase() === city.trim().toLowerCase();
  const regionMatch = !!rule.region && !!region && rule.region.trim().toLowerCase() === region.trim().toLowerCase();
  const storeMatch = !!rule.storeId && rule.storeId === storeId;

  if (rule.storeId && !storeMatch) return -1;
  if (rule.city && !cityMatch) return -1;
  if (rule.region && !regionMatch) return -1;

  // Required business priority: Store+City > City > Region > Store > Global.
  if (storeMatch && cityMatch) return 500;
  if (cityMatch) return 400;
  if (regionMatch) return 300;
  if (storeMatch) return 200;
  return 100;
}

export async function chooseEmployeeForOrder(input: { storeId: string; city?: string | null; region?: string | null }) {
  const rules = await db.select({
    id: distributionRules.id,
    employeeId: distributionRules.employeeId,
    storeId: distributionRules.storeId,
    city: distributionRules.city,
    region: distributionRules.region,
    percentage: distributionRules.percentage,
    priority: distributionRules.priority,
    isActive: distributionRules.isActive,
    maxDailyOrders: employees.maxDailyOrders,
    employeeUserActive: users.isActive,
  }).from(distributionRules)
    .innerJoin(employees, eq(distributionRules.employeeId, employees.id))
    .innerJoin(users, eq(employees.userId, users.id))
    .where(eq(distributionRules.isActive, true));

  const ranked = rules
    .map((r) => ({ ...r, specificity: specificity(r as never, input.storeId, input.city, input.region) }))
    .filter((r) => r.employeeUserActive && r.specificity >= 0);
  if (!ranked.length) return null;

  const bestSpecificity = Math.max(...ranked.map((r) => r.specificity));
  const bestPriority = Math.min(...ranked.filter((r) => r.specificity === bestSpecificity).map((r) => r.priority));
  const candidates = ranked.filter((r) => r.specificity === bestSpecificity && r.priority === bestPriority && r.percentage > 0);
  if (!candidates.length) return null;

  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const loads = await Promise.all(candidates.map(async (candidate) => {
    const assignedToday = await db.select({ id: orders.id }).from(orders).where(and(
      eq(orders.assignedEmployeeId, candidate.employeeId),
      gte(orders.createdAt, start),
      lt(orders.createdAt, end),
    ));
    return { ...candidate, assigned: assignedToday.length };
  }));

  const available = loads.filter((x) => !x.maxDailyOrders || x.assigned < x.maxDailyOrders);
  if (!available.length) return null;

  // Lowest normalized load wins; percentage controls the long-run share.
  available.sort((a, b) => (a.assigned / a.percentage) - (b.assigned / b.percentage) || a.assigned - b.assigned);
  return available[0].employeeId;
}
