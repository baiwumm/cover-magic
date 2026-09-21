# Cover Magic v2.0 重构实施计划

> **本文件是自包含的执行输入。** 在新窗口打开项目时，只需说「按 `docs/implementation-plan.md` 从 Phase N 开始执行」即可接手，不依赖任何历史对话。
> 配套阅读顺序：`AGENTS.md`（约束，自动加载）→ 本文件（任务）→ `docs/requirements.md`（背景与证据）。
> 状态：**Phase 0–6 已完成并提交**（Phase 6 于 2026-09-21 过质量门），Phase 7–8 待执行。每阶段结束必须过 `AGENTS.md` 的质量门（§质量门）后提交一个 commit。

---

## 0. 决策基线（已拍板，不可再议）

### 技术栈
| 编号 | 决策 |
|---|---|
| D-01 | Next.js 16（App Router）+ React 19 + TypeScript 5.9，`output: 'export'` 纯静态导出 |
| D-02 | UI 全量 shadcn/ui（Radix 底座）+ Tailwind CSS v4。**不用 HeroUI** |
| D-03 | 界面图标 `lucide-react`；封面画面图标继续用 Iconify（两者职责不混用） |
| D-04 | 取色器：`react-colorful` + shadcn `Popover` 组合。**官方注册表确认无取色器**（实测：63 项 `registry:ui`，0 个 color 命中；社区源 `shadcn.io` 401 需付费、`originui` 该路径重定向到文档页、`base-ui` 无 `/r/index.json`）→ 属"库缺能力则引专门库"，不手写取色器 |
| D-05 | 上传：`react-dropzone` + shadcn `Item`/`Field` 组合。**官方注册表同样无 dropzone/文件上传**（同一实测）→ 引库，不手写拖拽事件 |
| D-06 | 状态：`zustand` + `zundo`（撤销重做）+ `immer`。不用 Context 手搓 store |
| D-07 | 动效 `motion`；落地页背景移植 `ogl` 光束。二者是仅有的视觉重依赖 |
| D-08 | 深浅色 `next-themes` + Tailwind `dark:` 变体，主题走 shadcn 默认中性（黑白灰 + OKLCH） |
| D-09 | 代码检查 Biome；包管理 pnpm；测试 vitest（仅 `lib/` 纯函数） |
| D-10 | 部署 Cloudflare Workers Static Assets。只产出 `wrangler.jsonc` + `deploy` 脚本，不代为登录/部署 |
| D-11 | **无服务端**：不用 Route Handler / Server Action / middleware / ImageResponse / ISR / `next/image` 默认 loader |
| D-12 | **无 SEO 工作、无统计代码**（CF 托管自带统计，`@vercel/analytics` 与 umami 全部不迁移） |
| D-13 | 字体：`@font-face` + `public/fonts/*.woff2` 子集入仓（照搬 better-admin 模式），**不用 `next/font/google`**。族名沿用 `'Maple Mono CN'` |
| D-14 | 字体必须提供 **400 + 700 两个字重**，以此删除 v1 的 `strokeText` 伪加粗 hack |

### 产品与交互
| 编号 | 决策 |
|---|---|
| D-15 | 落地页 `/`：Hero 主按钮「开始设计」→ `/editor`（交互与形态参考 ogimg `components/landing/hero.tsx` 的 `Start Designing` → `/editor`） |
| D-16 | 制作页 `/editor`：顶栏 + 左工具栏 Tabs + 中央画布三栏；元素定位靠**画布直接拖拽**，不靠 XY 滑块 |
| D-17 | 元素模型：**固定槽位** Scene（background / logo / title / subtitle / watermark），不做通用图层 |
| D-18 | 支持多行文本 + 自动换行（含中文禁则）+ 自适应字号 + 对齐/字间距/行高 |
| D-19 | 模板系统：`data/templates.ts` 纯 JSON，首版 **8–12 套**（由代理生成、用户筛选）；缩略图**运行时**用 `drawScene` 离屏渲染生成，无构建步骤 |
| D-20 | 进入 `/editor` 的初始状态 = 套用一套精选默认模板（不是空白 Scene） |
| D-21 | 平台预设扩到 **14 档**并按组分类；选中预设**只填值、不锁输入**（见 R-21） |
| D-22 | 不考虑移动端编辑：`/editor` 在触屏/窄视口渲染「请在 PC 端使用」提示卡；落地页保持可浏览 |
| D-23 | 纯中文界面文案 |
| D-24 | 持久化：autosave 到 `localStorage`（只存 Scene JSON）；上传图片前端降采样后存 dataURL。**不引 IndexedDB** |
| D-25 | 撤销/重做上限 50 步 |
| D-26 | 水印支持一键关（`watermark: null`），默认文本仍为 `@baiwumm` |
| D-27 | Iconify 搜索面板：默认展示精选集合（`fluent-emoji-flat` / `noto` / `twemoji` / `openmoji`），同时支持全库搜索 |

### 工程与仓库
| 编号 | 决策 |
|---|---|
| D-28 | **全面重构，不兼容 v1**：不读旧 `localStorage` 配置、不做字段迁移、不留兼容分支 |
| D-29 | 直接在 `main` 开发（备份分支已在 GitHub 建好）。删除全部旧代码与旧品牌资产（含 logo/favicon，后续重新设计） |
| D-30 | 版本从 `2.0.0` 起；保留 release-it + conventional-changelog + 中文 commit 风格 |
| D-31 | 每阶段一个可独立回滚的 commit；**`git push` 前必须确认** |
| D-32 | 临时占位：品牌资产删除后用极简 SVG 占位（避免 favicon 404），用户后续替换 |
| D-33 | ✅ **字体子集产出采用方案 A，已完成（2026-09-20）**：`scripts/fetch-fonts.sh` 生成 `public/fonts/{maple-mono-cn-regular,maple-mono-cn-bold}.woff2`（合计 3.5MB，码位 6893 完全对齐，advance width 两字重一致）。本机工具链 Python 3.12.10 / fontTools 4.63.0 / brotli / pyftsubset 可用 |

