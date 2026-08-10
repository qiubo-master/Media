import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiInsights, assets, contents, ips, leads, serviceCases, topics } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { seeOther } from "@/lib/request";

export async function POST(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { module } = await params; const data = await request.formData();
  let [profile] = await db.select().from(ips).where(eq(ips.ownerId, user.id)).limit(1);
  if (!profile) [profile] = await db.insert(ips).values({ ownerId: user.id, name: String(data.get("name") || `${user.name}的IP`) }).returning();
  const value = (key: string) => String(data.get(key) || "").trim() || null;
  if (module === "positioning") await db.update(ips).set({ name: value("name") || profile.name, positioning: value("positioning"), audience: value("audience"), valueProposition: value("valueProposition"), updatedAt: new Date() }).where(eq(ips.id, profile.id));
  else if (module === "topics" && value("title")) await db.insert(topics).values({ ipId: profile.id, title: value("title")!, angle: value("angle"), audiencePain: value("audiencePain"), contentType: value("contentType") });
  else if (module === "content" && value("title")) await db.insert(contents).values({ ipId: profile.id, title: value("title")!, format: value("format"), status: value("status") || "draft" });
  else if (module === "assets" && value("name")) await db.insert(assets).values({ ipId: profile.id, ownerId: user.id, name: value("name")!, kind: value("kind") || "document", sourceUrl: value("sourceUrl") });
  else if (module === "leads" && value("contact")) await db.insert(leads).values({ ipId: profile.id, name: value("name"), contact: value("contact"), channel: value("channel"), intent: value("intent") });
  else if (module === "service" && value("leadId") && value("title")) { const [ownedLead] = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, value("leadId")!), eq(leads.ipId, profile.id))).limit(1); if (ownedLead) await db.insert(serviceCases).values({ leadId: ownedLead.id, title: value("title")!, priority: value("priority") || "normal" }); }
  else if (module === "insights" && value("title") && value("summary")) await db.insert(aiInsights).values({ ipId: profile.id, insightType: "manual", title: value("title")!, summary: value("summary")!, recommendation: { action: value("recommendation") } });
  else return NextResponse.json({ error: "输入无效" }, { status: 400 });
  return seeOther(`/modules/${module}?ok=1`);
}
