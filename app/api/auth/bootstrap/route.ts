import { hash } from "@node-rs/argon2";
import { count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { seeOther } from "@/lib/request";

export async function POST(request: NextRequest) {
  const [existing] = await db.select({ value: count() }).from(users);
  if ((existing?.value ?? 0) > 0) return NextResponse.json({ error: "初始化入口已关闭" }, { status: 403 });
  const data = await request.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const name = String(data.get("name") || "").trim();
  const password = String(data.get("password") || "");
  if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || password.length < 12) {
    return seeOther("/login?setup=1&error=weak");
  }
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 3, parallelism: 1 });
  const [user] = await db.insert(users).values({ email, name, passwordHash, role: "admin" }).returning({ id: users.id });
  await createSession(user.id);
  return seeOther("/");
}
