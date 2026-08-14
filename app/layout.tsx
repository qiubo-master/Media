import type { Metadata } from "next";
import "./globals.css";
import "./ui-fixes.css";
import "./analytics.css";
import "./kpi-detail.css";
import "./account-import.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "序章 · 自媒体经营中台",
  description: "连接IP定位、内容生产、账号数据、获客转化与AI经营决策。",
  openGraph: { title: "序章 · Creator OS", description: "让每一条内容，都指向增长", images: [{ url: "/og.png", width: 1200, height: 630, alt: "序章 Creator OS" }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
