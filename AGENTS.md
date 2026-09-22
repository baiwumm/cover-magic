# AGENTS.md — Cover Magic v2.0

面向 AI 编码代理的项目约束。仅收录**违反即产生 bug 或返工**的规则；背景与决策理由在 `docs/requirements.md`，任务分解在 `docs/implementation-plan.md`。

## 项目定位

封面图设计工具。域名 `cover.baiwumm.com`（不变）。落地页 `/` → 制作页 `/editor`。
无 SEO 要求、无后端、无统计代码。核心诉求按优先级：**操作便捷 > 页面高颜值 > 所见即所得**。
纯中文界面。不考虑移动端编辑（移动端仅浏览落地页）。

## 技术栈（版本锁定，勿擅自升级或替换）

| 项 | 约定 |
|---|---|
| 框架 | Next.js 16 App Router + React 19，`output: 'export'` 纯静态导出 |
| 样式 | Tailwind CSS v4；深浅色用 `dark:` 变体 + `next-themes` |
| UI | shadcn/ui（官方注册表，`npx shadcn@latest add`），底层 Radix UI |
| 图标 | `lucide-react` 仅用于**界面外壳**；封面画面内容图标用 Iconify（见铁律 R-5） |
| 状态 | `zustand` + `zundo`（撤销重做）+ `immer` |
| 动效 | `motion`；落地页背景 `ogl` 光束 |
| 取色 | `react-colorful` 包在 shadcn `Popover` 里，封装为 `components/controls/color-field.tsx`。**官方注册表无取色器，此为实测结论**（见 R-18） |
| 上传 | `react-dropzone` + shadcn `Item`/`Field` 组合成 `controls/asset-dropzone.tsx`。**不要手写拖拽逻辑** |
| 渲染 | 原生 Canvas 2D。**禁止**引入 html2canvas / dom-to-image 一类 DOM 转图片方案 |
| 包管理 | pnpm |
| 测试 | `vitest`，仅覆盖 `lib/` 下的纯函数（换行、比例、Scene 序列化）。不测像素 |
| 代码检查 | Biome（`pnpm lint` = `biome check .`） |

## 目录约定

```
app/{page.tsx,editor/page.tsx}     # 两个页面，均 'use client'
components/{landing,editor,controls,ui}/*
components/ui/*                    # shadcn 生成物，禁止手改；需要变体时改 controls/
lib/{scene.ts,render/*,text/*,storage/*,iconify.ts,platforms.ts}
data/templates.ts                  # 模板纯数据
public/fonts/*.woff2
```

站点名/描述/备案/社交链接等常量放 `constants/site.ts`。**不使用 `.env`**（已从版本库移除，勿再提交）。

## 渲染铁律

