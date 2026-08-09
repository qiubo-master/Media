import { hash } from "@node-rs/argon2";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (current?.role !== "admin") return NextResponse.json({ error: "无权限" }, { status: 403 });
  const data = await request.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const name = String(data.get("name") || "").trim();
  const password = String(data.get("password") || "");
  const role = data.get("role") === "admin" ? "admin" : "member";
  if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || password.length < 12) return NextResponse.json({ error: "输入不符合要求" }, { status: 400 });
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 3, parallelism: 1 });
  await db.insert(users).values({ email, name, passwordHash, role });
  return NextResponse.redirect(new URL("/admin/users", request.url), 303);
}
