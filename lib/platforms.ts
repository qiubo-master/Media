export const platformLabels: Record<string, string> = {
  douyin: "抖音", xiaohongshu: "小红书", wechat_channels: "微信视频号", wechat_official: "微信公众号",
  bilibili: "哔哩哔哩", weibo: "微博", kuaishou: "快手", other: "其他",
};

export function platformLabel(platform: string) {
  return platformLabels[platform] || platform;
}
