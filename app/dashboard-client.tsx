"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { platformLabel } from "@/lib/platforms";

const nav = ["经营总览", "IP定位", "选题策划", "内容生产", "素材资产", "账号矩阵", "获客中心", "客户服务", "数据洞察"];
const navPaths: Record<string, string> = { "IP定位": "/modules/positioning", "选题策划": "/modules/topics", "内容生产": "/modules/content", "素材资产": "/modules/assets", "账号矩阵": "/accounts", "获客中心": "/modules/leads", "客户服务": "/modules/service", "数据洞察": "/modules/insights" };

const tasks = [
  { title: "发布｜小红书：普通人做IP最容易踩的3个坑", meta: "10:30 · 主理人IP", tone: "purple" },
  { title: "审核｜视频号口播《内容不是越多越好》", meta: "今天 · 等待确认", tone: "amber" },
  { title: "跟进｜7位领取定位清单的新线索", meta: "3位高意向 · 建议今天联系", tone: "green" },
];

const providers = [
  { id: "openai", name: "OpenAI", models: ["gpt-5.2", "gpt-5-mini"] },
  { id: "anthropic", name: "Anthropic", models: ["claude-sonnet-4-5", "claude-haiku-4-5"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-2.5-pro", "gemini-2.5-flash"] },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
];

type Trend = { date: string; views: number; likes: number; saves: number; shares: number; followerDelta: number };
type AccountTrend = { id: string; name: string; platform: string; followers: number; views: number; likes: number; saves: number; shares: number; followerDelta: number };
type TopContent = { id: string; title: string; platform: string; views: number; likes: number; saves: number; shares: number; followerDelta: number; revenue: number };
type DailyAccount = { date: string; accountId: string; accountName: string; platform: string; views: number; leads: number; revenue: number };

function MetricScroller({ rows, field }: { rows: DailyAccount[]; field: "views" | "leads" | "revenue" }) {
  const scroller = useRef<HTMLDivElement>(null); const drag = useRef({ active: false, x: 0, left: 0 });
  const days = useMemo(() => { const grouped = new Map<string, DailyAccount[]>(); for (const row of rows) grouped.set(row.date, [...(grouped.get(row.date) || []), row]); return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)); }, [rows]);
  useEffect(() => { if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth; }, [days.length]);
  const format = (value: number) => field === "revenue" ? `¥${value.toLocaleString()}` : value.toLocaleString();
  if (!days.length) return <div className="metric-empty">录入作品数据后，这里会生成连续30天明细</div>;
  return <><div className="drag-hint"><span>←</span> 按住拖动查看历史 <span>→</span></div><div className="metric-scroller" ref={scroller} onPointerDown={(event) => { drag.current = { active: true, x: event.clientX, left: event.currentTarget.scrollLeft }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (drag.current.active) event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x); }} onPointerUp={() => { drag.current.active = false; }} onPointerCancel={() => { drag.current.active = false; }}>
    {days.map(([date, accounts], dayIndex) => { const total = accounts.reduce((sum, account) => sum + account[field], 0); return <div className={`metric-day ${dayIndex === days.length - 1 ? "latest" : ""}`} key={date}><div className="metric-day-head"><b>{date.slice(5).replace("-", "/")}</b>{dayIndex === days.length - 1 && <em>最新</em>}</div><div className="day-total"><small>当日合计</small><strong>{format(total)}</strong></div><div className="day-accounts">{accounts.map((account, index) => <span key={account.accountId}><i className={`account-dot tone-${index % 5}`}/><small>{account.accountName}</small><strong>{format(account[field])}</strong></span>)}</div></div>; })}
  </div></>;
}

function TrendChart({ title, subtitle, rows, mode }: { title: string; subtitle: string; rows: Trend[]; mode: "views" | "interaction" | "followers" }) {
  const values = rows.map((row) => mode === "views" ? row.views : mode === "followers" ? row.followerDelta : row.likes + row.saves + row.shares);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  const tone = mode === "views" ? "" : mode === "interaction" ? "green" : "coral";
  return <article className="card trend-card"><div className="card-title"><div><h3>{title}</h3><p>{subtitle}</p></div></div>{rows.length ? <div className="trend-bars">{rows.map((row, index) => { const value = values[index]; const detail = mode === "interaction" ? `${row.date} 点赞${row.likes} 收藏${row.saves} 转发${row.shares}` : `${row.date} ${value}`; return <i className={`trend-bar ${tone}`} style={{ height: `${Math.max(4, Math.abs(value) / max * 100)}%` }} data-value={detail} title={detail} key={row.date}/>; })}</div> : <div className="empty">录入作品数据后生成趋势</div>}</article>;
}

