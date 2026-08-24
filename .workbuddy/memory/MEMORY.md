# Media 项目长期笔记

## 项目概览
- 名称：Media｜序章自媒体中台（package.json: `xuzhang-creator-os`）
- 定位：面向个人 IP 与自媒体团队的内容经营系统（IP 定位、选题、内容生产、素材、账号矩阵、获客转化、AI 数据决策）
- 技术栈：Next.js 16 + React 19 + Drizzle ORM 0.45 + PostgreSQL 17 + Nginx + Docker Compose + Tailwind 4
- 包管理：pnpm 11（workspace 模式），Node >=22.13
- 密码哈希：@node-rs/argon2；会话：数据库 sessions 表（HttpOnly cookie）

## 部署形态
- Docker Compose 四服务：`db`(postgres:17-alpine) → `migrate`(一次性) → `app`(next runner) → `nginx`(1.27)
- 数据卷：`media_creator_os_postgres_data`（PostgreSQL 数据，不映射公网端口）
- 对外端口：nginx 监听 `0.0.0.0:8080:80`（环境变量 MEDIA_HOST_PORT 可改）
- 生产环境密钥文件：服务器上 `/opt/media-platform/shared/.env`（含 POSTGRES_PASSWORD、各模型 API Key）
- 本地开发：`cp .env.example .env`，需自备 PostgreSQL，`pnpm dev`

## 认证机制（重要）
- **无预置账号密码**。登录页 `app/login/page.tsx` 动态判断：
  - `users` 表为空 → 显示"创建管理员账号"表单，POST 到 `/api/auth/bootstrap`，第一位用户自动成 admin，之后该入口永久关闭
  - 已有用户 → 显示"登录序章"，POST 到 `/api/auth/login`
- 密码用 Argon2 哈希存于 `users.password_hash`，**明文不在任何文件、不可逆**
- 登录限流：15 分钟内同 IP/邮箱失败 ≥8 次锁定（auth_events 表）
- 忘记密码处理：需 SSH 进服务器，用 argon2 生成新 hash 更新 users 表，或清空 users 表重新走 bootstrap

## 关键目录
- `app/` Next.js App Router：api/(auth, accounts, admin, ai, health)、页面(login, accounts, modules, dashboard-client)
- `db/` schema.ts(全表定义) + index.ts(postgres-js 连接) + migrations/(4个SQL)
- `lib/` auth/request 工具
- `deploy/nginx.conf` 反代配置
- `scripts/migrate.mjs` 迁移脚本（drizzle-kit generate 产物在 `drizzle/`）

## 数据表（db/schema.ts）
users, sessions, auth_events, ips, accounts, contents, metrics, account_daily_metrics, import_batches, platform_connections, topics, assets, leads, service_cases, ai_insights, action_tasks, model_configs
