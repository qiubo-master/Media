import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiInsights, assets, contents, ips, leads, serviceCases, topics } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import SubmitButton from "@/app/components/submit-button";
import "../../accounts/module.css";

export const dynamic = "force-dynamic";
const titles: Record<string, [string, string]> = {
  positioning: ["IP 定位", "沉淀受众、人设、价值主张和内容支柱，作为所有 AI 任务的基础上下文。"], topics: ["选题策划", "建立选题池、评分与排期，让内容生产有稳定来源。"],
  content: ["内容生产", "管理脚本、图文、视频和发布状态。"], assets: ["素材与剪辑", "先管理素材元数据；接入阿里云 OSS 后支持原文件、转写和剪辑任务。"],
  leads: ["获客中心", "统一记录线索来源、意向、评分和下一次跟进。"], service: ["客户服务", "把成交后的交付事项、负责人和结果沉淀下来。"], insights: ["数据洞察", "保存 AI 复盘结论、证据、置信度及下一步行动。"],
};

export default async function ModulePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ ok?: string; error?: string; q?: string; sort?: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const { module } = await params; if (!titles[module]) notFound(); const query = await searchParams;
  const [profile] = await db.select().from(ips).where(eq(ips.ownerId, user.id)).limit(1);
  const items = profile ? await loadItems(module, profile.id) : [];
  const keyword = (query.q || "").trim().toLowerCase();
  const filteredItems = items.filter((item) => !keyword || `${itemTitle(item)} ${itemSubtitle(item)} ${itemStatus(item)}`.toLowerCase().includes(keyword));
  if (query.sort === "oldest") filteredItems.reverse();
  const leadOptions = profile ? await db.select({ id: leads.id, name: leads.name, contact: leads.contact }).from(leads).where(eq(leads.ipId, profile.id)).orderBy(desc(leads.createdAt)).limit(100) : [];
  return <main className="module-page"><header className="module-header"><div><Link href="/">← 返回经营总览</Link><p>业务模块</p><h1>{titles[module][0]}</h1><span>{titles[module][1]}</span></div><div className="module-badge">{items.length} 条记录</div></header>{query.ok && <div className="notice success">保存成功，页面已自动刷新。</div>}{query.error && <div className="notice error">保存失败，请检查必填项后重试。</div>}
    <section className="module-workspace"><article className="module-card module-data"><h2>{module === "positioning" ? "当前定位" : "数据列表"}</h2><p>支持关键词筛选和时间排序。</p><form className="filter-form" method="get"><input name="q" defaultValue={query.q || ""} placeholder="搜索标题、内容或状态"/><select name="sort" defaultValue={query.sort || "newest"}><option value="newest">最新优先</option><option value="oldest">最早优先</option></select><button type="submit">筛选</button></form>
      {!filteredItems.length ? <div className="empty">没有符合条件的记录。</div> : <div className="module-records">{filteredItems.map((item) => <div key={String(item.id)}><span><b>{itemTitle(item)}</b><small>{itemSubtitle(item)}</small></span><span>{itemStatus(item)}</span><i>已入库</i></div>)}</div>}</article>
      <aside className="module-card module-editor"><h2>{module === "positioning" ? "编辑定位档案" : "新增记录"}</h2><p>保存后会自动返回本页面并刷新左侧数据。</p><ModuleForm module={module} profile={profile} leads={leadOptions} /><div className="csv-help"><b>下一步自动化</b><small>{automationCopy(module)}</small></div></aside></section></main>;
}