---

## 1. 依赖清单与版本

```jsonc
// dependencies
"next": "^16.1.3", "react": "^19.2.3", "react-dom": "^19.2.3",
"tailwindcss": "^4", "@tailwindcss/postcss": "^4", "tw-animate-css": "^1",
"class-variance-authority": "^0.7", "clsx": "^2.1", "tailwind-merge": "^3.4", "lucide-react": "^0.562",
"next-themes": "^0.4", "zustand": "^5", "zundo": "^2", "immer": "^11",
"motion": "^12", "ogl": "^1.0", "react-colorful": "^5.6", "react-dropzone": "^14"
// devDependencies
"typescript": "^5.9", "@types/node": "^24", "@types/react": "^19", "@types/react-dom": "^19",
"@biomejs/biome": "^2.3", "vitest": "^3", "wrangler": "^4", "release-it": "^19", "@release-it/conventional-changelog": "^10"
```

> 装之前先确认版本仍存在（`pnpm view <pkg> version`）。若某包主版本已跨代（如 Next 17），**停下来问**，不要静默升级。
> 字体产物见 Phase 1.4a：regular 从 `E:\personal-project\better-admin\apps\next\public\fonts\maple-mono-cn-regular.woff2`（1.77MB，GB2312 子集 6893 字形）直接复制；Bold 700 用同一份码位表本地子集化生成。

---

## 2. 最终目录结构

```
cover-magic/
├── AGENTS.md                        ✅ 已存在
├── docs/
│   ├── requirements.md              ✅ 现状分析与功能清单
│   └── implementation-plan.md       ✅ 本文件
├── app/
│   ├── layout.tsx                   # next-themes provider + 全局样式 + 无统计
│   ├── page.tsx                     # 'use client' 落地页
│   ├── globals.css                  # Tailwind v4 + shadcn OKLCH 变量 + @font-face
│   ├── editor/page.tsx              # 'use client' 制作页
│   └── not-found.tsx
├── components/
│   ├── ui/                          # shadcn CLI 生成，禁止手改
│   ├── landing/                     # navbar / hero / template-gallery / features / steps / faq / footer
│   ├── editor/
│   │   ├── editor-shell.tsx         # 三栏骨架
│   │   ├── top-bar.tsx              # 平台预设 / 撤销重做 / 深浅色 / 导出
│   │   ├── canvas-stage.tsx         # 画布 + 拖拽热区 + 参考线 + 选中态
│   │   ├── template-drawer.tsx
│   │   ├── mobile-gate.tsx          # D-22 提示卡
│   │   └── panels/{background,logo,title,subtitle,watermark,export}.tsx
│   ├── controls/                    # ★ UI 隔离层：color-field / slider-field / asset-dropzone / font-select / ratio-select
│   └── background/light-ray.tsx     # 移植 ogimg（ogl）
├── lib/
│   ├── scene.ts                     # Scene 类型 + createDefaultScene()（默认值唯一定义处）
│   ├── platforms.ts                 # 14 档预设（比例/像素分离）
│   ├── fonts.ts                     # 字体清单 + 加载/预热
│   ├── render/{draw-scene,primitives,export}.ts
│   ├── text/wrap.ts                 # CJK 禁则断行 + 自适应缩放（纯函数，必须测）
│   ├── geometry.ts                  # 百分比 ↔ 像素换算（纯函数，必须测）
│   ├── storage/{autosave,history,share-url}.ts
│   └── iconify.ts                   # 搜索 + 详情 + 缓存 + AbortController
├── data/templates.ts                # 8–12 套模板
├── constants/site.ts                # 站点信息 / 备案 / 社交（替代 .env）
├── public/{fonts,placeholder}.svg + favicon.svg
├── scripts/fetch-fonts.sh           # 字体子集化产出脚本（Phase 1.4a 的脚本原件）
├── next.config.ts · tsconfig.json · postcss.config.mjs · components.json · biome.json · wrangler.jsonc · .gitignore
└── package.json · README.md · CHANGELOG.md · LICENSE · .release-it.json
```

---

## 3. Scene 数据契约（Phase 1 冻结，后续阶段只加字段不改语义）

```ts
export type Ratio = { w: number; h: number }

export type Background =
  | { kind: 'color'; color: string }
  | { kind: 'gradient'; from: string; to: string; angle: number }        // 连续角度 0-360，替代 v1 的 8 档方向
  | { kind: 'image'; dataUrl: string; fit: 'cover' | 'contain'; blur: number;
      overlay: number; overlayColor: string }                            // overlay 0-1：替代 v1 无意义的「背景透明度」

export type TextStyle = {
  fontFamily: string          // 取自 lib/fonts.ts 清单
  fontWeight: 400 | 700
  italic: boolean
  size: number                // 1080 基准 px（R-3）
  color: string
  letterSpacing: number       // 基准 px
  lineHeight: number          // 倍数，默认 1.25
  align: 'left' | 'center' | 'right'
  uppercase: boolean
  shadow: number              // 0-10 立体字，0 = 关
}

export type TextBlock = {
  text: string                // 支持 \n 手动换行
  autoFit: boolean            // 超宽自动缩字号（R-8 降级顺序）
  maxWidthPct: number         // 0-100，块宽占画布宽百分比
  x: number
  y: number                   // 0-100，锚点 = 块中心（不是左上角）
}

export type LogoLayer = {
  source: { kind: 'iconify'; code: string } | { kind: 'upload'; dataUrl: string }
  size: number                // 基准 px
  x: number
  y: number
  shadow?: { size: number; color: string }
}

export type Scene = {
  version: 2                  // 结构版本号，用于未来 Scene 迁移（与 D-28 不冲突）
  templateId: string | null
  presetId: string            // 见 lib/platforms.ts
  ratio: Ratio                // 构图只依赖它（R-4）
  exportSize: { width: number; height: number }
  background: Background
  logo: LogoLayer | null
  title: (TextStyle & TextBlock) | null
  subtitle: (TextStyle & TextBlock) | null
  watermark: (TextStyle & TextBlock & { opacity: number }) | null
}
```

