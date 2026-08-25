export type RemoteWork = {
  id: string; title: string; body?: string; url?: string; format?: string; publishedAt: string;
  views?: number; impressions?: number; likes?: number; comments?: number; shares?: number; saves?: number;
};

export type PlatformSyncResult = { followers?: number; works: RemoteWork[] };

function nonNegativeInteger(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

export async function fetchPlatformWorks(input: { platform: string; handle: string; credential: Record<string, string> }) {
  const endpoint = process.env.PLATFORM_SYNC_ENDPOINT;
  if (!endpoint) throw new Error("尚未配置平台采集服务");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.PLATFORM_SYNC_API_KEY ? { authorization: `Bearer ${process.env.PLATFORM_SYNC_API_KEY}` } : {}) },
    body: JSON.stringify(input), signal: AbortSignal.timeout(45_000), cache: "no-store",
  });
  if (!response.ok) throw new Error(`采集服务返回 ${response.status}`);
  const data = await response.json() as Partial<PlatformSyncResult>;
  if (!Array.isArray(data.works)) throw new Error("采集服务返回格式不正确");
  return {
    followers: data.followers === undefined ? undefined : nonNegativeInteger(data.followers),
    works: data.works.slice(0, 500).map((work) => ({
      id: String(work.id || "").trim(), title: String(work.title || "未命名作品").slice(0, 500), body: work.body ? String(work.body) : undefined,
      url: work.url ? String(work.url) : undefined, format: work.format ? String(work.format) : undefined, publishedAt: String(work.publishedAt || ""),
      views: nonNegativeInteger(work.views), impressions: nonNegativeInteger(work.impressions), likes: nonNegativeInteger(work.likes), comments: nonNegativeInteger(work.comments), shares: nonNegativeInteger(work.shares), saves: nonNegativeInteger(work.saves),
    })).filter((work) => work.id && !Number.isNaN(Date.parse(work.publishedAt))),
  } satisfies PlatformSyncResult;
}
