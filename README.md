<div align="center">
  <img alt="Cover Magic Logo" src="./public/favicon.svg" width="96"/>
  <h1>Cover Magic</h1>
  <p><strong>中文友好的封面图设计工具：拖拽定位、中文断行、平台尺寸预设、实时预览与高清导出，全流程在浏览器完成。</strong></p>

  <p>
    <img src="https://img.shields.io/github/stars/baiwumm/cover-magic?style=flat-square&logo=github" alt="GitHub stars"/>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js"/>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
    <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Workers"/>
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License MIT"/>
  </p>
</div>

## 功能特点

- **所见即所得**：预览、导出、模板缩略图共用同一 Canvas 渲染器（`drawScene`）
- **画布直接操作**：拖拽定位 + 吸附参考线 + 方向键微调（1px / Shift×10）
- **中文排版**：CJK 禁则断行、多行文本、自适应字号（缩字号 → 减行 → 省略号）
- **模板系统**：多套纯 JSON 模板，运行时离屏渲染缩略图，一键整体套用
- **平台预设**：公众号 / 掘金 / 知乎 / 小红书 / B站 / X / YouTube 等 14 档，比例与像素分离
- **导出**：PNG / WebP / JPEG、复制到剪贴板、体积预估、分享链接（URL hash，零后端）
- **本地优先**：自动保存 `localStorage`，数据不出浏览器；撤销/重做 50 步
- **图标**：Iconify 站内搜索（精选集合 + 全库）+ 本地图片上传（降采样）

## 本地开发

```bash
# 克隆
git clone git@github.com:baiwumm/cover-magic.git
cd cover-magic

# 安装依赖（pnpm）
pnpm install

# 开发
pnpm dev
# http://localhost:3000

# 质量门
pnpm lint
pnpm test
pnpm build   # 纯静态导出 → out/
```

| 脚本 | 说明 |
|---|---|
| `pnpm dev` | Next.js 开发服务器 |
| `pnpm build` | 静态导出到 `out/`（`output: 'export'`） |
| `pnpm lint` | Biome 检查 |
| `pnpm test` | Vitest（仅 `lib/` 纯函数） |
| `pnpm deploy` | `wrangler deploy --dry-run`（本地校验配置，不触碰账号） |
| `pnpm release` | release-it 发版（需明确指令） |

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 App Router + React 19，`output: 'export'` |
| 样式 | Tailwind CSS v4 + shadcn/ui（Radix）+ `next-themes` |
| 状态 | zustand + zundo（撤销重做）+ immer |
| 渲染 | 原生 Canvas 2D（**不用** html2canvas / DOM 转图） |
| 字体 | `@font-face` + 仓库内 Maple Mono CN woff2 子集（400/700） |
| 动效 | `motion`；落地页背景 `ogl` 光束 |
| 检查 / 测试 | Biome · Vitest |
| 部署 | Cloudflare Workers Static Assets（`wrangler.jsonc`） |

## 项目结构

```
cover-magic/
├── app/
│   ├── page.tsx              # 落地页 /
│   ├── editor/page.tsx       # 制作页 /editor
│   ├── layout.tsx            # 主题 + 字体 preload
│   └── globals.css           # Tailwind v4 + shadcn OKLCH + @font-face
├── components/
│   ├── landing/              # Hero / 模板墙 / features / FAQ / footer
│   ├── editor/               # 三栏外壳、画布、面板、模板抽屉
│   ├── controls/             # UI 隔离层（取色、滑块、上传…）
│   ├── ui/                   # shadcn 生成物
│   └── theme/                # 主题切换（View Transition）
├── lib/
│   ├── scene.ts              # Scene 类型 + 默认值唯一定义处
│   ├── render/draw-scene.ts  # 唯一渲染器（预览=导出=缩略图）
│   ├── text/wrap.ts          # CJK 禁则断行
│   ├── platforms.ts          # 14 档平台预设
│   └── storage/              # autosave / history / share-url
├── data/templates.ts         # 模板纯 JSON
├── public/fonts/*.woff2      # Maple Mono CN 子集
├── wrangler.jsonc            # Workers Static Assets
└── docs/                     # 需求、实施计划、审查清单
```

## 部署（Cloudflare Workers）

```bash
pnpm build          # 产出 out/
pnpm deploy         # wrangler deploy --dry-run，校验配置
# 真实部署需自行 wrangler login 后执行 wrangler deploy（本仓库不代为登录/发布）
```

- 静态产物目录：`out/`（见 `wrangler.jsonc` 的 `assets.directory`）
- 自定义响应头：`public/_headers`（字体与 `_next/static` immutable、HTML no-cache、基础安全头）
- 路由：`trailingSlash: true` → `/editor` → `editor/index.html`；未知路径走 `404-page`

### 已知限制

- 字体为 GB2312 子集，**子集外生僻字会回退系统字体**（已接受的取舍）
- 无后端、无账号、无统计代码；分享靠 URL hash
- `/editor` 仅支持桌面端（窄视口 / 触屏显示提示卡）

## 许可证

[MIT](LICENSE)

## 作者

- **baiwumm** · [me@baiwumm.com](mailto:me@baiwumm.com) · [baiwumm.com](https://baiwumm.com) · [GitHub](https://github.com/baiwumm)

## 反馈

- [Issues](https://github.com/baiwumm/cover-magic/issues)
- 线上地址：<https://cover.baiwumm.com>

---

<div align="center">
  <p>如果这个项目对你有帮助，请给它一个 ⭐️</p>
  <p>© Cover Magic. All rights reserved.</p>
</div>
