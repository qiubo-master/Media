import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { accountDailyMetrics, accounts, ips } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile] = await db.select({ id: ips.id }).from(ips).where(eq(ips.ownerId, user.id)).limit(1);
  let stats = { followers: 0, views: 0, leads: 0, revenue: 0 };
  if (profile) {
    const [[audience], [performance]] = await Promise.all([
      db.select({ followers: sql<number>`coalesce(sum(${accounts.followers}), 0)` }).from(accounts).where(eq(accounts.ipId, profile.id)),
      db.select({ views: sql<number>`coalesce(sum(${accountDailyMetrics.views}), 0)`, leads: sql<number>`coalesce(sum(${accountDailyMetrics.leads}), 0)`, revenue: sql<number>`coalesce(sum(${accountDailyMetrics.revenue}), 0)` })
        .from(accountDailyMetrics).innerJoin(accounts, eq(accountDailyMetrics.accountId, accounts.id)).where(sql`${accounts.ipId} = ${profile.id} and ${accountDailyMetrics.metricDate} >= current_date - interval '29 days'`),
    ]);
    stats = { followers: Number(audience?.followers || 0), views: Number(performance?.views || 0), leads: Number(performance?.leads || 0), revenue: Number(performance?.revenue || 0) };
  }
  return <DashboardClient userName={user.name} isAdmin={user.role === "admin"} stats={stats} />;
}