渲染器契约：

```ts
// lib/render/draw-scene.ts —— 预览 / 导出 / 缩略图唯一入口（R-1）
export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  opts: { width: number; height: number; dpr?: number }
): void
// 内部 scale = height / 1080（R-3）；x/y 换算全部走 lib/geometry.ts
```

---

## 4. 分阶段任务

### Phase 0 · 仓库清理与脚手架
**目标**：得到空的 Next.js + shadcn 骨架，旧代码归零。

- [x] 0.1 删除 v1 文件：`src/`、`index.html`、`vite.config.ts`、`tsconfig.app.json`、`tsconfig.node.json`、`eslint.config.js`、`.eslintignore`、`pnpm-lock.yaml`、`public/` 下的 v1 品牌资产（`favicon*`、`logo.svg`、`apple-touch-icon.png`、`site.webmanifest`、`web-app-manifest-*.png`）。⚠️ **`public/fonts/` 必须保留** —— 里面的两个 woff2 已按 Phase 1.4a 生成完毕
- [x] 0.2 `git rm --cached .env` 并删除该文件（当前**被 git 追踪**，必须停止追踪）；`.gitignore` 加 `.env*`、`.next/`、`out/`、`.wrangler/`、`.dev.vars`、`.font-build/`
- [x] 0.3 保留：`LICENSE`、`CHANGELOG.md`、`AGENTS.md`、`docs/`、`.release-it.json`、`.vscode/extensions.json`
- [x] 0.4 `pnpm dlx create-next-app@latest` 初始化（App Router、TS、Tailwind v4、Biome、`@/*` 别名），或手写等价配置；合并进根目录
- [x] 0.5 `next.config.ts`：`output: 'export'`、`images: { unoptimized: true }`、`trailingSlash: true`（**对 Workers 路由友好，见 8.3**）
- [x] 0.6 `npx shadcn@latest init`（中性主题、OKLCH、cssVariables）
- [x] 0.7 `components/controls/` 目录占位 + `constants/site.ts` 建骨架（含 ICP `粤ICP备2023007649号` / 公安 `粤公网安备44030402006402号` / GitHub / 博客 / 邮箱）
- [x] 0.8 `package.json`：`scripts` 配齐（`dev`/`build`=`next build`+`next export` 或单 `next build`、`start`、`lint`、`test`、`deploy`=`wrangler deploy --dry-run`），`version` 置 `2.0.0`，移除全部 Vue 依赖
- [x] 0.9 临时占位 `public/favicon.svg` + `public/placeholder.svg`（D-32）

**验收**：`pnpm build` 产出 `out/`；`pnpm lint`、`pnpm test` 均通过（此时无测试用例也应退出 0）；`pnpm dev` 打开是 shadcn 默认页且深浅色可切；`git status` 无 `.env`、无 `src/`。
**commit**：`chore: 重构为 Next.js + shadcn 骨架，删除 Vue v1 代码`
**禁止**：不写任何业务代码、不做字体接入、不碰 UI 布局。

---

### Phase 1 · 渲染内核（本计划的地基，后续阶段全部依赖）
**目标**：`drawScene` 单点可用，预览=导出=缩略图三处同源。