- **R-1 唯一渲染器**：预览、导出、模板缩略图必须共用 `drawScene(ctx, scene, opts)`（`lib/render/draw-scene.ts`）。任何情况下不得出现第二份绘制实现。v1 因复制两份绘制代码而产生字重不一致与导出错位，这是本次重构的首要教训。
- **R-2 单一数据源**：预览与导出读同一个 `Scene`。禁止动画中间态参与导出取值；不要在渲染管线里做弹簧/补间。
- **R-3 长度单位**：`Scene` 中所有 px 值以**画布高度 1080 为基准**。渲染时 `scale = canvasHeight / 1080`。新增长度字段必须遵守此约定，否则换比例即错位。
- **R-4 比例与像素分离**：构图只依赖 `scene.ratio`，`scene.exportSize` 只影响导出分辨率。同比例下改像素，预览不得有任何变化。
- **R-5 画布防污染**：任何画进 canvas 的图片必须同源。Iconify 图标走 `fetch → Blob → URL.createObjectURL` 或 dataURL，**禁止** `<img src="https://api.iconify.design/...">` 直绘；用户上传图必须先转 dataURL。跨域图会污染画布，使 `toBlob()` 静默抛 `SecurityError`。用完必须 `revokeObjectURL`。
- **R-6 字体等待**：绘制文字前必须 `await document.fonts.load('400 100px "Maple Mono CN"')`（bold 同理）或用 `document.fonts.check()` 判定。禁止用「量两种字体的文本宽度差」来猜字体是否加载完（v1 做法，会在字体晚到时导出错字）。
- **R-7 真字重优先**：加粗通过 `@font-face` 提供 400/700 两个字重实现，**禁止**用 `strokeText` 描边模拟加粗。斜体用 `ctx.font` 的 `italic`，不要用 `ctx.transform` 伪斜切（除非字体本身无 italic 变体且已记录原因）。
- **R-8 CJK 断行**：多行文本必须过 `lib/text/wrap.ts`，遵守中文禁则：标点不得出现在行首（`，。、！？；：）》”’％‰·—…`）或行尾（`（《“‘`）；拉丁单词不得从中间断开；中英边界可断。溢出降级顺序固定为「缩字号 → 减行 → 省略号」。改动此函数必须同步补测试用例。
- **R-9 Scene 是固定槽位**（background / logo / title / subtitle / watermark），不得演化成通用图层数组。需要第 N 类元素时先停下来确认，不要顺手加抽象层。
- **R-10 默认值唯一定义处**：`lib/scene.ts` 的 `createDefaultScene()`。重置、初始化、模板 fallback 全部引用它。禁止在组件里内联第二份默认配置。
- **R-11 模板是纯 JSON**：`data/templates.ts` 只允许出现可序列化的 `Scene` 片段，不得含函数、组件或 CSS 字符串。套用模板 = **整体替换** Scene（不是 `Object.assign` 增量合并，v1 因此残留旧字段）。

## 静态导出与 Cloudflare Workers 约束

- **R-12**：不得依赖任何服务端能力。禁止 Route Handler、Server Actions、`middleware.ts`、`ImageResponse`、ISR。分享链接走 hash 序列化（见 R-13）。
- **R-13**：配置分享用 URL hash（`#s=` + 压缩后的 Scene），零后端。**预留适配层**：所有可能服务化的逻辑（分享、远程图片获取）封在 `lib/` 后，UI 层不感知实现。
- **R-14**：`next/image` 的默认优化器在 Workers Assets 上不存在。图片一律用原生 `<img>` + 预先压缩提交的静态资源。远程图需在 `next.config.ts` 的 `images.remotePatterns` 声明（若改用 loader 则必须配 `loader: 'custom'`）。
- **R-15**：字体不走 `next/font/google`（构建期需访问 Google，托管环境不可控）。用 `@font-face` + `public/fonts/*.woff2`（子集化产物），在**根布局** `app/layout.tsx` `preload` 两字重（D-35：全站 UI 共用 Maple Mono CN，落地页也会为模板缩略图下载同一批 woff2，preload 不增加字节）。**必须同时提供 400 与 700 两个字重**（这是删掉 v1 `strokeText` 伪加粗的前提，见 R-7）；产物由 `scripts/fetch-fonts.sh` 生成，Bold 子集必须与 regular 使用**同一份码位表**，避免"常规体有字、粗体缺字"。子集为 GB2312 范围，**子集外生僻字会回退系统字体**，这是已接受的已知边界，不要为此改方案。
- **R-16**：Workers 限制：单文件 ≤ 25 MiB、免费计划 ≤ 20000 文件。持久化只用 `localStorage`（存 Scene JSON）；上传图片必须先降采样到长边 ≤ 1920 并转 WebP（q≈0.82）再存。不引 IndexedDB。
- **R-17**：部署配置只产出 `wrangler.jsonc` + `package.json` 的 `deploy` 脚本。**不执行** `wrangler login` / `wrangler deploy`，不触碰 Cloudflare 账号。

## UI 约定

