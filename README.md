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

## ForgeOps CI/CD 资源下发

仓库内置 `.github/workflows/deploy.yml`，供 CSS-Deploy-Center 调用。控制台下发固定的轻量、标准、增强资源档位，流水线对 CPU、内存、端口和绑定地址进行二次白名单校验，再通过 SSH 在 `/opt/media-platform/releases` 创建不可变版本。

首次发布前，在服务器准备生产密钥：

```bash
sudo install -d -m 750 /opt/media-platform/shared
sudo cp .env.example /opt/media-platform/shared/.env
sudo editor /opt/media-platform/shared/.env
```

必须修改 `POSTGRES_PASSWORD`。模型 API Key 也只放在这个服务器文件里。GitHub 仓库需配置 `DEPLOY_HOST`、`DEPLOY_PORT`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`、`DEPLOY_HOST_KEY`。当部署目标是 Tailscale 内网服务器时，还需配置 `TS_OAUTH_CLIENT_ID` 和 `TS_OAUTH_SECRET`；工作流会先临时加入 tailnet，再通过 SSH 部署。

默认入口为共享公网 IP 的 `8080` 端口，需要在阿里云安全组开放该端口。若选择“统一 Nginx 网关”，服务只监听 `127.0.0.1:8080`，宿主机 Nginx 可转发到该地址，此时公网只需开放 `80/443`。

## SSH 主机密钥变更

如果部署出现 `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`，不要关闭 SSH 严格校验。先通过阿里云控制台核对实例及 `/etc/ssh/ssh_host_ed25519_key.pub` 指纹，再同步更新 `DEPLOY_HOST` 和 `DEPLOY_HOST_KEY`。完整处置步骤见 [操作手册](docs/操作手册.md)。
