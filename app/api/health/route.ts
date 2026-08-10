import { NextResponse } from "next/server";
import { sql } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  if (process.env.LOCAL_DEMO_MODE === "true") {
    return NextResponse.json({ status: "healthy", service: "media-creator-os", mode: "demo", latencyMs: Date.now() - startedAt });
  }
  try {
    await sql`select 1`;
    return NextResponse.json({ status: "healthy", service: "media-creator-os", database: "connected", latencyMs: Date.now() - startedAt });
  } catch {
    return NextResponse.json({ status: "unhealthy", service: "media-creator-os", database: "unavailable" }, { status: 503 });
  }
}