- [x] 1.1 `lib/scene.ts`：Scene 类型 + `createDefaultScene()`（R-10）
- [x] 1.2 `lib/geometry.ts`：百分比 ↔ 像素换算（含边距补偿），vitest 覆盖
- [x] 1.3 `lib/text/wrap.ts`：CJK 禁则断行 + `autoFit` 降级（R-8），vitest 覆盖 ≥12 用例：纯中文/纯英文/中英混排/引号行尾/括号行首/超长无空格串/`\n` 与自动换行混用
- [x] 1.4 `lib/fonts.ts` + `app/globals.css` 的 `@font-face`：regular 直接复制 better-admin 产物；Bold 按 1.4a 生成；`preloadFonts()` 用 `document.fonts.load()` 预热
- [x] 1.4a ✅ **已完成（2026-09-20）：字体产物已入库，新窗口无需重跑**

  - 产物：`public/fonts/maple-mono-cn-regular.woff2`（1,772,496 B）+ `maple-mono-cn-bold.woff2`（1,724,892 B），合计 3.5 MB
  - 校验：码位集合 6893 / 6893 **完全对齐**（两个方向的差集均为 0）；6881 个简单字形逐一比对，**几何完全相同的 0 个**；轮廓点数一致而包围盒对称外扩（`A` 的 x 范围 47–553 → 32–568）→ 确认是独立字重而非复制；OS/2 `usWeightClass` 400/700 与 `fsSelection` bold 位均正确
  - ★ 对渲染器有用的实测结论：**两字重的 advance width 完全一致（6892 个字形 0 处不同）** → 加粗不改变排版宽度，`autoFit` 量宽逻辑**无需按字重分支**
  - 唯一告警 `WARNING: meta NOT subset`：`meta` 表被丢弃，对 Web 字体无影响，属正常
  - 重跑方式：`bash scripts/fetch-fonts.sh`（幂等）。`.font-build/MapleMono-CN.zip`（140MB，已 gitignore）保留着，日后加 SemiBold 等字重无需重新下载
  - 下一步仍需做（Phase 1 内）：`app/globals.css` 写两条 `@font-face`（同族名、400/700、`unicode-range` 照抄 better-admin），并删掉 v1 遗留的 `strokeText` 伪加粗思路

  以下为**当时的实际过程记录**（权威版本已固化为 `scripts/fetch-fonts.sh`，无需照抄执行）：
  ```bash
  mkdir -p .font-build && cd .font-build          # 工作目录不入库，.gitignore 已含

  # (1) 复制 regular 作为覆盖基准
  cp "E:/personal-project/better-admin/apps/next/public/fonts/maple-mono-cn-regular.woff2" .

  # (2) 下载 v7.9 CN 静态字重包（⚠️ 外网，需确认）
  curl -L -o MapleMono-CN.zip \
    "https://github.com/subframe7536/maple-font/releases/download/v7.9/MapleMono-CN.zip"
  unzip -o MapleMono-CN.zip "MapleMono-CN-Bold.ttf"

  # (3) 从 regular 产物读出**实际覆盖码位**，保证 Bold 与 Regular 覆盖完全一致
  #     （不能按"GB2312"规格重算，否则会出现常规体有字、粗体没有的字形）
  python - <<'PY'
  from fontTools.ttLib import TTFont
  f = TTFont('maple-mono-cn-regular.woff2')
  cps = sorted(f.getBestCmap().keys())
  open('codes.txt','w').write(','.join('U+%04X' % c for c in cps))
  print('codepoints:', len(cps))
  PY

  # (4) 子集化 Bold → woff2（参数名先跑 `pyftsubset --help` 核对）
  pyftsubset MapleMono-CN-Bold.ttf \
    --unicodes-file=codes.txt \
    --flavor=woff2 --hinting=False --desubroutinize \
    --output-file=maple-mono-cn-bold.woff2

  # (5) 校验码位集合一致（期望两个都是 0）
  python - <<'PY'
  from fontTools.ttLib import TTFont
  a = set(TTFont('maple-mono-cn-regular.woff2').getBestCmap())
  b = set(TTFont('maple-mono-cn-bold.woff2').getBestCmap())
  print('regular-only:', len(a-b), ' bold-only:', len(b-a))
  PY
  ```
  - **Windows 命令行长度坑（已实测确认）**：`codes.txt` 实际 **48,250 字符**，超过 `cmd` 的 32767 上限。**只能用 `--unicodes-file`**（fontTools 4.63 已确认存在该参数），不要退化成 `--unicodes="$(cat codes.txt)"`。
  - **regular 实测基线**：6893 码位 / 6893 字形，族名 `Maple Mono CN`、子族 `Regular`；构成为 ASCII 95 + CJK 6763（= GB2312 一二级全集）+ 中文标点 14 + 全角 9 + 其它 12。生成 Bold 后必须与此完全对齐。
  - **网络实测**：本机直连 GitHub Releases 会在 ~103MB 处 `curl: (56) Connection was reset`，`MapleMono-CN.zip` 为截断包（无中央目录结尾）。`scripts/fetch-fonts.sh` 已按**幂等 + 断点续传**编写：若下载反复失败，手工把完整 zip 放到 `.font-build/MapleMono-CN.zip` 再重跑脚本即可，脚本会自动跳过下载步。
  - **不要**加 `--layout-features=''`：先与现有 regular 保持一致（不指定该参数），生成后并排渲染同一句中文 + 标点，确认等宽与标点宽度风格一致再定。
  - 产物 `maple-mono-cn-regular.woff2` + `maple-mono-cn-bold.woff2` 一起放进 `public/fonts/`；`app/globals.css` 写两条 `@font-face`（同族名 `'Maple Mono CN'`，`font-weight: 400` / `700`，`unicode-range` 与 `font-display` **照抄 better-admin 那份 CSS**）。
  - 把上面脚本原样存为 `scripts/fetch-fonts.sh`（或在 `.font-build/` 留 README 说明产出方式），便于日后重新生成。
  - 体积预期：regular 1.77MB + bold 约同量 ≈ 3.5MB，远低于 Workers 单文件 25MiB（R-16）。
- [x] 1.5 `lib/render/primitives.ts`：背景（色/渐变/图 cover-contain-blur-overlay）+ 图标（R-5 同源路径 + `revokeObjectURL`）+ 文本块（R-7 真字重）+ 水印透明度
- [x] 1.6 `lib/render/draw-scene.ts`：组合原语，`scale = height/1080`（R-3），顺序 background→logo→title→subtitle→watermark
- [x] 1.7 最小验证页 `app/editor/page.tsx`：一个 canvas + 一个 JSON textarea。手改 JSON 即可驱动全部渲染路径
- [x] 1.8 **一致性质检（本阶段核心验收）**：同一 Scene 在 1920×1080 预览 与 1242×1660 导出之间，构图相对位置目视一致；字号/字重/颜色零差异（R-24）

**验收**：`pnpm test` 中 `wrap.ts`/`geometry.ts` 全绿；导出 3 种比例 PNG，肉眼比对无 B-01 类错位；预览与导出图 diff 无字重差（消灭 B-02）；拖动 textarea 数值后立刻导出，位置与看到的一致（消灭 B-03）。
**commit**：`feat: 落地单一 Canvas 渲染内核与 CJK 断行引擎`
**禁止**：不做工具栏、不做 zustand、不做拖拽、不引 motion。

