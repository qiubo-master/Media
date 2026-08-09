# Media｜序章自媒体中台

面向个人 IP 与自媒体团队的内容经营系统，连接 IP 定位、选题策划、内容生产、素材管理、账号矩阵、获客转化和 AI 数据决策。

## 当前能力

- 自媒体经营数据总览
- 内容价值与账号矩阵分析
- AI 经营建议与行动任务
- OpenAI、Anthropic、Gemini、DeepSeek 多模型切换
- 统一服务端大模型 API 路由
- Cloudflare D1 数据库与 R2 素材存储结构
- 响应式网页界面

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

复制 `.env.example` 为本地环境配置文件，并在服务端填写需要使用的模型 API 密钥。不要将真实密钥提交到版本库。

## 构建

```bash
npm run build
```

项目采用 Vinext 构建，可部署至 Cloudflare Workers 兼容环境。
