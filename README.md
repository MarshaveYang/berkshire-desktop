# AI Berkshire Desktop

把 [ai-berkshire](https://github.com/xbtlin/ai-berkshire) 的投研 Skill 合集，包装成一个「登录后像打开一台 Mac」的网页应用。

- 前端：React + TypeScript + Vite + Tailwind，纯文字图标 + 磨砂玻璃质感
- 后端：Cloudflare Pages Functions（无需单独服务器）
- 存储：Cloudflare D1（报告元数据 + Markdown 正文）
- 认证：单密码 + HMAC 签名 Cookie（个人使用场景，没有做多用户系统）
- 模型：后台统一配置 API Key，**默认 DeepSeek**，Claude / OpenAI 作为可切换备选（后两者都支持真实联网搜索）
- 部署方式：**全程网页操作**——GitHub 网页上传或 GitHub Desktop 推代码，Cloudflare Dashboard 建库、配变量、连仓库，不需要装 wrangler CLI

## 界面交互说明

- 打开网站先看到锁屏页，输密码进桌面
- 桌面左上角是技能图标，**按英文 id 字母序**从左到右排列（industry-research → investment-checklist → investment-research → investment-team → private-company-research），视口不够宽会自动换到下一行
- 图标本身就是技能名的 4 个汉字（分两行显示），不用图形图标
- **单击**一个技能图标：激活视口正中央的搜索框，上方出现这个技能的用法提示（比如"请输入一只股票代码或公司名"）
- **双击**一个技能图标：打开这个技能的详细介绍窗口
- 搜索框里选好模型（DeepSeek/Claude/OpenAI），输入内容，点生成
- 搜索框下方会提示当前选中模型的简短状态（比如"DeepSeek 状态正常，非实时数据"）——这是静态文案，不是实时探活检测
- "研究报告"图标固定在右下角（类似 mac 默认垃圾桶的位置），双击打开 Finder 风格的报告列表，可按日期/文件名排序，双击某一份报告查看 Markdown 正文

## 目录结构

```
├── src/                  前端源码
│   ├── components/
│   │   ├── LoginScreen.tsx        锁屏登录页
│   │   ├── Desktop.tsx            桌面主界面（布局、图标排列）
│   │   ├── IconTile.tsx           纯文字四字图标组件
│   │   ├── CenterSearchBar.tsx    视口居中的搜索框
│   │   ├── WindowFrame.tsx        通用窗口外壳（拖拽、层级、红黄绿按钮）
│   │   ├── ReportsFolderWindow.tsx  报告列表（Finder 风格）
│   │   ├── ReportViewerWindow.tsx   报告详情（Markdown 渲染）
│   │   └── SkillInfoWindow.tsx      技能介绍
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
│       ├── providers.ts   DeepSeek/Claude/OpenAI 统一调用
│       ├── prompt.ts      把 Claude Code 专属 skill 模板改写成可直接调用的 prompt
│       └── skills-data.ts 【自动生成，不要手改】
├── skills/                技能源文件（从 ai-berkshire 项目拷贝）
│   ├── manifest.json      技能元数据（名称、用法提示、说明）
│   └── *.md                技能的具体研究流程 prompt
├── migrations/0001_init.sql   D1 建表语句（要在 D1 Console 里分条粘贴执行，见下文）
└── scripts/generate-skills-data.mjs  构建期把 skills/ 打包进后端代码
```

以后你要新增技能：在 `skills/` 下加一个 `.md` 文件 + 在 `manifest.json` 里加一条元数据（记得给 `name` 凑够 4 个汉字，图标才好看）即可，前端图标、后端调用会自动跟着 `manifest.json` 走，不需要改代码。

## 各模型当前的限制（重要，直接影响报告质量）

| Provider | 是否联网搜索 | 说明 |
|---|---|---|
| **DeepSeek（默认）** | ❌ 不联网 | 走标准 Chat Completions，只用模型自身知识回答。财务数据、股价、新闻可能是训练数据里的旧值。优点是便宜、中文效果好，适合先跑通流程、或者对时效性要求不高的产业/框架类分析。 |
| **Claude** | ✅ 唯一联网 | 接的是 Anthropic 官方 `web_search` 工具，能真的去抓最新股价、财报、新闻。**如果要的是真正能打的深度研报，目前只有这个分支靠谱**，成本相对更高。 |
| **OpenAI** | ✅ 联网 | 接的是 Responses API 的 `web_search` 工具（不是 Chat Completions），需要 `gpt-5.4`/`gpt-5.5` 这类支持该工具的模型，普通 API Key 即可，不需要额外申请权限。 |

**实际建议**：日常用 DeepSeek 便宜地跑，遇到需要认真做决策的标的，切到 Claude 或 OpenAI 让它联网核实一遍数据再看结论。

## 部署到 Cloudflare Pages（全程网页操作，不需要 wrangler CLI）

### 1. 代码进 GitHub

**方式 A：GitHub 网页上传** —— 建一个空仓库 → Add file → Upload files → 把项目文件夹内容拖进去 → Commit。

**方式 B：GitHub Desktop** —— File → Add Local Repository → 选文件夹 → 创建仓库 → Publish repository。以后改了代码，在 GitHub Desktop 里能看到 diff，Commit + Push 两步就行。

### 2. Cloudflare Pages 连仓库

Dashboard → Workers & Pages → Create → Pages → Connect to Git → 选仓库：
- Build command: `npm run build`
- Build output directory: `dist`

### 3. 建 D1 数据库并建表（纯网页）

Dashboard → Storage & Databases → D1 → Create database，起个名字（比如 `berkshire-desktop-db`）。

进数据库 → **Console** 标签页。**注意：D1 的网页 Console 一次只能执行一条 SQL 语句**，把 `migrations/0001_init.sql` 拆成下面 4 条，依次粘贴执行：

```sql
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL,
  model TEXT,
  content TEXT,
  error_message TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
```sql
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
```
```sql
CREATE INDEX IF NOT EXISTS idx_reports_skill_id ON reports (skill_id);
```
```sql
CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports (ticker);
```

### 4. 绑定 D1 到 Pages 项目

Pages 项目 → Settings → Bindings → Add → D1 database：
- Variable name 必须填 `DB`（代码里 `env.DB` 是写死的）
- 选刚才建的数据库

> 项目里**没有 `wrangler.toml`**，所有绑定和环境变量都通过这里的 Dashboard 管理——之前如果你的仓库里还留着旧版本的 `wrangler.toml`，记得在 GitHub 网页上把它删掉提交，否则 Cloudflare 会认为配置由这个文件接管，Dashboard 的环境变量面板会被锁成只读。

### 5. 配置环境变量

Pages 项目 → Settings → Environment variables，建议全部选 **Secret**（加密）：
```
SITE_PASSWORD=你的登录密码
SESSION_SECRET=一长串随机字符串
DEFAULT_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_MODEL=deepseek-chat
```
想用联网搜索能力时再加：
```
ANTHROPIC_API_KEY=sk-ant-xxxx
ANTHROPIC_MODEL=claude-sonnet-5
```
按需再加 `OPENAI_API_KEY`（记得 `OPENAI_MODEL` 要填支持 Responses API `web_search` 工具的模型，比如 `gpt-5.4`）。

### 6. 重新部署

改完 Bindings/环境变量后，回 Deployments 标签，对最近一次部署点 **Retry deployment** 让配置生效。

打开 `你的项目名.pages.dev`，输密码进桌面，单击一个技能图标，输入内容试着生成一份报告。

## 已知限制 / 后续可以做的事

- 报告生成是**同步**调用（Function 里等模型返回再写库）。Cloudflare Workers 对 HTTP 请求本身没有硬性墙钟时长限制，只要浏览器标签页不关，慢一点也能等到；但如果关闭浏览器/断网，这次生成结果不会保留。想做成"关网页也继续跑"，可以后续迁移到 Cloudflare Workflows 或 Queues。
- "模型状态"那行文字是静态文案，不是每次都去实际探活；如果哪个 Provider 的 Key 失效了，要等真的生成报告失败才会看到错误提示。
- 桌面图标目前是固定按字母序排列，不支持拖拽自定义位置（原本 React Flow 方案支持拖拽，但为了实现"自动响应式换行、稳定的字母序"，换成了普通响应式布局，两者暂时不可兼得）。
- 密码是明文比较（存在 Secret 里，没有落库），单人使用场景足够；如果以后要开放给团队用，建议换成真正的多用户体系。

## 免责声明

本项目仅供学习和研究目的使用，所有报告内容由 AI 生成，不构成任何投资建议。

## 本地构建（可选，主要用来自查代码有没有写错）

项目的主路径是"改完直接推 GitHub，让 Cloudflare 在云端构建"，本地环境不是必须的。但如果想在推送前自己先跑一遍确认没有明显错误，可以：

```bash
npm install
npm run build
```

`npm run build` 会依次做三件事：把 `skills/` 目录打包进后端代码（`gen:skills`）、跑一遍 TypeScript 类型检查（`tsc -b`）、最后用 Vite 打包出 `dist/` 目录。这一步能跑通，基本就能保证 Cloudflare 那边的构建也不会失败。

如果只是想看看界面改动的样子，可以用：

```bash
npm run dev
```

会在 `http://localhost:5173` 起一个开发服务器，能看到页面布局、样式、交互效果。**但登录、生成报告这些需要调 `/api/*` 的功能在这个模式下会报错**——因为 `/api` 后端是 Cloudflare Pages Functions，本地 Vite 开发服务器不会启动它，这是预期行为，不是 bug。真正端到端的功能验证，还是要推到 Cloudflare 上用 `*.pages.dev` 域名测。

`dist/` 目录、`node_modules/` 都在 `.gitignore` 里，不会被提交，也不需要手动清理。