---

### Phase 2 · 编辑器外壳与控件层
**目标**：三栏布局 + 全部参数可通过控件修改。

- [x] 2.1 `pnpm add zustand zundo immer`；`lib/storage/history.ts` 用 `zundo` 包 temporal 中间件（上限 50，R-25）
- [x] 2.2 `stores/scene-store.ts`：Scene 单一数据源 + `set*` 原子 action（**不镜像 props，消灭 B-11**）
- [x] 2.3 `lib/platforms.ts`：14 档预设（见 §6 表），`group` 字段
- [x] 2.4 `components/controls/`：`color-field`（react-colorful + shadcn Popover，含 40 色板 + hex 输入）、`slider-field`（shadcn Slider + 数值显示 + 单位）、`switch-field`、`select-field`、`textarea-field`、`font-select`（shadcn `combobox` = Popover+Command，**不要手写下拉**）、`asset-dropzone`（`react-dropzone` + shadcn `Item`）
      → 先按附录 A 一次性 `npx shadcn@latest add` 装齐现成件，再写 controls 封装
- [x] 2.4b 消息提示用 shadcn `sonner`（替代 v1 Naive 的 `createDiscreteApi`/`useMessage`）；全局 Toast 挂在 layout
- [x] 2.5 `components/editor/editor-shell.tsx` + `top-bar.tsx` + `panels/*`：6 个 Tabs（背景/图标/主标题/副标题/水印/导出）。位置类参数**本阶段先留空**（Phase 3 用拖拽交付，符合 R-20）
- [x] 2.6 `canvas-stage.tsx`：外层用 shadcn `resizable` 分隔工具栏与画布、画布容器用 shadcn `aspect-ratio` 跟随 `scene.ratio`；只读渲染 + 棋盘格衬底
- [x] 2.7 深浅色：`next-themes` 接入，`attribute="class"`，顶部 toggle（**消灭 B-05：全项目只有一处主题状态**）
- [x] 2.8 应用模板 = 整体替换 Scene 的动作先建好（供 Phase 4 复用），禁止增量合并（R-11）

**验收**：改任一参数 → 画布即时更新；撤销/重做 50 步不回退过头；导出文件名/格式/质量生效；`next build` 无 hydration 警告。
**commit**：`feat: 编辑器三栏外壳与控件层`
**禁止**：不做拖拽、不做模板数据、不做落地页、不加任何 v1 已删控件。

---

### Phase 3 · 画布直接操作（本次便捷性收益最大的一块）
- [x] 3.1 命中检测：`lib/geometry.ts` 增 `hitTest(scene, point)`（文本块用换行后的实际外框，非近似宽度）
- [x] 3.2 拖拽：指针事件（Pointer Events，非 mouse）拖动实时改 `x/y`，`pointerdown` 时捕获
- [x] 3.3 选中态：描边 + 块包围盒 + 尺寸手柄（仅 logo 缩放）
- [x] 3.4 吸附：中线（x=50/y=50）、四边安全区、容差 4px（基准 px）；吸附时显示参考线
- [x] 3.5 键盘：方向键微调 1（`Shift` ×10）、`Delete` 清除当前槽位、`Tab` 循环选中元素
- [x] 3.6 平台预设切换 → **画布比例立即跟随**（R-4），并弹出「比例变化可能导致排版偏移，是否自动适配」提示（`autoFit` 兜底）
- [x] 3.7 拖拽结束时才提交进 history（避免每一步 drag 产生 50 条记录）

**验收**：拖动三个文本块与 logo 均落点准确；导出结果与拖拽后的预览逐像素一致（R-24）；撤销一次拖拽 = 回到拖拽前，而非拖拽中间态。
**commit**：`feat: 画布拖拽定位、吸附参考线与键盘微调`
**禁止**：不做多选、不做对齐分布面板、不做缩放/旋转（N-10 已明确留待确认）。

---

### Phase 4 · 模板系统（高颜值的主交付物）
- [x] 4.1 `data/templates.ts`：8–12 套，覆盖 16:9 / 2.35:1 / 3:4 / 1:1 四类比例，每套标注 `bestRatio`
- [x] 4.2 模板缩略图：运行时离屏 `drawScene` → 320×180 → `toDataURL`，`useMemo` + Map 缓存（**无构建步骤**）
- [x] 4.3 `template-drawer.tsx`：分组 + 缩略图网格 + 点击整体套用（2.8 的动作）
- [x] 4.4 落地页 `template-gallery.tsx` 复用同一份数据与同一渲染器
- [x] 4.5 进入 `/editor` 默认套用 `templateId: 'default'`（D-20）
- [x] 4.6 模板自检脚本/测试：遍历模板断言每个都是合法 Scene、文字不溢出画布、无子集外字符（若 7.1 决定做字符校验）

**验收**：套任意模板后画布无溢出/无遮挡；缩略图与实际效果一致（同源渲染保证）；换比例时 `autoFit` 生效不溢出。
**commit**：`feat: 数据驱动的模板系统与实时缩略图`
**禁止**：不做「保存用户自定义模板」、不做模板后端。

---