async function loadItems(module: string, ipId: string) {
  if (module === "positioning") return db.select().from(ips).where(eq(ips.id, ipId));
  if (module === "topics") return db.select().from(topics).where(eq(topics.ipId, ipId)).orderBy(desc(topics.createdAt)).limit(50);
  if (module === "content") return db.select().from(contents).where(eq(contents.ipId, ipId)).orderBy(desc(contents.createdAt)).limit(50);
  if (module === "assets") return db.select().from(assets).where(eq(assets.ipId, ipId)).orderBy(desc(assets.createdAt)).limit(50);
  if (module === "leads") return db.select().from(leads).where(eq(leads.ipId, ipId)).orderBy(desc(leads.createdAt)).limit(50);
  if (module === "service") return db.select({ id: serviceCases.id, title: serviceCases.title, status: serviceCases.status, priority: serviceCases.priority, createdAt: serviceCases.createdAt }).from(serviceCases).innerJoin(leads, eq(serviceCases.leadId, leads.id)).where(eq(leads.ipId, ipId)).orderBy(desc(serviceCases.createdAt)).limit(50);
  if (module === "insights") return db.select().from(aiInsights).where(eq(aiInsights.ipId, ipId)).orderBy(desc(aiInsights.createdAt)).limit(50);
  return [];
}

function ModuleForm({ module, profile, leads: leadOptions }: { module: string; profile: typeof ips.$inferSelect | undefined; leads: { id: string; name: string | null; contact: string | null }[] }) {
  return <form className="stack-form" action={`/api/modules/${module}`} method="post">
    {module === "positioning" && <><label>IP 名称<input name="name" required defaultValue={profile?.name || ""} /></label><label>一句话定位<input name="positioning" defaultValue={profile?.positioning || ""} /></label><label>目标受众<input name="audience" defaultValue={profile?.audience || ""} /></label><label>价值主张<input name="valueProposition" defaultValue={profile?.valueProposition || ""} /></label></>}
    {module === "topics" && <><label>选题标题<input name="title" required /></label><label>切入角度<input name="angle" /></label><label>受众痛点<input name="audiencePain" /></label><label>内容形式<select name="contentType"><option>口播</option><option>图文</option><option>长视频</option><option>直播</option></select></label></>}
    {module === "content" && <><label>作品标题<input name="title" required /></label><label>内容形式<select name="format"><option>短视频</option><option>图文</option><option>直播</option><option>长视频</option></select></label><label>状态<select name="status"><option value="draft">草稿</option><option value="review">待审核</option><option value="ready">待发布</option><option value="published">已发布</option></select></label></>}
    {module === "assets" && <><label>素材名称<input name="name" required /></label><label>素材类型<select name="kind"><option value="video">视频</option><option value="image">图片</option><option value="audio">音频</option><option value="document">文档</option></select></label><label>来源链接<input name="sourceUrl" type="url" /></label></>}
    {module === "leads" && <><label>客户称呼<input name="name" /></label><label>联系方式<input name="contact" required /></label><label>来源渠道<input name="channel" placeholder="抖音私信 / 小红书 / 表单" /></label><label>意向描述<input name="intent" /></label></>}
    {module === "service" && <><label>关联客户<select name="leadId" required><option value="">请选择</option>{leadOptions.map((lead) => <option value={lead.id} key={lead.id}>{lead.name || lead.contact}</option>)}</select></label><label>服务事项<input name="title" required /></label><label>优先级<select name="priority"><option value="normal">普通</option><option value="high">高</option><option value="urgent">紧急</option></select></label></>}
    {module === "insights" && <><label>洞察标题<input name="title" required /></label><label>分析结论<input name="summary" required /></label><label>建议行动<input name="recommendation" /></label></>}
    <SubmitButton>保存</SubmitButton>
  </form>;
}

function automationCopy(module: string) { const copy: Record<string, string> = { positioning: "定位问卷、竞品对比与大模型定位建议。", topics: "热点抓取、历史高价值内容学习和周选题自动生成。", content: "脚本生成、审核流和跨平台改写。", assets: "OSS 上传、语音转写、智能切片和剪辑队列。", leads: "私信/表单接入、线索评分和自动提醒。", service: "服务模板、SLA 提醒、满意度与复购预测。", insights: "基于真实指标生成证据链、预测和行动任务。" }; return copy[module]; }
function itemTitle(item: Record<string, unknown>) { return String(item.title || item.name || "未命名记录"); }
function itemSubtitle(item: Record<string, unknown>) { return String(item.positioning || item.angle || item.contact || item.summary || item.sourceUrl || item.format || "已保存至业务数据库"); }
function itemStatus(item: Record<string, unknown>) { return String(item.status || item.stage || item.priority || "有效"); }