- **R-18**：组件优先顺序：shadcn 官方注册表 → **引入现成的专门库** → Radix 原语组合 → 最后才手写。**不要用 Tailwind 手搓一个库里已有的组件**，也不要在已有专门库时手写该控件的替代品（取色器用 `react-colorful`、拖拽上传用 `react-dropzone`，都是这个原因）。加组件前先 `npx shadcn@latest add <name>` 之前先核对注册表是否已有。
  - 官方注册表当前共 63 项，含：`button card tabs popover select slider switch dialog sheet drawer dropdown-menu tooltip accordion combobox command resizable scroll-area separator input textarea field form input-group item kbd sonner skeleton empty badge toggle-group aspect-ratio native-select table progress` 等 —— 我们需要的通用件**全部命中**。
  - 官方注册表**没有**（已实测）：color picker、dropzone/文件上传。
  - ⚠️ 别误装：注册表里的 `attachment` / `bubble` / `message` / `message-scroller` / `marker` 是**聊天 UI 组件**，不是文件选择器或图钉。
  - ⚠️ 社区注册表已实测不可用：`shadcn.io/r/color-picker.json` 返回 401（需付费鉴权）、`originui.com/r/color-picker.json` 重定向到文档页、`base-ui.com/r/index.json` 返回 404。不要为省事引这些来源。
- **R-19**：主题走 shadcn 默认中性（黑/白/灰 + OKLCH 变量），与视觉参考项目 ogimg 一致。不要引入彩色主色。变体用 `cva`。**例外**：落地页装饰色不受 R-19 约束 —— hero 标题渐变、ogl 光束、模板缩略图内容色可彩色；编辑器 UI 与控件仍保持中性。
- **R-20**：操作便捷优先于参数完备。**不要用一维滑块调二维位置** —— 元素定位靠画布拖拽 + 方向键微调，不靠 XY 滑块对。已删除的控件（背景透明度、随机文件名及其字符集选项、加载动画）不要以新名义加回来。
- **R-21**：平台预设（`lib/platforms.ts`）选中后**只填入推荐值，不锁死宽高输入**（v1 的 `disabled` 是过度限制，且这些尺寸均为社区经验值、可能过期）。预设按「中文社区 / 海外平台 / 通用」分组。
- **R-22**：移动端：`/editor` 检测到窄视口或触屏时渲染「请在 PC 端使用」提示卡，不做响应式编辑器。落地页保持可浏览。

## 质量门（每阶段提交前必须全绿）

1. `pnpm lint` 无错误
2. `pnpm build` 成功（静态导出模式）
3. `pnpm test` 通过（`lib/` 纯函数）
4. `pnpm dev` 起服务，**在真实浏览器里跑一遍本阶段交互路径**，含验收清单里的边界用例
- **R-23 视觉验证要有效**：视觉/几何问题**先量再改**，不要凭读 CSS 推断。量之前先确认测量环境有效：
  - 页面必须**前台可见**——后台标签页或被隐藏的容器里 `requestAnimationFrame` 不执行，依赖 rAF 的渲染（画布重绘、`motion` 动画）会停在空白态，极易被误判成渲染 bug；
  - 视口必须**有真实尺寸**——自动化环境里视口可能是 `0×0`，此时 `getBoundingClientRect` 与 canvas 尺寸全部不可信；
  - 用 `browser-use` 开真实页面（建议 1440×900）量 `getBoundingClientRect`、截图对比，而不是截图空白图就下结论。
- **R-24 预览与导出必须逐像素一致**：新增渲染特性后，用同一 Scene 分别截图预览与导出结果对比（字号、颜色、字重、位置、比例）。做不到一致就说明违反了 R-1/R-2/R-3。

## 提交与发布

- 遵循仓库既有的 Conventional Commits + 中文描述风格（`feat:` / `fix:` / `perf:` / `style:` / `chore:` / `build:`）。
- 按 `docs/implementation-plan.md` 的阶段边界提交，一个阶段一个可独立回滚的 commit。
- **不做 `git push`、不改远端、不执行发布**，除非明确要求。用户会在另一窗口继续执行。
- 版本从 `2.0.0` 起，保留 release-it + conventional-changelog 流程。
- **只做被批准范围内的事**：发现需要扩大范围（加依赖、改 UI 库、动数据结构、触碰部署）时先停下来问，不要顺手实现。

## 范围红线

以下属于**已被明确否决**，不要重新提出或"顺手优化"：SEO 优化、后端/数据库、统计代码、移动端编辑器、通用图层系统、IndexedDB、html2canvas、`next/font/google`、彩色主题、HeroUI、对 v1 `localStorage` 旧数据的兼容迁移（全面重构，不兼容旧状态）。