### Phase 5 · 导出与持久化
- [x] 5.1 `lib/render/export.ts`：`canvas.toBlob()` + `createObjectURL` + `revokeObjectURL`（替代 v1 `toDataURL`）
- [x] 5.2 复制到剪贴板（`ClipboardItem`，仅 PNG），失败时降级提示
- [x] 5.3 文件名：标题 slug + 时间戳；PNG 时质量控件自动禁用（消灭 v1 无效控件）
- [x] 5.4 导出前显示「目标尺寸 + 格式 + 预估体积」
- [x] 5.5 `lib/storage/autosave.ts`：debounce 400ms 写 `cover-magic:scene:v2`；启动读取并**校验 version，非法即 fallback 默认模板**（不做 v1 迁移，D-28）
- [x] 5.6 图片上传降采样：`createImageBitmap` → OffscreenCanvas 长边 ≤1920 → WebP q0.82 → dataURL；>800KB 提示（R-16）
- [x] 5.7 Iconify 面板：`lib/iconify.ts` 搜索 + 300ms 防抖 + `AbortController` + Map 缓存（**消灭 B-09**）；精选集合优先展示
- [x] 5.8 重置 = `createDefaultScene()`；`lib/storage/share-url.ts` 写 hash 序列化 Scene（R-13），顶栏「复制链接」
- [x] 5.9 （P2，可砍）同 Scene 批量导出全部平台尺寸

**验收**：导出 4K 不 OOM；剪贴板粘贴到公众号后台可用；刷新后状态完整恢复；上传 5MB 图不撑爆 localStorage；粘贴分享链接到无痕窗口能完整还原画面。
**commit**：`feat: 导出、自动保存、图标搜索与分享链接`
**禁止**：不改 `drawScene` 的绘制语义（只能加参数）。

---

### Phase 6 · 落地页（颜值交付）
- [x] 6.1 移植 `components/background/light-ray.tsx`（ogl，参考 `E:\personal-project\ogimg`，469 行）+ `BlurText` + `TextGenerateEffect` + `text-scramble`
      → 实际只落了 light-ray + `text-generate-effect`。**`BlurText` / `text-scramble` 未移植**：Hero 主标题已用逐字入场，再叠模糊/乱码入场是负收益。需要时可单独加。
- [x] 6.2 `navbar.tsx`：固定顶部 pill、`backdrop-blur-xl`、Logo + 深浅色 + 「开始设计」
- [x] 6.3 `hero.tsx`：徽章 pill → 主标题（`BlurText`，`text-5xl md:text-7xl`）→ 副文案 → **双按钮**（主：`开始设计` + `ArrowRight`，`asChild` 包 `Link href="/editor"`；次：`Star on GitHub` 描边 pill）→ 产品截图（虚线描边 + 大投影）
- [x] 6.4 `features.tsx` 3 卡（虚线边框 + 图标装饰）承接 v1 `HeaderPanel` 的文案资产；`steps.tsx` 三步；`faq.tsx`；`cta.tsx`
- [x] 6.5 `footer.tsx`：备案（`beian.miit.gov.cn` / `beian.mps.gov.cn` 链接）+ 社交 + 版权，全部读 `constants/site.ts`
- [x] 6.6 产品截图：用 Phase 4 的模板导出一张真实成品图（预压缩 AVIF/WebP，R-14）
- [x] 6.7 `app/not-found.tsx`；`export` 静态产物无服务端警告

**验收**：真实浏览器（`browser-use`，视口 1440×900）走完 落地页 → 点「开始设计」→ `/editor` → 改字 → 导出，无报错、无布局跳动、深浅色均正常（R-23）。
**验收记录（2026-09-21，headless Chrome + CDP，视口 1440×900，dev 与 `out/` 静态产物各跑一遍）**：
- 落地页浅/深：CLS **0**、控制台 0 报错、8 张运行时缩略图全部生成、Hero 成品图非空、`document.fonts` 已加载。
- 链路：点「开始设计」→ `/editor/` 渲染成功（画布 64 色非空白）；改主标题 → 画布哈希变化；撤销/重做按钮 → 画布哈希可复现地回到 `c999239d`；刷新 → autosave 恢复标题与画布。
- 修掉的 3 个真缺陷：
  1. `showcase.webp` 是一张**全透明**图（上次导出时画布未绘制，R-23 那个坑）→ 走应用自身导出路径重做为 1800×766 / 15.8KB；
  2. 主题切换按钮按 `resolvedTheme` 分支渲染图标 → SSR 与客户端首帧不一致触发 **hydration 报错**，改为两个图标都在、`dark:` 变体切换（navbar + `top-bar`）；
  3. `TabsList` 被 `group-data-horizontal/tabs:h-8` 锁成 32px，6 个 Tabs 排两行时溢出到面板上，**副标题/水印/导出三个标签被遮挡且点不到**（连 JS `.click()` 都无效）→ 用同 modifier 覆盖高度，实测 6 个标签 `elementFromPoint` 全部命中自己。
- 附带：指向 `/editor` 的 `Link` 加 `prefetch={false}`（静态导出下 RSC 预取路径与产物不一致，每次加载必然 404）。
**commit**：`feat: 落地页 Hero 与模板展示`
**禁止**：不做 SEO 元数据优化、不做多语言、不做博客/文档页。

---

### Phase 7 · 移动端策略与打磨
- [ ] 7.1 `mobile-gate.tsx`：`/editor` 窄视口/触屏 → 「请在 PC 端使用」卡（含复制桌面链接），不做响应式编辑器
- [ ] 7.2 快捷键面板（`?` 呼出）；焦点管理与 `aria-label`。**当前代码里没有任何 `ctrlKey/metaKey` 处理** → `Ctrl+Z` / `Ctrl+Shift+Z` 撤销重做需一并补（现在只有顶栏按钮，且焦点在输入框时应让位于原生撤销）
- [ ] 7.3 空/错误态：Iconify 加载失败、字体不可用、上传格式错误
- [ ] 7.4 首屏性能：字体仅 `/editor` preload；`out/` 体积核查（R-16）
      → 实测遗留两点：① `/editor` 首屏 **CLS ≈ 0.10**（357ms 面板组重新分配宽度 0.054 + 484ms 画布容器从 340×190 撑到 1114×497 0.046），落地页为 0；② Chrome 报「preload 的字体几秒内未被使用」告警——字体只进 canvas、UI 文本不用它，属该启发式的误报，确认是否保留 preload 时再定。
