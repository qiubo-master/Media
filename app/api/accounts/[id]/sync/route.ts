import { and, eq, ne, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, contents, ips, metrics, platformConnections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { decryptCredential } from "@/lib/credentials";
import { fetchPlatformWorks } from "@/lib/platform-sync";
import { seeOther } from "@/lib/request";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  const [owned] = await db.select({ account: accounts, connection: platformConnections }).from(accounts).innerJoin(ips, eq(accounts.ipId, ips.id)).leftJoin(platformConnections, eq(platformConnections.accountId, accounts.id)).where(and(eq(accounts.id, id), eq(ips.ownerId, user.id))).limit(1);
  if (!owned) return NextResponse.json({ error: "无权访问" }, { status: 403 });
  if (!owned.connection?.encryptedCredential) return seeOther(`/accounts/${id}?error=connection`);
  try {
    const result = await fetchPlatformWorks({ platform: owned.account.platform, handle: owned.account.handle, credential: decryptCredential(owned.connection.encryptedCredential) });
    const metricDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    await db.transaction(async (tx) => {
      for (const work of result.works) {
        const [content] = await tx.insert(contents).values({ ipId: owned.account.ipId, accountId: id, platformContentId: work.id, title: work.title, body: work.body, status: "published", format: work.format || "短视频", publishedUrl: work.url, publishedAt: new Date(work.publishedAt) })
          .onConflictDoUpdate({ target: [contents.accountId, contents.platformContentId], set: { title: work.title, body: work.body, format: work.format || "短视频", publishedUrl: work.url, publishedAt: new Date(work.publishedAt), updatedAt: new Date() } }).returning({ id: contents.id });
        const [prior] = await tx.select({ views: sql<number>`coalesce(sum(${metrics.views}),0)`, impressions: sql<number>`coalesce(sum(${metrics.impressions}),0)`, likes: sql<number>`coalesce(sum(${metrics.likes}),0)`, comments: sql<number>`coalesce(sum(${metrics.comments}),0)`, shares: sql<number>`coalesce(sum(${metrics.shares}),0)`, saves: sql<number>`coalesce(sum(${metrics.saves}),0)` }).from(metrics).where(and(eq(metrics.contentId, content.id), ne(metrics.metricDate, metricDate)));
        const delta = { views: Math.max(0, (work.views || 0) - Number(prior.views)), impressions: Math.max(0, (work.impressions || 0) - Number(prior.impressions)), likes: Math.max(0, (work.likes || 0) - Number(prior.likes)), comments: Math.max(0, (work.comments || 0) - Number(prior.comments)), shares: Math.max(0, (work.shares || 0) - Number(prior.shares)), saves: Math.max(0, (work.saves || 0) - Number(prior.saves)) };
        await tx.insert(metrics).values({ contentId: content.id, metricDate, ...delta, engagements: delta.likes + delta.comments + delta.shares + delta.saves }).onConflictDoUpdate({ target: [metrics.contentId, metrics.metricDate], set: { ...delta, engagements: delta.likes + delta.comments + delta.shares + delta.saves, capturedAt: new Date() } });
      }
      await tx.update(accounts).set({ ...(result.followers === undefined ? {} : { followers: result.followers }), lastSyncedAt: new Date(), status: "ready", updatedAt: new Date() }).where(eq(accounts.id, id));
      await tx.update(platformConnections).set({ status: "ready", lastError: null, updatedAt: new Date() }).where(eq(platformConnections.accountId, id));
    });
    return seeOther(`/accounts/${id}?ok=sync`);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "同步失败";
    await db.update(platformConnections).set({ status: "error", lastError: message, updatedAt: new Date() }).where(eq(platformConnections.accountId, id));
    console.error("Platform sync failed", message); return seeOther(`/accounts/${id}?error=sync`);
  }
}
