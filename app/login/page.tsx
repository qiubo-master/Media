import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await getCurrentUser()) redirect("/");
  const [result] = await db.select({ value: count() }).from(users);
  const firstRun = (result?.value ?? 0) === 0;
  const query = await searchParams;
  const error = query.error === "locked" ? "尝试次数过多，请15分钟后再试。" : query.error === "weak" ? "请填写有效信息，密码至少12位。" : query.error ? "邮箱或密码不正确。" : "";
  return <main className="auth-page"><section className="auth-brand"><div className="auth-logo">序</div><p>CREATOR OS</p><h1>让每一条内容，<br/>都指向增长。</h1><div className="auth-points"><span>✦ IP 定位与内容策略</span><span>⌁ 多账号数据与获客归因</span><span>◎ AI 经营分析与下一步建议</span></div></section><section className="auth-panel"><div className="auth-box"><small>{firstRun ? "首次部署" : "欢迎回来"}</small><h2>{firstRun ? "创建管理员账号" : "登录序章"}</h2><p>{firstRun ? "第一位用户将成为系统管理员，初始化后该入口自动关闭。" : "使用你的工作账号继续管理内容生意。"}</p>{error && <div className="auth-error">{error}</div>}<form action={firstRun ? "/api/auth/bootstrap" : "/api/auth/login"} method="post">{firstRun && <label>姓名<input name="name" minLength={2} required placeholder="你的姓名" autoComplete="name"/></label>}<label>邮箱<input name="email" type="email" required placeholder="name@company.com" autoComplete="email"/></label><label>密码<input name="password" type="password" minLength={firstRun ? 12 : 1} required placeholder={firstRun ? "至少12位" : "输入密码"} autoComplete={firstRun ? "new-password" : "current-password"}/></label><button type="submit">{firstRun ? "创建并进入系统" : "安全登录"}</button></form><div className="auth-security"><b>安全保障</b><span>Argon2 密码哈希</span><span>HttpOnly 会话</span><span>登录限流</span></div></div></section></main>;
}
