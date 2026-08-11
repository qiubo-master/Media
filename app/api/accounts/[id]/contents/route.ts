import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, contents, ips, metrics } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { seeOther } from "@/lib/request";

const numberValue = (data: FormData, key: string, allowNegative = false) => { const parsed = Number.parseInt(String(data.get(key) || "0"), 10) || 0; return allowNegative ? parsed : Math.max(0, parsed); };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params; const data = await request.formData();
  const [owned] = await db.select({ id: accounts.id }).from(accounts).innerJoin(ips, eq(accounts.ipId, ips.id)).where(and(eq(accounts.id, id), eq(ips.ownerId, user.id))).limit(1);
  if (!owned) return NextResponse.json({ error: "无权访问" }, { status: 403 });
  try {
    if (data.get("action") === "content") {
      const title = String(data.get("title") || "").trim(); const publishedDate = String(data.get("publishedDate") || ""); if (!title || !publishedDate) return seeOther(`/accounts/${id}?error=input`);
      await db.insert(contents).values({ ipId: (await db.select({ ipId: accounts.ipId }).from(accounts).where(eq(accounts.id, id)).limit(1))[0].ipId, accountId: id, title, status: "published", format: String(data.get("format") || "短视频"), publishedUrl: String(data.get("publishedUrl") || "") || null, publishedAt: new Date(`${publishedDate}T12:00:00+08:00`) });
    } else if (data.get("action") === "metric") {
      const contentId = String(data.get("contentId") || ""); const metricDate = String(data.get("metricDate") || "");
      const [work] = await db.select({ id: contents.id }).from(contents).where(and(eq(contents.id, contentId), eq(contents.accountId, id))).limit(1); if (!work || !/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) return seeOther(`/accounts/${id}?error=input`);
      const values = { views: numberValue(data, "views"), likes: numberValue(data, "likes"), saves: numberValue(data, "saves"), shares: numberValue(data, "shares"), followerDelta: numberValue(data, "followerDelta", true), leads: numberValue(data, "leads"), revenue: String(Math.max(0, Number.parseFloat(String(data.get("revenue") || "0")) || 0)) };
      const [previous] = await db.select({ followerDelta: metrics.followerDelta }).from(metrics).where(and(eq(metrics.contentId, contentId), eq(metrics.metricDate, metricDate))).limit(1);
      await db.insert(metrics).values({ contentId, metricDate, ...values, engagements: values.likes + values.saves + values.shares }).onConflictDoUpdate({ target: [metrics.contentId, metrics.metricDate], set: { ...values, engagements: values.likes + values.saves + values.shares, capturedAt: new Date() } });
      const difference = values.followerDelta - (previous?.followerDelta || 0); if (difference) await db.update(accounts).set({ followers: sql`greatest(0, ${accounts.followers} + ${difference})`, updatedAt: new Date() }).where(eq(accounts.id, id));
    } else return seeOther(`/accounts/${id}?error=input`);
    return seeOther(`/accounts/${id}?ok=1`);
  } catch (error) { console.error("Failed to save content metrics", error); return seeOther(`/accounts/${id}?error=save`); }
}
