import { verify } from "@node-rs/argon2";
import { and, count, eq, gt, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { authEvents, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { requestIp, safeReturnTo, seeOther } from "@/lib/request";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const ip = requestIp(request);
  const returnTo = safeReturnTo(String(data.get("returnTo") || "/"));
  const since = new Date(Date.now() - 15 * 60_000);
  const [attempts] = await db.select({ value: count() }).from(authEvents)
    .where(and(eq(authEvents.success, false), gt(authEvents.createdAt, since), or(eq(authEvents.ip, ip), eq(authEvents.email, email))));
  if ((attempts?.value ?? 0) >= 8) return seeOther("/login?error=locked");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = !!user?.active && await verify(user.passwordHash, password).catch(() => false);
  await db.insert(authEvents).values({ email: email || "(empty)", ip, success: valid });
  if (!valid) return seeOther("/login?error=invalid");
  await createSession(user.id);
  return seeOther(returnTo);
}
