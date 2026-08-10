import { NextRequest, NextResponse } from "next/server";

export function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function safeReturnTo(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function seeOther(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: safeReturnTo(location) } });
}
