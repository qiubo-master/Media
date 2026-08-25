import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, ips, platformConnections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { encryptCredential } from "@/lib/credentials";
import { seeOther } from "@/lib/request";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  const [owned] = await db.select({ id: accounts.id, platform: accounts.platform }).from(accounts).innerJoin(ips, eq(accounts.ipId, ips.id)).where(and(eq(accounts.id, id), eq(ips.ownerId, user.id))).limit(1);
  if (!owned) return NextResponse.json({ error: "无权访问" }, { status: 403 });
  const data = await request.formData(); const username = String(data.get("username") || "").trim(); const password = String(data.get("password") || "");
  if (!username || !password) return seeOther(`/accounts/${id}?error=credential`);
  try {
    const encryptedCredential = encryptCredential({ username, password });
    await db.insert(platformConnections).values({ accountId: id, provider: owned.platform, authType: "password", encryptedCredential, status: "ready" })
      .onConflictDoUpdate({ target: platformConnections.accountId, set: { provider: owned.platform, authType: "password", encryptedCredential, status: "ready", lastError: null, updatedAt: new Date() } });
    await db.update(accounts).set({ syncMode: "api", status: "ready", updatedAt: new Date() }).where(eq(accounts.id, id));
    return seeOther(`/accounts/${id}?ok=connection`);
  } catch (error) { console.error("Failed to save platform connection", error instanceof Error ? error.message : "unknown"); return seeOther(`/accounts/${id}?error=credential`); }
}
