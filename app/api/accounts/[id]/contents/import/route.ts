import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, contents, importBatches, ips, metrics } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { seeOther } from "@/lib/request";

const aliases: Record<string, string> = { "作品标题": "title", "发布日期": "published_date", "数据日期": "metric_date", "作品类型": "format", "作品链接": "url", "新增播放": "views", "新增点赞": "likes", "新增收藏": "saves", "新增转发": "shares", "粉丝增加": "follower_delta", "新增线索": "leads", "新增收入": "revenue" };
const integerFields = ["views", "likes", "saves", "shares", "follower_delta", "leads"] as const;

function parseCsvLine(line: string) {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { values.push(value.trim()); value = ""; } else value += char; }
  values.push(value.trim()); return values;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params; const data = await request.formData(); const file = data.get("file");
  if (!(file instanceof File) || file.size > 5_000_000) return seeOther(`/accounts/${id}?error=csv`);
  const [owned] = await db.select({ id: accounts.id, ipId: accounts.ipId }).from(accounts).innerJoin(ips, eq(accounts.ipId, ips.id)).where(and(eq(accounts.id, id), eq(ips.ownerId, user.id))).limit(1);
  if (!owned) return NextResponse.json({ error: "无权访问" }, { status: 403 });
  const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean); const header = parseCsvLine(lines[0] || "").map((key) => aliases[key] || key.toLowerCase());
  if (!header.includes("title") || !header.includes("metric_date")) return seeOther(`/accounts/${id}?error=csv`);
  const [batch] = await db.insert(importBatches).values({ ownerId: user.id, accountId: id, fileName: file.name, importType: "content_metrics", rowCount: Math.max(0, lines.length - 1) }).returning({ id: importBatches.id });
  const errors: { row: number; message: string }[] = []; let success = 0; let followerDifference = 0;
  for (let index = 1; index < lines.length; index++) {
    try {
      const values = parseCsvLine(lines[index]); const row = Object.fromEntries(header.map((key, column) => [key, values[column] || ""]));
      if (!row.title || !/^\d{4}-\d{2}-\d{2}$/.test(row.metric_date)) throw new Error("缺少标题或数据日期");
      let [work] = await db.select({ id: contents.id }).from(contents).where(and(eq(contents.accountId, id), eq(contents.title, row.title))).limit(1);
      if (!work) [work] = await db.insert(contents).values({ ipId: owned.ipId, accountId: id, title: row.title, status: "published", format: row.format || "短视频", publishedUrl: row.url || null, publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(row.published_date) ? new Date(`${row.published_date}T12:00:00+08:00`) : null }).returning({ id: contents.id });
      const numbers = Object.fromEntries(integerFields.map((key) => [key, Number.parseInt(row[key] || "0", 10) || 0])); const followerDelta = numbers.follower_delta;
      const [previous] = await db.select({ followerDelta: metrics.followerDelta }).from(metrics).where(and(eq(metrics.contentId, work.id), eq(metrics.metricDate, row.metric_date))).limit(1);
      const metricValues = { views: Math.max(0, numbers.views), likes: Math.max(0, numbers.likes), saves: Math.max(0, numbers.saves), shares: Math.max(0, numbers.shares), followerDelta, leads: Math.max(0, numbers.leads), revenue: String(Math.max(0, Number.parseFloat(row.revenue || "0") || 0)) };
      await db.insert(metrics).values({ contentId: work.id, metricDate: row.metric_date, ...metricValues, engagements: metricValues.likes + metricValues.saves + metricValues.shares }).onConflictDoUpdate({ target: [metrics.contentId, metrics.metricDate], set: { ...metricValues, engagements: metricValues.likes + metricValues.saves + metricValues.shares, capturedAt: new Date() } });
      followerDifference += followerDelta - (previous?.followerDelta || 0); success++;
    } catch (error) { errors.push({ row: index + 1, message: error instanceof Error ? error.message : "解析失败" }); }
  }
  if (followerDifference) await db.update(accounts).set({ followers: sql`greatest(0, ${accounts.followers} + ${followerDifference})`, updatedAt: new Date() }).where(eq(accounts.id, id));
  await db.update(importBatches).set({ status: success ? "completed" : "failed", successCount: success, errorCount: errors.length, errors, completedAt: new Date() }).where(eq(importBatches.id, batch.id));
  return seeOther(success ? `/accounts/${id}?ok=import` : `/accounts/${id}?error=csv`);
}
