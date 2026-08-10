import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountDailyMetrics, accounts, importBatches, ips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { seeOther } from "@/lib/request";

const aliases: Record<string, string> = { 日期: "date", 粉丝数: "followers", 新增粉丝: "follower_delta", 曝光: "impressions", 播放: "views", 互动: "engagements", 主页访问: "profile_visits", 线索: "leads", 收入: "revenue" };
const integerFields = ["followers", "follower_delta", "impressions", "views", "engagements", "profile_visits", "leads"] as const;

function parseCsvLine(line: string) {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { values.push(value.trim()); value = ""; } else value += char; }
  values.push(value.trim()); return values;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const data = await request.formData(); const accountId = String(data.get("accountId") || ""); const file = data.get("file");
  if (!(file instanceof File) || file.size > 5_000_000 || !accountId) return seeOther("/accounts?error=csv");
  const [owned] = await db.select({ id: accounts.id }).from(accounts).innerJoin(ips, eq(accounts.ipId, ips.id)).where(and(eq(accounts.id, accountId), eq(ips.ownerId, user.id))).limit(1);
  if (!owned) return NextResponse.json({ error: "无权访问该账号" }, { status: 403 });
  const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean); const header = parseCsvLine(lines[0] || "").map((item) => aliases[item] || item.toLowerCase());
  if (!header.includes("date")) return seeOther("/accounts?error=csv");
  const [batch] = await db.insert(importBatches).values({ ownerId: user.id, accountId, fileName: file.name, importType: "account_daily", rowCount: Math.max(0, lines.length - 1) }).returning({ id: importBatches.id });
  const errors: { row: number; message: string }[] = []; let success = 0; let latestFollowers: number | undefined;
  for (let i = 1; i < lines.length; i++) {
    try { const values = parseCsvLine(lines[i]); const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""])); if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) throw new Error("日期需为 YYYY-MM-DD");
      const numbers = Object.fromEntries(integerFields.map((key) => [key, Math.max(0, Number.parseInt(row[key] || "0", 10) || 0)])); latestFollowers = numbers.followers;
      await db.insert(accountDailyMetrics).values({ accountId, metricDate: row.date, ...numbers, revenue: String(Math.max(0, Number.parseFloat(row.revenue || "0") || 0)), source: "csv" })
        .onConflictDoUpdate({ target: [accountDailyMetrics.accountId, accountDailyMetrics.metricDate], set: { ...numbers, revenue: String(Math.max(0, Number.parseFloat(row.revenue || "0") || 0)), source: "csv" } }); success++;
    } catch (error) { errors.push({ row: i + 1, message: error instanceof Error ? error.message : "解析失败" }); }
  }
  if (latestFollowers !== undefined) await db.update(accounts).set({ followers: latestFollowers, lastSyncedAt: new Date(), updatedAt: new Date() }).where(eq(accounts.id, accountId));
  await db.update(importBatches).set({ status: errors.length === lines.length - 1 ? "failed" : "completed", successCount: success, errorCount: errors.length, errors, completedAt: new Date() }).where(eq(importBatches.id, batch.id));
  return seeOther(errors.length === lines.length - 1 ? "/accounts?error=csv" : "/accounts?ok=import");
}
