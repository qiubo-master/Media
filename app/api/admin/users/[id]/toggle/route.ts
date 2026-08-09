import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (current?.role !== "admin") return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id } = await params;
  if (id === current.id) return NextResponse.json({ error: "不能停用自己的账号" }, { status: 400 });
  const [target] = await db.select({ active: users.active }).from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  await db.update(users).set({ active: !target.active, updatedAt: new Date() }).where(eq(users.id, id));
  if (target.active) await db.delete(sessions).where(eq(sessions.userId, id));
  return NextResponse.redirect(new URL("/admin/users", request.url), 303);
}
