import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import DashboardClient from "./dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { accounts, contents, ips, metrics } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const [profile] = await db.select({ id: ips.id, name: ips.name }).from(ips).where(eq(ips.ownerId, user.id)).limit(1);
  if (!profile) return <DashboardClient userName={user.name} ipName={`${user.name}的IP`} isAdmin={user.role === "admin"} />;
  const [[audience], [performance], trendRows, accountRows, topRows] = await Promise.all([
    db.select({ followers: sql<number>`coalesce(sum(${accounts.followers}),0)` }).from(accounts).where(eq(accounts.ipId, profile.id)),
    db.select({ views: sql<number>`coalesce(sum(${metrics.views}),0)`, leads: sql<number>`coalesce(sum(${metrics.leads}),0)`, revenue: sql<number>`coalesce(sum(${metrics.revenue}),0)` }).from(metrics).innerJoin(contents, eq(metrics.contentId, contents.id)).innerJoin(accounts, eq(contents.accountId, accounts.id)).where(sql`${accounts.ipId}=${profile.id} and ${metrics.metricDate} >= current_date - interval '29 days'`),
    db.execute(sql`select m.metric_date as date, coalesce(sum(m.views),0)::int as views, coalesce(sum(m.likes),0)::int as likes, coalesce(sum(m.saves),0)::int as saves, coalesce(sum(m.shares),0)::int as shares, coalesce(sum(m.follower_delta),0)::int as follower_delta from metrics m join contents c on c.id=m.content_id join accounts a on a.id=c.account_id where a.ip_id=${profile.id} and m.metric_date >= current_date - interval '29 days' group by m.metric_date order by m.metric_date`),
    db.execute(sql`select a.id, coalesce(a.display_name,a.handle) as name, a.platform, a.followers, coalesce(sum(m.views),0)::int as views, coalesce(sum(m.likes),0)::int as likes, coalesce(sum(m.saves),0)::int as saves, coalesce(sum(m.shares),0)::int as shares, coalesce(sum(m.follower_delta),0)::int as follower_delta from accounts a left join contents c on c.account_id=a.id left join metrics m on m.content_id=c.id and m.metric_date >= current_date - interval '29 days' where a.ip_id=${profile.id} group by a.id order by views desc`),
    db.execute(sql`select c.id,c.title,a.platform,coalesce(sum(m.views),0)::int as views,coalesce(sum(m.likes),0)::int as likes,coalesce(sum(m.saves),0)::int as saves,coalesce(sum(m.shares),0)::int as shares,coalesce(sum(m.follower_delta),0)::int as follower_delta,coalesce(sum(m.revenue),0)::numeric as revenue from contents c join accounts a on a.id=c.account_id left join metrics m on m.content_id=c.id where a.ip_id=${profile.id} group by c.id,a.platform order by views desc limit 8`),
  ]);
  const trends = Array.from(trendRows).map((row) => ({ date: String(row.date), views: Number(row.views), likes: Number(row.likes), saves: Number(row.saves), shares: Number(row.shares), followerDelta: Number(row.follower_delta) }));
  const accountTrends = Array.from(accountRows).map((row) => ({ id: String(row.id), name: String(row.name), platform: String(row.platform), followers: Number(row.followers), views: Number(row.views), likes: Number(row.likes), saves: Number(row.saves), shares: Number(row.shares), followerDelta: Number(row.follower_delta) }));
  const topContents = Array.from(topRows).map((row) => ({ id: String(row.id), title: String(row.title), platform: String(row.platform), views: Number(row.views), likes: Number(row.likes), saves: Number(row.saves), shares: Number(row.shares), followerDelta: Number(row.follower_delta), revenue: Number(row.revenue) }));
  return <DashboardClient userName={user.name} ipName={profile.name} isAdmin={user.role === "admin"} stats={{ followers: Number(audience?.followers || 0), views: Number(performance?.views || 0), leads: Number(performance?.leads || 0), revenue: Number(performance?.revenue || 0) }} trends={trends} accountTrends={accountTrends} topContents={topContents} />;
}