export default function DashboardClient({ userName = "用户", ipName = "个人IP", isAdmin = false, stats = { followers: 0, views: 0, leads: 0, revenue: 0 }, trends = [], accountTrends = [], topContents = [], dailyAccounts = [] }: { userName?: string; ipName?: string; isAdmin?: boolean; stats?: { followers: number; views: number; leads: number; revenue: number }; trends?: Trend[]; accountTrends?: AccountTrend[]; topContents?: TopContent[]; dailyAccounts?: DailyAccount[] }) {
  const [active, setActive] = useState("经营总览");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-5.2");
  const [panel, setPanel] = useState(false);
  const [toast, setToast] = useState("");
  const models = useMemo(() => providers.find((p) => p.id === provider)?.models ?? [], [provider]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">AI</span><div><strong>自媒体中台</strong><small>Creator OS</small></div></div>
        <button className="workspace"><span className="avatar">{userName.slice(0, 1)}</span><span><b>{ipName}</b><small>{userName} · 个人空间</small></span><i>⌄</i></button>
        <nav>
          <p className="nav-label">工作空间</p>
          {nav.slice(0, 1).map((item) => <button key={item} onClick={() => setActive(item)} className={active === item ? "active" : ""}><span>⌂</span>{item}</button>)}
          <p className="nav-label">内容增长</p>
          {nav.slice(1, 5).map((item, i) => <Link className="admin-link" href={navPaths[item]} key={item}><span>{["◎", "◇", "✦", "▧"][i]}</span>　{item}</Link>)}
          <p className="nav-label">经营转化</p>
          {nav.slice(5).map((item, i) => <Link className="admin-link" href={navPaths[item]} key={item}><span>{["◉", "⌁", "♡", "⌁"][i]}</span>　{item}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link className="admin-link" href="/accounts">▦　账号矩阵与数据上传</Link>{isAdmin && <Link className="admin-link" href="/admin/users">♙　用户与权限管理</Link>}<button onClick={() => setPanel(true)}>⚙　模型与系统设置</button><form action="/api/auth/logout" method="post"><button type="submit">↪　退出登录</button></form><div className="usage"><span>本月 AI 用量</span><b>68%</b><i><u /></i><small>68.2万 / 100万 Tokens</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="status-dot" />所有账号运行正常</div><div className="top-actions"><button aria-label="搜索">⌕</button><button aria-label="通知">♢<i /></button><button onClick={() => setPanel(true)} className="model-pill"><span>✦</span>{providers.find(p => p.id === provider)?.name} · {model}<b>⌄</b></button><span className="user-avatar">{userName.slice(0, 1)}</span></div></header>

        <div className="page">
          <div className="welcome"><div><p>你的内容经营工作台</p><h1>你好，{userName} <span>👋</span></h1><h2>{ipName} 的真实经营数据与增长趋势。</h2></div><div className="range"><button className="active">近30天</button></div></div>

          <section className="hero-grid">
            <article className="kpi-card kpi-detail tone-purple"><div className="kpi-head"><span><b className="kpi-icon">人</b>总粉丝</span><i>各平台当前值</i></div><strong>{stats.followers.toLocaleString()}</strong><div className="follower-accounts">{accountTrends.map((account, index) => <span key={account.id}><i className={`account-dot tone-${index % 5}`}/><small>{account.name}<em>{platformLabel(account.platform)}</em></small><b>{account.followers.toLocaleString()}</b></span>)}</div></article>
            <article className="kpi-card kpi-detail tone-blue"><div className="kpi-head"><span><b className="kpi-icon">播</b>近30日播放</span><i>每日 · 分账号</i></div><strong>{stats.views.toLocaleString()}</strong><MetricScroller rows={dailyAccounts} field="views"/></article>
            <article className="kpi-card kpi-detail tone-green"><div className="kpi-head"><span><b className="kpi-icon">客</b>近30日线索</span><i>每日 · 分账号</i></div><strong>{stats.leads.toLocaleString()}</strong><MetricScroller rows={dailyAccounts} field="leads"/></article>
            <article className="kpi-card kpi-detail tone-coral revenue"><div className="kpi-head"><span><b className="kpi-icon">¥</b>近30日收入</span><i>每日 · 分账号</i></div><strong>¥ {stats.revenue.toLocaleString()}</strong><MetricScroller rows={dailyAccounts} field="revenue"/></article>
          </section>

          <section className="trend-grid"><TrendChart title="播放趋势" subtitle="全部账号近30日作品播放" rows={trends} mode="views"/><TrendChart title="互动趋势" subtitle="点赞、收藏与转发合计" rows={trends} mode="interaction"/><TrendChart title="粉丝增长趋势" subtitle="按作品归因的新增粉丝" rows={trends} mode="followers"/></section>

          <section className="lower-grid">
            <article className="card tasks"><div className="card-title"><div><h3>今日优先事项</h3><p>按经营价值智能排序</p></div><button>查看全部 →</button></div>{tasks.map((task, i) => <div className="task" key={task.title}><button onClick={() => flash("任务已标记完成")}>✓</button><span className={`task-icon ${task.tone}`}>{["↗", "▶", "♙"][i]}</span><div><b>{task.title}</b><small>{task.meta}</small></div><i>›</i></div>)}</article>
            <article className="card platform"><div className="card-title"><div><h3>账号矩阵</h3><p>近30日真实作品表现</p></div><Link href="/accounts">管理账号 →</Link></div>{accountTrends.length ? accountTrends.slice(0, 5).map((account) => <div className="platform-row" key={account.id}><span className="red">{account.platform.slice(0,1)}</span><b>{account.name}<small>{account.views.toLocaleString()} 播放</small></b><em>+{account.followerDelta.toLocaleString()} 粉</em><Link href={`/accounts/${account.id}`}>详情 →</Link></div>) : <div className="empty">请先在账号矩阵录入作品数据。</div>}</article>
          </section>

          <section className="card top-content"><div className="card-title"><div><h3>高表现作品</h3><p>按真实播放量排序</p></div><Link href="/accounts">录入作品 →</Link></div><div className="table"><div className="tr th"><span>作品</span><span>平台</span><span>播放</span><span>互动</span><span>收入</span></div>{topContents.length ? topContents.map((item, i) => <div className="tr" key={item.id}><span className="content-name"><i>{i + 1}</i><b>{item.title}</b></span><span><b>{item.platform}</b><small>增粉 {item.followerDelta}</small></span><span><strong>{item.views.toLocaleString()}</strong></span><span><b>{(item.likes + item.saves + item.shares).toLocaleString()}</b></span><span><em>¥{item.revenue.toLocaleString()}</em></span></div>) : <div className="empty">暂无作品数据。</div>}</div></section>
          <section className="card top-content"><div className="card-title"><div><h3>各账号增长看板</h3><p>点击账号进入作品和趋势明细</p></div></div><div className="account-growth-grid">{accountTrends.map((account) => <Link className="account-growth-card" href={`/accounts/${account.id}`} key={account.id}><b>{account.name}</b><small>{platformLabel(account.platform)} · 总粉丝 {account.followers.toLocaleString()}</small><strong>{account.views.toLocaleString()} 播放</strong><div className="mini-stats"><span>互动 {(account.likes + account.saves + account.shares).toLocaleString()}</span><span>增粉 +{account.followerDelta.toLocaleString()}</span></div></Link>)}</div></section>
        </div>
      </section>

      {panel && <div className="overlay" onMouseDown={() => setPanel(false)}><aside className="settings" onMouseDown={e => e.stopPropagation()}><div className="settings-head"><div><span>✦</span><h3>大模型中枢<small>为不同任务选择最合适的模型</small></h3></div><button onClick={() => setPanel(false)}>×</button></div><label>服务商</label><div className="providers">{providers.map(p => <button key={p.id} className={provider === p.id ? "active" : ""} onClick={() => {setProvider(p.id); setModel(p.models[0]);}}><i>{p.name.slice(0,1)}</i><span>{p.name}<small>{p.models.length} 个可用模型</small></span><b>{provider === p.id ? "✓" : ""}</b></button>)}</div><label>当前默认模型</label><select value={model} onChange={e => setModel(e.target.value)}>{models.map(m => <option key={m}>{m}</option>)}</select><div className="route-box"><b>智能路由已开启</b><p>深度分析使用强推理模型，标题改写等轻任务自动使用快速模型，兼顾质量与成本。</p><span>服务端加密保存密钥 · 支持用量与成本统计</span></div><button className="save" onClick={() => {flash(`已切换至 ${model}`); setPanel(false)}}>保存模型配置</button></aside></div>}
      {toast && <div className="toast">✓　{toast}</div>}
    </main>
  );
}
