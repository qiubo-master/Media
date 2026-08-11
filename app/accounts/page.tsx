import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, accountDailyMetrics, importBatches, ips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import "./module.css";
import SubmitButton from "@/app/components/submit-button";

export const dynamic = "force-dynamic";

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [profile] = await db.select().from(ips).where(eq(ips.ownerId, user.id)).limit(1);
  const rows = profile ? await db.select().from(accounts).where(eq(accounts.ipId, profile.id)).orderBy(desc(accounts.updatedAt)) : [];
  const latest = profile ? await db.select({ accountId: accountDailyMetrics.accountId, date: accountDailyMetrics.metricDate, followers: accountDailyMetrics.followers, views: accountDailyMetrics.views, engagements: accountDailyMetrics.engagements, leads: accountDailyMetrics.leads, revenue: accountDailyMetrics.revenue })
    .from(accountDailyMetrics).innerJoin(accounts, eq(accountDailyMetrics.accountId, accounts.id)).where(eq(accounts.ipId, profile.id)).orderBy(desc(accountDailyMetrics.metricDate)).limit(50) : [];
  const latestByAccount = new Map(latest.map((item) => [item.accountId, item]));
  const imports = await db.select().from(importBatches).where(eq(importBatches.ownerId, user.id)).orderBy(desc(importBatches.createdAt)).limit(8);

  return <main className="module-page">
    <header className="module-header"><div><Link href="/">← 返回经营总览</Link><p>账号矩阵</p><h1>平台账号与每日数据</h1><span>能通过官方 API 获取的平台可自动同步，其余平台每天上传 CSV 即可进入统一分析。</span></div><div className="module-badge">{rows.length} 个账号</div></header>
    {params.ok && <div className="notice success">操作成功，数据已保存。</div>}
    {params.error && <div className="notice error">{params.error === "csv" ? "CSV 格式不正确，请使用页面提供的字段。" : "操作失败，请检查输入后重试。"}</div>}

    <section className="module-grid">
      <article className="module-card"><h2>添加平台账号</h2><p>这里只保存账号标识，不需要提交平台密码。</p><form className="stack-form" action="/api/accounts" method="post">
        <label>平台<select name="platform" required defaultValue="douyin"><option value="douyin">抖音</option><option value="xiaohongshu">小红书</option><option value="wechat_channels">微信视频号</option><option value="bilibili">哔哩哔哩</option><option value="weibo">微博</option><option value="kuaishou">快手</option><option value="other">其他</option></select></label>
        <label>账号名称或 ID<input name="handle" required placeholder="例如：序章IP咨询" /></label>
        <label>主页链接（可选）<input name="profileUrl" type="url" placeholder="https://..." /></label>
        <SubmitButton>添加账号</SubmitButton>
      </form></article>

      <article className="module-card"><h2>上传每日数据</h2><p>导出平台后台数据后另存为 UTF-8 CSV。每个日期重复上传会覆盖当日数据，不会重复累计。</p><form className="stack-form" action="/api/accounts/import" method="post" encType="multipart/form-data">
        <label>选择账号<select name="accountId" required><option value="">请选择</option>{rows.map((account) => <option value={account.id} key={account.id}>{account.displayName || account.handle} · {account.platform}</option>)}</select></label>
        <label>CSV 文件<input name="file" type="file" accept=".csv,text/csv" required /></label>
        {rows.length ? <SubmitButton>上传并导入</SubmitButton> : <button type="button" disabled>请先添加账号</button>}
      </form><div className="csv-help"><b>支持字段</b><code>date,followers,follower_delta,impressions,views,engagements,profile_visits,leads,revenue</code><small>字段也支持中文：日期、粉丝数、新增粉丝、曝光、播放、互动、主页访问、线索、收入。</small></div></article>
    </section>

    <section className="module-card full"><div className="section-title"><div><h2>账号列表</h2><p>最近一条上传记录会显示在这里。</p></div></div>
      {!rows.length ? <div className="empty">还没有账号，请先添加第一个平台账号。</div> : <div className="account-table"><div className="account-row head"><span>账号</span><span>同步方式</span><span>粉丝</span><span>播放</span><span>互动</span><span>线索</span><span>操作</span></div>{rows.map((account) => { const metric = latestByAccount.get(account.id); return <Link className="account-row account-link" href={`/accounts/${account.id}`} key={account.id}><span><b>{account.displayName || account.handle}</b><small>{account.platform} · 点击进入作品数据</small></span><span><i className={account.syncMode === "api" ? "api" : "manual"}>{account.syncMode === "api" ? "API 自动" : "手工上传"}</i></span><span>{metric?.followers?.toLocaleString() ?? account.followers.toLocaleString()}</span><span>{metric?.views?.toLocaleString() ?? "—"}</span><span>{metric?.engagements?.toLocaleString() ?? "—"}</span><span>{metric?.leads?.toLocaleString() ?? "—"}</span><span>录入作品 →</span></Link>})}</div>}
    </section>

    <section className="module-card full"><h2>最近导入记录</h2>{!imports.length ? <div className="empty">暂无导入记录。</div> : <div className="import-list">{imports.map((batch) => <div key={batch.id}><span><b>{batch.fileName}</b><small>{batch.createdAt.toLocaleString("zh-CN")}</small></span><span>{batch.successCount}/{batch.rowCount} 行成功</span><i className={batch.status}>{batch.status === "completed" ? "已完成" : batch.status}</i></div>)}</div>}</section>
  </main>;
}
