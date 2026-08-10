import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, ips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { seeOther } from "@/lib/request";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const data = await request.formData();
  const platform = String(data.get("platform") || "").trim();
  const handle = String(data.get("handle") || "").trim();
  const profileUrl = String(data.get("profileUrl") || "").trim() || null;
  if (!platform || handle.length < 2) return seeOther("/accounts?error=input");
  let [profile] = await db.select({ id: ips.id }).from(ips).where(eq(ips.ownerId, user.id)).limit(1);
  if (!profile) [profile] = await db.insert(ips).values({ ownerId: user.id, name: `${user.name}的IP` }).returning({ id: ips.id });
  await db.insert(accounts).values({ ipId: profile.id, platform, handle, displayName: handle, profileUrl }).onConflictDoNothing();
  return seeOther("/accounts?ok=account");
}
