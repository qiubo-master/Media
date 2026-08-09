# Media｜序章自媒体中台

面向个人 IP 与自媒体团队的内容经营系统，连接 IP 定位、选题策划、内容生产、素材管理、账号矩阵、获客转化和 AI 数据决策。

## 自托管架构

- Next.js 16 应用服务
- PostgreSQL 17 持久化数据库
- Nginx 反向代理
- Docker Compose 统一编排
- Argon2 密码哈希与数据库会话
- 管理员/成员角色、成员停用与登录限流

数据库只在 Docker 内部网络开放，不映射公网端口。所有商用模型密钥通过服务器环境变量注入，不写入代码或数据库。

## 本地开发

```bash
pnpm install
pnpm dev
```

本地需提供可连接的 PostgreSQL，并将 `.env.example` 复制为 `.env` 后修改配置。

## 阿里云部署

服务器需安装 Docker Engine 与 Docker Compose 插件：

```bash
cp .env.example .env
# 修改 .env，至少设置数据库强密码和访问地址
docker compose up -d --build
```

首次打开网站时会自动进入管理员初始化页面。第一位用户成为管理员，此后初始化入口自动关闭。

生产环境建议绑定域名并启用 HTTPS，只开放安全组的 `22`、`80`、`443` 端口，PostgreSQL 的 `5432` 不对公网开放。