- [ ] 7.5 逐条回归 `docs/requirements.md` §3 的 B-01…B-13，在 §3 表格旁标注「已修」

**commit**：`feat: 移动端提示、快捷键与异常态`

---

### Phase 8 · 部署配置与发布
- [ ] 8.1 `wrangler.jsonc`：`name`、`compatibility_date`、`assets.directory = "./out"`、`assets.binding`、`not_found_handling`（见 8.3 实测项）
- [ ] 8.2 `public/_headers`：`/fonts/*` → `cache-control: public, max-age=31536000, immutable`；`/*.html` → `no-cache`；基础安全头 `x-content-type-options: nosniff`、`referrer-policy: strict-origin-when-cross-origin`、`permissions-policy`（**不加 CSP**，见 7.4 风险）
- [ ] 8.3 **实测项**：`trailingSlash: true` 与 Workers Assets 的 URL 规范化组合，确认 `/editor` 命中 `editor.html` 且不 404、404 页正确。本地 `wrangler dev` 验证即可，**不 deploy**（R-17）
- [ ] 8.4 `README.md` 重写（新栈、截图、本地开发、部署说明、badge 更新）
- [ ] 8.5 `docs/requirements.md` 的 §8 决策表标注最终结论；本文件状态更新
- [ ] 8.6 `release-it` 走 `2.0.0` —— **需用户明确指令后再执行，且 push/tag 单独确认**

**commit**：`build: 接入 Cloudflare Workers 静态托管配置`

---

## 5. 全局完成定义（DoD）

1. `pnpm lint` / `pnpm test` / `pnpm build` 全绿，`out/` 可直接被 Workers Assets 托管。
2. `docs/requirements.md` §3 的 13 条缺陷逐条标注处理结果，其中 B-01/B-02/B-03 必须「已修」。
3. 用同一 Scene 对比：预览截图 vs 导出图，字号/字重/颜色/位置**逐像素一致**。
4. 14 档平台预设逐个走一遍「选平台 → 拖元素 → 导出」，无溢出、无比例错乱。
5. 刷新 / 无痕窗口打开分享链接 / 深浅色切换 / 撤销到最早，四条路径均无异常。
6. 代码里搜不到被禁的东西：`html2canvas`、`next/font/google`、`strokeText`（伪加粗）、`.env`、Route Handler、统计代码、v1 `localStorage` key。
7. 落地页有「开始设计」按钮且可达 `/editor`；`/editor` 首屏 100% 是画布相关，无营销内容。

---

## 6. 平台预设最终值（D-21，写入 `lib/platforms.ts`）

| id | 名称 | 组 | 宽×高 | 比例 | 相对 v1 |
|---|---|---|---|---|---|
| custom | 自定义 | — | 用户输入 | — | 保留（**解锁输入**） |
| wechat-top | 微信公众号·头条 | cn | 900×383 | 2.35:1 | 不变 ✅ |
| wechat-sub | 微信公众号·次条 | cn | 500×500 | 1:1 | 🆕 |
| zhihu | 知乎 | cn | **1200×488** | 2.46:1 | 🔧 修正 v1 的 1080×607 |
| juejin | 掘金 | cn | **1280×720** | 16:9 | 🔧 |
| csdn | CSDN | cn | **1280×720** | 16:9 | 🔧 |
| aliyun | 阿里云开发者社区 | cn | **1280×720** | 16:9 | 🔧 |
| tencent | 腾讯云开发者社区 | cn | **1280×720** | 16:9 | 🔧 |
| toutiao | 今日头条 | cn | **1280×720** | 16:9 | 🔧 |
| jianshu | 简书 | cn | **1080×1080** | 1:1 | 🔧 |
| xhs | 小红书 | os | 1242×1660 | 3:4 | 🆕 |
| bilibili | B站 | os | 1440×900 | 16:10 | 🆕 |
| twitter | X / Twitter | os | 1200×675 | 16:9 | 🆕 |
| youtube | YouTube | os | 1280×720 | 16:9 | 🆕 |
| og | 通用 Open Graph | general | 1200×630 | 1.91:1 | 🆕 |

⚠️ 这些值除公众号外**均为社区/经验值，无可抓的官方文档**。因此预设不锁输入（R-21），且控件上要给「数值可能过期」的次要说明。用户实际发文用的平台若与其后台提示冲突，以用户提供的为准。

---

## 7. 待办风险与实测项

