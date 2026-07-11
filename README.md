# AI Berkshire Desktop

把 [ai-berkshire](https://github.com/xbtlin/ai-berkshire) 的投研 Skill 合集，包装成一个「登录后像打开一台 Mac」的网页应用。

- 前端：React + TypeScript + Vite + [React Flow](https://reactflow.dev/)（桌面图标画布）+ Tailwind
- 后端：Cloudflare Pages Functions（无需单独服务器）
- 存储：Cloudflare D1（报告元数据 + Markdown 正文）
- 认证：单密码 + HMAC 签名 Cookie（个人使用场景，没有做多用户系统）
- 模型：后台统一配置 API Key，支持 Claude / OpenAI / DeepSeek 切换

## 功能对应关系

| 你的需求 | 实现方式 |
|---|---|
| 打开网站像登录一台 mac，设置密码防滥用 | `LoginScreen` 锁屏页 + `/api/auth/login` 单密码校验 + HttpOnly Cookie |
| 中间是过去生成的报告，像打开的文件夹，可按日期/文件名排序 | `ReportsFolderWindow`，Finder 风格列表 + 排序 |
| 旁边 5 个技能像桌面图标，双击打开介绍 | React Flow 画布 + `DesktopIconNode` + `SkillInfoWindow` |
| 顶部搜索栏输入股票代码 + 选技能 → 生成报告 | `TopSearchBar` → `POST /api/reports` |
| 双击报告打开报告页，可浏览历史报告 | `ReportViewerWindow`，Markdown 渲染 |
| 后台统一配置 API Key，用户不用管 | Key 只存在 Cloudflare Pages 的 Secret 环境变量里，前端永远拿不到 |
| GitHub 推送到 Cloudflare 托管 | Cloudflare Pages 连 GitHub 仓库，自动构建部署 |

## 目录结构

```
├── src/                  前端源码
│   ├── components/       登录页、桌面、窗口、图标等组件
│   └── lib/               zustand store、api 客户端
├── functions/            Cloudflare Pages Functions（后端）
│   ├── _middleware.ts    拦截 /api/*，校验登录态
│   ├── api/
│   │   ├── auth/         登录、登出、查询登录态
│   │   ├── skills.ts     返回技能清单
│   │   └── reports/      报告的增删查
│   └── lib/
│       ├── env.ts         环境变量类型定义
│       ├── auth.ts        session cookie 签发/校验
│       ├── providers.ts   Claude/OpenAI/DeepSeek 统一调用
│       ├── prompt.ts      把 Claude Code 专属 skill 模板改写成可直接调用的 prompt
│       └── skills-data.ts 【自动生成，不要手改】
├── skills/                技能源文件（从 ai-berkshire 项目拷贝）
│   ├── manifest.json      技能元数据（图标、名称、说明）
│   └── *.md                技能的具体研究流程 prompt
├── migrations/0001_init.sql   D1 建表语句
├── scripts/generate-skills-data.mjs  构建期把 skills/ 打包进后端代码
└── wrangler.toml
```

## 关于技能模板的一点说明

`skills/*.md` 原本是 Claude Code 的 slash command，依赖 Task 工具做多 Agent 并行、且要求"写入本地文件"。
这套东西跑在 Cloudflare Functions 上没有文件系统也没有 Task 工具，所以 `functions/lib/prompt.ts`
会在原始模板后面追加一段"运行环境说明"，让模型把多 Agent 并行的步骤收敛成一次性、结构化的单轮输出，
并且优先用联网搜索获取真实数据（Claude 走的是 Anthropic 官方的 `web_search` 工具）。

以后你要新增技能：在 `skills/` 下加一个 `.md` 文件 + 在 `manifest.json` 里加一条元数据即可，
前端图标、后端调用会自动跟着 `manifest.json` 走，不需要改代码。

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量模板，填入你的密码和 API Key
cp .dev.vars.example .dev.vars

# 3. 生成技能数据 + 初始化本地 D1
npm run gen:skills
npm run db:migrate:local

# 4. 起两个终端：
#    一个跑前端 dev server（默认 5173，代理 /api 到 8788）
npm run dev
#    另一个跑 Cloudflare Functions 本地模拟（先要 npm run build 出 dist）
npm run build
npx wrangler pages dev dist --d1 DB=berkshire-desktop-db --local
```

## 部署到 Cloudflare Pages

1. **建 D1 数据库**
   ```bash
   npx wrangler login
   npx wrangler d1 create berkshire-desktop-db
   ```
   把返回的 `database_id` 填进 `wrangler.toml` 的 `[[d1_databases]]` 里。

2. **推到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "init: AI Berkshire Desktop"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/berkshire-desktop.git
   git push -u origin main
   ```

3. **在 Cloudflare 控制台连接仓库**
   - Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
   - 选中这个仓库
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 在 Settings → Functions → D1 database bindings 里把 `DB` 绑定到刚才建的数据库
     （或者确认 `wrangler.toml` 里的绑定生效）

4. **配置 Secret 环境变量**（Settings → Environment variables，选择 Encrypt/Secret）
   ```
   SITE_PASSWORD=你的登录密码
   SESSION_SECRET=一长串随机字符串
   DEFAULT_PROVIDER=claude
   ANTHROPIC_API_KEY=sk-ant-xxxx
   ANTHROPIC_MODEL=claude-sonnet-5
   # 按需再加 OPENAI_API_KEY / DEEPSEEK_API_KEY
   ```
   也可以用命令行：
   ```bash
   npx wrangler pages secret put SITE_PASSWORD --project-name berkshire-desktop
   npx wrangler pages secret put SESSION_SECRET --project-name berkshire-desktop
   npx wrangler pages secret put ANTHROPIC_API_KEY --project-name berkshire-desktop
   ```

5. **建线上表结构**
   ```bash
   npm run db:migrate:remote
   ```

6. 之后每次 `git push`，Cloudflare Pages 会自动重新构建部署。

## 已知限制 / 后续可以做的事

- 报告生成是**同步**调用（Function 里等模型返回再写库）。Cloudflare Workers 对 HTTP 请求本身没有硬性墙钟时长限制，
  只要浏览器标签页不关，慢一点也能等到；但如果关闭浏览器/断网，这次生成结果不会保留。想做成"关网页也继续跑"，
  可以把生成逻辑迁移到 [Cloudflare Workflows](https://developers.cloudflare.com/workflows/) 或 Queues。
- OpenAI 分支目前没接联网搜索工具（字段格式随官方 API 迭代较快，接入前建议对照你要用的模型的最新文档核实一遍）。
- 密码是明文比较（存在 Secret 里，没有落库），单人使用场景足够；如果以后要开放给团队用，建议换成真正的多用户体系。
- 桌面图标位置目前每次刷新会重置为默认网格布局（没有持久化拖拽后的坐标），如果想要"记住图标摆放位置"，
  可以把坐标存进 `localStorage` 或者一个新的 D1 表。

## 免责声明

本项目仅供学习和研究目的使用，所有报告内容由 AI 生成，不构成任何投资建议。
