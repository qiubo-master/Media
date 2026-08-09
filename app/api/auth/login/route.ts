import { verify } from "@node-rs/argon2";
import { and, count, eq, gt, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authEvents, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { requestIp, safeReturnTo } from "@/lib/request";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const ip = requestIp(request);
  const returnTo = safeReturnTo(String(data.get("returnTo") || "/"));
  const since = new Date(Date.now() - 15 * 60_000);
  const [attempts] = await db.select({ value: count() }).from(authEvents)
    .where(and(eq(authEvents.success, false), gt(authEvents.createdAt, since), or(eq(authEvents.ip, ip), eq(authEvents.email, email))));
  if ((attempts?.value ?? 0) >= 8) return NextResponse.redirect(new URL("/login?error=locked", request.url), 303);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = !!user?.active && await verify(user.passwordHash, password).catch(() => false);
  await db.insert(authEvents).values({ email: email || "(empty)", ip, success: valid });
  if (!valid) return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  await createSession(user.id);
  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}