| 编号 | 风险 | 处理 |
|---|---|---|
| 7.1 | ~~Maple Mono CN Bold 子集尚未产出~~ → ✅ **已解决（2026-09-20）**：产物已入库 `public/fonts/`，Bold 与 regular 码位/度量校验通过，详见 Phase 1.4a。过程中踩到并已记录的坑：GitHub Releases 直连在 ~103MB 处 connection reset（改由用户手工下载放入 `.font-build/`）、`codes.txt` 48,250 字符超 Windows cmd 上限（走 `--unicodes-file`）、`@fontsource/maple-mono` 只有 latin 子集无 CJK（不可用作中文源） | 无（重跑需 `.font-build/MapleMono-CN.zip` 仍在，或重新下载） |
| 7.2 | GB2312 子集外的生僻字会回退系统字体，导出在别的机器上可能不一致 | 已接受（与 better-admin 同取舍）。在 AGENTS.md R-15 与 README 已知限制处记录，**不要为此改方案** |
| 7.3 | Workers Assets 与 Next 静态导出的 clean-URL 组合未实测（`/editor` 能否命中 `editor.html`） | Phase 8.3 用 `wrangler dev` 本地实测；`trailingSlash: true` 为默认对策 |
| 7.4 | 加 CSP 会与 Next 静态导出的内联脚本冲突 | 首版只加基础安全头，**不加 CSP** |
| 7.5 | 中文文档来源显示各平台尺寸混乱（今日头条流传 4 套值、掘金无官方规范） | 见 §6 说明 + 预设可微调 + 不锁输入 |
| 7.6 | `autoFit` 缩字号后可能与模板设计意图偏离，模板在小比例下变平庸 | Phase 4.6 遍历时检查四类比例；必要时给模板加 `ratioOverrides`（**属扩范围，先问**） |
| 7.7 | 视觉测量环境无效会被误判成渲染 bug：后台标签页/隐藏容器里 `requestAnimationFrame` 不执行 → 画布假空白；自动化视口可能 `0×0` → 几何测量全错 | 遵守 AGENTS.md R-23：先确认页面前台可见、视口有真实尺寸，用 `browser-use` 量 `getBoundingClientRect` 再改（Phase 1.8 / 3 / 6 的验收都依赖这条） |
| 7.10 | 误装社区注册表取色器（`shadcn.io` 401 需付费、`originui` 路径跳文档页）或误用官方 `attachment`/`bubble`/`message`（这些是聊天 UI 件，不是文件选择器） | 只用官方注册表现成件（附录 A）+ `react-colorful` / `react-dropzone` 两个专门库 |
| 7.8 | `zundo` + `immer` + `zustand` 在高频拖拽下会产生大量快照 | Phase 3.7 只在 `pointerup` 提交；必要时拖拽期间 `temporal` 暂停 |
| 7.9 | 若某阶段发现需扩大范围（新依赖、动 Scene 语义、加图层） | **立即停下问用户**，不要顺手实现（AGENTS.md 范围红线） |

---

## 8. 执行节奏建议

- 一次会话只做 1 个 Phase；Phase 1 与 Phase 3 是难度峰值，不要合并。
- 每阶段完成后：跑质量门 → 提交 → 停下来汇报「做了什么 / 验收结果 / 下一阶段的未知项」。
- Phase 1 结束即应产出第一张真实导出图 —— 用它验证渲染内核，再决定后续外观调整。
- 遇到 §7 任一条风险触发，先报告再行动。

---

## 附录 A · shadcn 组件安装清单（Phase 2.4 前置，一条命令装齐）

```bash
npx shadcn@latest add button card tabs popover select native-select slider switch \
  dialog sheet drawer dropdown-menu tooltip accordion combobox command resizable \
  scroll-area separator input textarea input-group field form item kbd sonner \
  skeleton empty badge toggle-group aspect-ratio progress
```

### 需求 → 现成件映射（禁止自绘这些）

| 本项目需求 | 直接用 |
|---|---|
| 工具栏分页 | `tabs` |
| 模板抽屉 / 移动端提示 | `sheet` / `drawer` |
| 平台预设下拉（带分组） | `select` + `select-group` |
| 字体下拉（可搜索） | `combobox`（= `popover` + `command`） |
| 参数滑块 / 开关 | `slider` / `switch` |
| 快捷键说明 | `kbd` |
| 消息提示（替代 v1 Naive `useMessage`） | `sonner` |
| 工具栏/画布可拖分栏 | `resizable` |
| 画布容器比例锁定 | `aspect-ratio` |
| 重置确认弹窗 | `alert-dialog`（`dialog` 亦可） |
| 空态 / 加载骨架 | `empty` / `skeleton` |
| 导出预览信息行 | `item` / `field` / `badge` |

### 缺口对照表（唯一需要引专门库的两处，均已实测）

| 方案 | 结论 | 实测证据 |
|---|---|---|
| shadcn 官方注册表取色器 | ❌ 无 | `https://ui.shadcn.com/r/index.json` 共 63 个 `registry:ui`，`grep color` **0 命中**；`/r/color-picker.json` → 404 |
| 社区注册表现成取色器 | ❌ 不可直接用 | `shadcn.io/r/color-picker.json` → **401**（付费鉴权）；`originui.com/r/color-picker.json` → 重定向到 `coss.com/ui` 文档页；`base-ui.com/r/index.json` → **404** |
| **`react-colorful` + `Popover` 组合** | ✅ **采用** | 取色器本体由库实现（2.9KB / 零依赖），我们只写「放进浮层 + 受控 hex」约 30 行胶水，**不属于自绘取色器** |
| 原生 `<input type="color">` | ❌ 不采用 | 零依赖但无 alpha、无法配 40 色板、跨浏览器观感不可控 → 达不到「高颜值」 |
| 换 UI 库（Ant Design 有完整 ColorPicker） | ❌ 不采用 | 与 D-02（全站 shadcn）冲突，且观感不符 ogimg 参考 |
| 拖拽上传 | ✅ **`react-dropzone`** | 官方注册表同样无 dropzone（同一实测）；手写的 `dragenter`/`dragleave` 抖动与 `dataTransfer` 类型判断正是该库解决的问题 |

> 若你愿意为某个付费社区注册表开权限，D-04 可以从「组合 react-colorful」换成「直接装现成注册表项」—— 这是唯一需要你额外决策的点，其余按上表执行。
