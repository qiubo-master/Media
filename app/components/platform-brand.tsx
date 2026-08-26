import { platformLabel } from "@/lib/platforms";

const platformMarks: Record<string, string> = {
  douyin: "♪",
  xiaohongshu: "RED",
  wechat_channels: "视",
  wechat_official: "微",
  bilibili: "B",
  weibo: "◉",
  kuaishou: "∞",
  other: "媒",
};

export default function PlatformBrand({ platform, compact = false }: { platform: string; compact?: boolean }) {
  const key = platformMarks[platform] ? platform : "other";
  return <span className={`platform-brand platform-${key}${compact ? " compact" : ""}`}>
    <span className="platform-logo" aria-hidden="true">{platformMarks[key]}</span>
    <span className="platform-brand-name">{platformLabel(platform)}</span>
  </span>;
}
