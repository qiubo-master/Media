"use client";

import { useMemo, useState } from "react";

const nav = ["经营总览", "IP定位", "选题策划", "内容生产", "素材资产", "账号矩阵", "获客中心", "客户服务", "数据洞察"];

const tasks = [
  { title: "发布｜小红书：普通人做IP最容易踩的3个坑", meta: "10:30 · 主理人IP", tone: "purple" },
  { title: "审核｜视频号口播《内容不是越多越好》", meta: "今天 · 等待确认", tone: "amber" },
  { title: "跟进｜7位领取定位清单的新线索", meta: "3位高意向 · 建议今天联系", tone: "green" },
];

const contents = [
  { title: "为什么你发了100条内容，还是没有客户？", platform: "抖音", type: "痛点口播", score: 92, leads: 31, trend: "+46%" },
  { title: "从0到1做个人IP的定位检查清单", platform: "小红书", type: "资料型", score: 88, leads: 24, trend: "+31%" },
  { title: "客户案例：重新定位后，咨询量发生了什么", platform: "视频号", type: "案例型", score: 84, leads: 18, trend: "+22%" },
];

const providers = [
  { id: "openai", name: "OpenAI", models: ["gpt-5.2", "gpt-5-mini"] },
  { id: "anthropic", name: "Anthropic", models: ["claude-sonnet-4-5", "claude-haiku-4-5"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-2.5-pro", "gemini-2.5-flash"] },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
];

export default function DashboardClient({ userName = "林野", isAdmin = false }: { userName?: string; isAdmin?: boolean }) {
  const [active, setActive] = useState("经营总览");
  const [range, setRange] = useState("近7天");
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
        <div className="brand"><span className="brand-mark">序</span><div><strong>序章</strong><small>Creator OS</small></div></div>
        <button className="workspace"><span className="avatar">林</span><span><b>林野 · 主理人IP</b><small>个人工作空间</small></span><i>⌄</i></button>
        <nav>
          <p className="nav-label">工作空间</p>
          {nav.slice(0, 1).map((item) => <button key={item} onClick={() => setActive(item)} className={active === item ? "active" : ""}><span>⌂</span>{item}</button>)}
          <p className="nav-label">内容增长</p>
          {nav.slice(1, 5).map((item, i) => <button key={item} onClick={() => setActive(item)} className={active === item ? "active" : ""}><span>{["◎", "◇", "✦", "▧"][i]}</span>{item}{item === "选题策划" && <em>12</em>}</button>)}
          <p className="nav-label">经营转化</p>
          {nav.slice(5).map((item, i) => <button key={item} onClick={() => setActive(item)} className={active === item ? "active" : ""}><span>{["◉", "⌁", "♡", "⌁"][i]}</span>{item}</button>)}
        </nav>
        <div className="sidebar-bottom">{isAdmin && <a className="admin-link" href="/admin/users">♙　用户与权限管理</a>}<button onClick={() => setPanel(true)}>⚙　模型与系统设置</button><form action="/api/auth/logout" method="post"><button type="submit">↪　退出登录</button></form><div className="usage"><span>本月 AI 用量</span><b>68%</b><i><u /></i><small>68.2万 / 100万 Tokens</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="status-dot" />所有账号运行正常</div><div className="top-actions"><button aria-label="搜索">⌕</button><button aria-label="通知">♢<i /></button><button onClick={() => setPanel(true)} className="model-pill"><span>✦</span>{providers.find(p => p.id === provider)?.name} · {model}<b>⌄</b></button><span className="user-avatar">{userName.slice(0, 1)}</span></div></header>

        <div className="page">
          <div className="welcome"><div><p>你的内容经营工作台</p><h1>你好，{userName} <span>👋</span></h1><h2>这是你的内容生意全景，今天有 <b>3 件事</b>值得优先处理。</h2></div><div className="range">{["近7天", "近30天", "本季度"].map(r => <button onClick={() => setRange(r)} className={range === r ? "active" : ""} key={r}>{r}</button>)}</div></div>

          <section className="hero-grid">
            <article className="kpi-card"><div className="kpi-head"><span>总粉丝</span><i>较上期</i></div><strong>128,640</strong><p className="up">↗ 12.6% <span>净增 3,842</span></p><div className="spark purple"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="kpi-card"><div className="kpi-head"><span>内容曝光</span><i>全平台</i></div><strong>286.4万</strong><p className="up">↗ 18.3% <span>高于近30日均值</span></p><div className="spark blue"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="kpi-card"><div className="kpi-head"><span>有效线索</span><i>私域获客</i></div><strong>186</strong><p className="up">↗ 24.1% <span>其中高意向 42</span></p><div className="spark green"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="kpi-card revenue"><div className="kpi-head"><span>内容归因收入</span><i>已确认</i></div><strong>¥ 84,260</strong><p className="up">↗ 16.8% <span>ROI 4.7</span></p><div className="spark coral"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
          </section>

          <section className="main-grid">
            <article className="card performance"><div className="card-title"><div><h3>增长趋势</h3><p>曝光、互动与有效线索的变化</p></div><div className="legend"><i className="l-purple"/>曝光 <i className="l-green"/>线索</div></div><div className="chart"><div className="axis"><span>300万</span><span>200万</span><span>100万</span><span>0</span></div><div className="plot"><div className="gridline a"/><div className="gridline b"/><div className="gridline c"/><div className="area-chart"><span/><span/><span/><span/><span/><span/><span/></div><div className="line-chart"><i/><i/><i/><i/><i/><i/><i/></div><div className="dates"><span>8/04</span><span>8/05</span><span>8/06</span><span>8/07</span><span>8/08</span><span>8/09</span><span>8/10</span></div></div></div></article>

            <article className="card ai-card"><div className="ai-top"><span>✦</span><div><h3>AI 经营参谋</h3><p>基于近30天数据生成</p></div><button>···</button></div><div className="insight"><label>本周关键发现</label><h4>案例型内容正在成为你的高价值获客入口</h4><p>案例内容的有效线索率比平均值高 <b>38%</b>，但当前发布占比仅 18%。</p><div className="confidence"><span>置信度：较高</span><i><u/></i><em>样本 24 条</em></div></div><div className="suggestion"><b>建议行动</b><p>下周将案例型内容占比提升至 <strong>30%</strong>，优先复用「问题—过程—结果」结构。</p></div><button className="primary" onClick={() => flash("已生成下周的 6 个案例型选题")}>生成下周选题 <span>→</span></button></article>
          </section>

          <section className="lower-grid">
            <article className="card tasks"><div className="card-title"><div><h3>今日优先事项</h3><p>按经营价值智能排序</p></div><button>查看全部 →</button></div>{tasks.map((task, i) => <div className="task" key={task.title}><button onClick={() => flash("任务已标记完成")}>✓</button><span className={`task-icon ${task.tone}`}>{["↗", "▶", "♙"][i]}</span><div><b>{task.title}</b><small>{task.meta}</small></div><i>›</i></div>)}</article>
            <article className="card platform"><div className="card-title"><div><h3>账号矩阵</h3><p>近7天核心表现</p></div><button>管理账号 →</button></div><div className="platform-row"><span className="red">音</span><b>抖音<small>42.8万曝光</small></b><em>+21.4%</em><i>62 条线索</i></div><div className="platform-row"><span className="pink">书</span><b>小红书<small>18.6万曝光</small></b><em>+32.8%</em><i>78 条线索</i></div><div className="platform-row"><span className="green">视</span><b>视频号<small>12.4万曝光</small></b><em>+9.6%</em><i>46 条线索</i></div></article>
          </section>

          <section className="card top-content"><div className="card-title"><div><h3>高价值内容</h3><p>不只看流量，更关注真实获客</p></div><button>内容分析 →</button></div><div className="table"><div className="tr th"><span>内容</span><span>平台 / 类型</span><span>价值评分</span><span>有效线索</span><span>趋势</span></div>{contents.map((c, i) => <div className="tr" key={c.title}><span className="content-name"><i>{i + 1}</i><b>{c.title}</b></span><span><b>{c.platform}</b><small>{c.type}</small></span><span><strong>{c.score}</strong> / 100</span><span><b>{c.leads}</b></span><span><em>{c.trend}</em></span></div>)}</div></section>
        </div>
      </section>

      {panel && <div className="overlay" onMouseDown={() => setPanel(false)}><aside className="settings" onMouseDown={e => e.stopPropagation()}><div className="settings-head"><div><span>✦</span><h3>大模型中枢<small>为不同任务选择最合适的模型</small></h3></div><button onClick={() => setPanel(false)}>×</button></div><label>服务商</label><div className="providers">{providers.map(p => <button key={p.id} className={provider === p.id ? "active" : ""} onClick={() => {setProvider(p.id); setModel(p.models[0]);}}><i>{p.name.slice(0,1)}</i><span>{p.name}<small>{p.models.length} 个可用模型</small></span><b>{provider === p.id ? "✓" : ""}</b></button>)}</div><label>当前默认模型</label><select value={model} onChange={e => setModel(e.target.value)}>{models.map(m => <option key={m}>{m}</option>)}</select><div className="route-box"><b>智能路由已开启</b><p>深度分析使用强推理模型，标题改写等轻任务自动使用快速模型，兼顾质量与成本。</p><span>服务端加密保存密钥 · 支持用量与成本统计</span></div><button className="save" onClick={() => {flash(`已切换至 ${model}`); setPanel(false)}}>保存模型配置</button></aside></div>}
      {toast && <div className="toast">✓　{toast}</div>}
    </main>
  );
}
