import { redirect } from "next/navigation";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.role !== "admin") redirect("/");
  const members = process.env.LOCAL_DEMO_MODE === "true"
    ? [{ ...current, createdAt: new Date() }]
    : await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt }).from(users).orderBy(asc(users.createdAt));
  return <main className="admin-page"><header><Link href="/">← 返回工作台</Link><div><h1>用户与权限</h1><p>管理员可以邀请成员、分配角色并停用账号。</p></div></header><section className="admin-card"><h2>添加成员</h2><form action="/api/admin/users" method="post" className="member-form"><input name="name" required minLength={2} placeholder="姓名"/><input name="email" required type="email" placeholder="邮箱"/><input name="password" required type="password" minLength={12} placeholder="初始密码（至少12位）"/><select name="role"><option value="member">成员</option><option value="admin">管理员</option></select><button>创建账号</button></form></section><section className="admin-card"><div className="member-table head"><span>用户</span><span>角色</span><span>状态</span><span>操作</span></div>{members.map(member => <div className="member-table" key={member.id}><span><b>{member.name}</b><small>{member.email}</small></span><span>{member.role === "admin" ? "管理员" : "成员"}</span><span className={member.active ? "ok" : "off"}>{member.active ? "正常" : "已停用"}</span><span>{member.id !== current.id && <form action={`/api/admin/users/${member.id}/toggle`} method="post"><button>{member.active ? "停用" : "启用"}</button></form>}</span></div>)}</section></main>;
}
