# Cover Magic 重构需求文档

> 版本：v1.0（2026-09-20）· 状态：**待评审**
> 范围：现有功能盘点（As-Is）+ 重构功能需求（To-Be）+ 技术选型评估 + 页面结构规划
> 约束：域名保持 `cover.baiwumm.com` 不变；无 SEO 要求；核心诉求 = **操作便捷** + **页面高颜值**
> 本文档只做梳理与建议，不含任何代码改动。所有结论均可通过「证据」列的 `文件:行号` 复核。

---

## 1. 现状总览

| 项 | 现状 |
|---|---|
| 框架 | Vue 3.5 `<script setup>` + Vite 7 + TypeScript 5.8 |
| UI 库 | Naive UI 2.42（devDependency，非 dependencies） |
| CSS | Tailwind CSS 4（`@tailwindcss/vite`） |
| 图标 | `@iconify/vue`（UI 图标）+ Iconify REST API（封面内容图标） |
| 渲染 | 原生 Canvas 2D 手写绘制，**未使用** `html2canvas`（依赖空挂） |
| 元数据 | `@unhead/vue`；字体 `vfonts`（Lato / FiraCode）+ 自建 CDN 的 Maple Mono CN |
| 规模 | 15 个源文件 / 约 4.4k 行，其中 `App.vue` 831 行、`DefaultTheme.vue` 1270 行 |
| 状态管理 | 无 store，5 个 `reactive` 配置对象 + props/emit 双向镜像 + `defineExpose` 命令式调用 |
| 持久化 | 单槽 `localStorage["cover-magic-config"]`，需手动点「保存配置」 |
| 部署 | 静态 SPA → Vercel，前置 Cloudflare（线上响应头 `x-vercel-cache` + `Server: cloudflare` 已验证） |
| 页面 | 单页无路由，编辑器即首页 |

**结构性问题一句话总结**：`DefaultTheme.vue` 里「预览渲染」和「导出渲染」是两份复制粘贴的绘制代码（约 460 行），已经产生了实际的颜色/字重/时机不一致（见 B-01~B-04）。

---

## 2. 现有功能清单（As-Is）

判定图例：✅ 保留 · 🔧 优化 · ❌ 删除 · 🆕 重构时新增（见 §4）

### 2.1 全局与外壳

| ID | 功能 | 实现位置 | 说明 | 判定 |
|---|---|---|---|---|
| F-01 | 站点标题/副标题（读 `.env` 的 `VITE_APP_SITE_NAME/DESCRIPTION/KEYWORDS`） | `App.vue:274-296`、`.env` | keywords 对无 SEO 场景无意义 | 🔧 |
| F-02 | 顶部信息栏（渐变标题 + 描述） | `HeaderPanel.vue:1-99` | 与首页 Hero 职责重叠 | 🔧 |
| F-03 | 「功能亮点」4 张介绍卡 | `HeaderPanel.vue:100-227` | 硬编码营销文案，占据编辑器首屏 | 🔧 迁至落地页 |
| F-04 | 顶部 3 个操作卡（设计 / 预览 / 导出） | `HeaderPanel.vue:48-94` → `App.vue:481-485` | **点击后只 `console.log`，无任何行为** | ❌ |
| F-05 | 深色 / 浅色模式切换 | `HeaderPanel.vue:249-259`、`App.vue:487-491` | 状态存在 HeaderPanel 内部，刷新后丢失 | 🔧 |
| F-06 | GitHub 角标（Octocat） | `GithubCorner.vue` | 与新版导航冲突 | ❌ 由导航栏 Star 按钮替代 |
| F-07 | 页脚（GitHub / 博客 / 邮箱 + ICP 备案 + 公安备案） | `FooterPanel.vue` | 备案信息必须保留 | ✅ |
| F-08 | 全屏加载动画（转圈 + 进度条） | `LoadingScreen.vue`、`App.vue:573-605` | 进度为 `Math.random()` 伪造，且强制 `setTimeout(1000)` + `setTimeout(500)` | ❌ |
| F-09 | Vercel 统计注入 | `App.vue:233, 829` | 迁移后保留 | ✅ |
| F-10 | PWA/图标资产（favicon、apple-touch-icon、webmanifest） | `public/` | 保留 | ✅ |

### 2.2 背景（`BackgroundPanel.vue`，172 行）

| ID | 功能 | 参数 | 证据 | 判定 |
|---|---|---|---|---|
| F-11 | 背景类型切换 | 纯色 / 渐变 / 图片 | `BackgroundPanel.vue:645-674` | ✅ |
| F-12 | 纯色背景 | 取色器 + 40 色板 | `:677-694` | ✅ |
| F-13 | 背景透明度 | 滑块 0-100% | `:685-693` | ❌（画布先铺白底，调低只会变灰白，无实用价值；见 B-06） |
| F-14 | 渐变背景 | 起止双色 + 8 方向 | `:696-733` | 🔧（仅 2 色标、方向为离散 8 项） |
| F-15 | 图片背景上传 | 点击/拖拽，`image/*`，转 base64 存 state | `:735-749`、`App.vue:437-454` | 🔧（无体积上限、无格式校验、无 cover/contain 模式） |
| F-16 | 背景模糊 | 0-20px，`ctx.filter=blur()` | `:751-759`、`DefaultTheme.vue:494-498` | ✅ |
| — | 缺失：内置背景图库 / 图案（网格·噪点）/ 文字遮罩层 | | | 🆕 |

### 2.3 图标元素（`IconPanel.vue`，289 行）

| ID | 功能 | 说明 | 证据 | 判定 |
|---|---|---|---|---|
| F-17 | 手输 Iconify 图标代码 | 形如 `fluent-emoji-flat:four-leaf-clover`，输入框前缀实时预览 | `IconPanel.vue:363-378` | 🔧 |
| F-18 | 外链图标库 | 「图标库」按钮跳 `https://yesicon.app/` 新开标签 | `:374-377` | 🔧（改为站内搜索面板） |
| F-19 | 运行时拉取 SVG | `fetch('https://api.iconify.design/{code}.svg')` | `App.vue:401-434` | 🔧（URL 实测返回 200 可用，但每次按键触发一次请求、无防抖无竞态处理） |
| F-20 | 自定义图标上传 | 接受图片，≤2MB，栅格图 base64 内嵌进 `<svg>` 包装 | `IconPanel.vue:381-413, 579-639` | 🔧（刷新后丢失，见 B-08） |
| F-21 | 图标尺寸 / 阴影大小 / 阴影颜色 / XY 位置 | 20-300px、0-100px、取色器、0-100% ×2 | `:416-467` | ✅ |
| — | 缺失：图标旋转、描边、色调替换、多元素（同屏多个 sticker） | | | 🆕 |

### 2.4 标题文本（`TitlePanel.vue`，224 行）

| ID | 功能 | 说明 | 证据 | 判定 |
|---|---|---|---|---|
| F-22 | 标题文本 | 单行 `n-input`，靠空格排版（默认值 `"封面   制作"`） | `App.vue:330`、`TitlePanel.vue:269-277` | 🔧（不支持换行/自动换行，是排版上限） |
| F-23 | 字体下拉（10 项） | Maple Mono CN / Fira Code / Lato / Arial / Helvetica / 微软雅黑 / 苹方 / 思源黑体 / monospace / serif | `constant.ts:45-56`、`DefaultTheme.vue:48-73` | 🔧（多数中文字体依赖用户本机装，跨设备所见不同） |
| F-24 | 字号 / 颜色 | 16-200px 滑块、取色器 | `TitlePanel.vue:327-355` | ✅ |
| F-25 | 加粗 / 斜体 | 斜体用 `ctx.transform(1,0,-0.2,1,0,0)` 伪斜切；Maple Mono CN 加粗用 `strokeText` 描边模拟 | `DefaultTheme.vue:665-690` | 🔧（导出与预览描边宽度不一致，见 B-02） |
| F-26 | 立体字效果 | 0-10 滑块，同色 `shadowBlur/shadowOffset` | `DefaultTheme.vue:612-620` | ✅ |
| F-27 | XY 位置 | 两条 0-100% 滑块 | `TitlePanel.vue:357-387` | 🔧（改为画布直接拖拽） |
| — | 缺失：副标题/描述行、对齐方式、字间距、行高、渐变字色、描边字、自动缩放适配 | | | 🆕 |

### 2.5 水印（`WatermarkPanel.vue`，208 行）

| ID | 功能 | 说明 | 证据 | 判定 |
|---|---|---|---|---|
| F-28 | 水印文本/字体/字号/颜色 | 默认 `@baiwumm`，10-100px | `App.vue:349-367` | ✅ |
| F-29 | 透明度 | 0-100% | `WatermarkPanel.vue:562-575` | ✅ |
| F-30 | 加粗 / 斜体 / 大写 | `uppercase` 仅水印生效，标题类型里有但渲染忽略 | `DefaultTheme.vue:703-705` | 🔧 |
| F-31 | XY 位置 | 默认右下角 (98, 98) | `WatermarkPanel.vue:591-621` | 🔧（同 F-27 改拖拽） |
| — | 缺失：一键开关、图片/Logo 水印、平铺水印 | | | 🆕 |

### 2.6 主题 / 模板

| ID | 功能 | 说明 | 证据 | 判定 |
|---|---|---|---|---|
| F-32 | 主题选择弹窗（6 套） | 默认主题 / 蓝色渐变 / 暖阳夕照 / 森林绿意 / 星空夜景 / 梦幻粉彩；卡片式预览 + 需二次点「应用主题」 | `ThemeSelector.vue:72-332, 36-40` | 🔧 |
| F-33 | 主题数据硬编码在组件里 | 每套主题 ~40 行 JSON，含冗余默认值 | `ThemeSelector.vue:80-331` | ❌ → 抽为 `data/templates.ts` |
| — | 缺失：模板缩略图真实渲染、模板墙浏览、分类、用户自定义模板保存 | | | 🆕 |

### 2.7 导出与画布

| ID | 功能 | 说明 | 证据 | 判定 |
|---|---|---|---|---|
| F-34 | 导出平台预设（9 档） | 自定义 / 微信公众号 900×383 / 掘金 900×600 / 知乎 1080×607 / 阿里云 1000×600 / 腾讯云 960×540 / CSDN 1080×607 / 今日头条 900×500 / 简书 1250×1000；选中后锁死宽高输入 | `ExportPanel.vue:164-241, 22-33` | 🔧（预设是好资产，但预览画布不跟随，见 B-01） |
| F-35 | 自定义尺寸 | 宽 100-3840、高 100-2160 | `ExportPanel.vue:22-33` | 🔧（无宽高比锁定、无上限告警） |
| F-36 | 格式 | WebP / PNG / JPEG | `constant.ts:59-63` | ✅ |
| F-37 | 图片质量 | 0.1-1.0 滑块（仅 WebP/JPEG 有效，PNG 下无效但仍可拖） | `ExportPanel.vue:45-63` | 🔧 |
| F-38 | 文件名 | 自定义名 + 后缀提示 | `ExportPanel.vue:65-78` | ✅ |
| F-39 | 随机文件名 | 开关 + 长度 4-32 滑块 + 数字/小写/大写 3 个复选框 + 预览 + 刷新按钮 | `ExportPanel.vue:80-126, 282-310` | ❌（典型过度设计：封面文件名对用户无价值） |
| F-40 | 导出下载 | 新建离屏 canvas 重绘 → `toDataURL` → `<a download>` | `DefaultTheme.vue:818-1262` | 🔧（`toDataURL` 大尺寸内存峰值高，改 `toBlob`） |
| F-41 | 实时预览画布 | 固定 1920×1080 内层位图 + `width:100%` 缩放 | `DefaultTheme.vue:3-4` | 🔧 |
| F-42 | 参数变更弹簧动画 | 11 个属性各挂一套物理弹簧（刚度 200 / 阻尼 20），rAF 循环 | `DefaultTheme.vue:206-355` | 🔧（动效讨喜，但导致预览/导出取值不同源，见 B-03） |
| — | 缺失：复制到剪贴板、批量导出多尺寸、导出前尺寸/体积预估、URL 分享 | | | 🆕 |

### 2.8 配置管理

| ID | 功能 | 说明 | 证据 | 判定 |
|---|---|---|---|---|
| F-43 | 保存配置（手动） | 单槽 localStorage，剔除 `svg` 与 `imageObj` | `App.vue:607-639` | 🔧（改自动保存 + 多草稿；base64 图片仍写入，有配额风险） |
| F-44 | 启动恢复配置 | `onMounted` 里读回，重载图片与图标 | `App.vue:641-711` | ✅ |
| F-45 | 重置全部配置 | 二次确认弹窗，逐字段写回默认值 | `App.vue:209-224, 713-813` | 🔧（默认值在 3 处重复书写，应与常量同源） |
| — | 缺失：撤销/重做、历史版本、分享链接 | | | 🆕 |

---

## 3. 现存缺陷清单（重构必须一并解决）

| ID | 缺陷 | 证据 | 影响 |
|---|---|---|---|
| B-01 | **预览与导出比例不一致**：预览位图恒为 1920×1080，导出按目标平台重绘，且字号只按 `宽/1920` 单轴缩放，Y 位置按导出高度百分比计算 | `DefaultTheme.vue:3`、`:974, 1062, 1120, 1155` | 选微信公众号（2.35:1）或简书（1.25:1）时，导出结果与预览完全不同 —— 破坏了工具的核心承诺「所见即所得」，**最高优先级** |
| B-02 | **导出字重比预览细一半**：预览标题描边 `size*2*0.01`，导出为 `titleSize*0.01`（换算回预览单位即 `size*0.01`） | `DefaultTheme.vue:677, 686` vs `:1136, 1145` | 两份复制代码已发生漂移的直接证据 |
| B-03 | **导出取值与预览不同源**：预览读弹簧中间态 `animationStates.*.value`，导出读 `props.*` 目标值；动画未结束时导出会错位 | `DefaultTheme.vue:381-399` vs `:979-1005` | 拖动滑块后立即导出 → 位置与看到的不符 |
| B-04 | 主题里渐变方向写成 `'to-bottom-right'`，与常量 `'to bottom right'` 不匹配，永远落到 `default` 分支；方向下拉框显示为空值 | `ThemeSelector.vue:88,131,174,217,260,303` vs `constant.ts:14` | 换主题后方向设置丢失 |
| B-05 | `inject('isDarkMode')` 无对应 `provide`，主题弹窗深浅色判断恒走兜底分支；深色模式不持久化，与 HeaderPanel 内部状态各持一份 | `ThemeSelector.vue:51-58`、全项目无 `provide(` | 深色模式下弹窗样式错乱 |
| B-06 | 背景 `opacity` 语义无效：`getContext('2d',{alpha:false})` + 先铺白底，透明度只让背景发灰 | `DefaultTheme.vue:418-437` | 无效控件 |
| B-07 | `forest-green` 主题 `opacity: 200`（超出 0-100） | `ThemeSelector.vue:213` | 数据未校验 |
| B-08 | 上传的自定义图标只存在组件内 `ref` 与未持久化的 `svg` 字段，刷新即丢 | `IconPanel.vue:500, 588-617` + `App.vue:614-616`（保存时剔除 svg） | 功能不可用 |
| B-09 | 图标代码输入框每次 `input` 都发一次 Iconify 请求，无防抖、无竞态取消 | `IconPanel.vue:368-369`、`App.vue:411` | 连续输入产生乱序响应，图标闪烁/错配 |
| B-10 | 主题应用是 `Object.assign` 增量合并，未被主题覆盖的字段保留旧值（`blur`、`image` 等） | `App.vue:501-540` | 「应用主题」结果不可预期 |
| B-11 | `ExportPanel` 维护 `localExportConfig` 本地副本 + `watch` 双向回填父级，父子状态各一份 | `ExportPanel.vue:247-330` | 同步逻辑复杂，历史已出过「平台选择不保持」的 bug（commit `f6eecd2`） |
| B-12 | `html2canvas` 声明为依赖但全项目零引用 | `package.json` + 全量 grep | 白占 ~44KB gzip |
| B-13 | 顶部卡片、加载进度、`handleHeaderAction` 等存在「看起来能用其实没接线」的空操作 UI | `App.vue:481-485`、`LoadingScreen.vue:789-796` | 拉低可信度 |

---

## 4. To-Be 功能需求（增 / 删 / 改）

优先级：P0 = 本次重构必做 · P1 = 强烈建议 · P2 = 可选增强

### 4.1 删除（做减法，直接降低实现与认知成本）

| ID | 删除项 | 理由 |
|---|---|---|
| D-01 | F-13 背景透明度 | 语义无效（B-06），保留 F-16 模糊 + 新增「文字遮罩层」替代其真实需求 |
| D-02 | F-39 随机文件名全套（长度滑块 + 3 个字符集复选框 + 预览 + 刷新） | 过度设计；文件名默认用「标题文本 slug + 时间戳」 |
| D-03 | F-04 顶部 3 个空操作卡 | 从未接线（B-13） |
| D-04 | F-08 加载动画与人为 `setTimeout(1000/500)` | 伪造进度且拖慢首屏 |
| D-05 | F-06 GitHub 角标、F-02/F-03 编辑器内的大标题栏与功能亮点卡 | 落地页承担营销，编辑器首屏 100% 留给画布 |
| D-06 | `html2canvas` 依赖 | 未使用（B-12） |
| D-07 | F-42 弹簧物理动画系统（约 150 行） | 收益低于代价；预览改 CSS/直接重绘，导出统一读目标值以消除 B-03 |
| D-08 | 手工深色模式 class 三元判断（`isDarkMode ? '…' : '…'` 全文散布）+ `main.css` 里 8 条 `.dark-mode` `!important` 覆盖 | 换 `next-themes` + Tailwind `dark:` 变体，一处定义 |

### 4.2 优化（保留能力，重做实现）

| ID | 优化项 | 目标形态 |
|---|---|---|
| M-01 | **单一渲染器**（最高杠杆） | 一个纯函数 `drawScene(ctx, scene, { width, height, scale })`，预览、导出、模板缩略图三处共用，从根上消灭 B-01/B-02/B-03 |
| M-02 | **预览画布跟随导出比例** | 切换平台预设时预览实时重算宽高比（含 9 档预设），并显示安全区/参考线 |
| M-03 | **状态管理** | 单一 `Scene` 对象（见 §6.3）+ zustand；删除面板内本地副本（B-11）；默认值只定义一处（B-45/F-45） |
| M-04 | 图标获取 | 站内 Iconify 搜索面板（官方 search API + 结果缓存 + 热门集合），替代「手输 code + 外链 yesicon」；请求加防抖与 `AbortController`（B-09） |
| M-05 | 字体 | `@font-face` + 仓库内 woff2 子集（regular **和 bold**）自托管，中英文分别设字体栈；Canvas 绘制前 `await document.fonts.load()` 而非量宽猜测（替换 `DefaultTheme.vue:75-117`）。⚠️ 提供 700 字重可同时删掉 v1 的 `strokeText` 伪加粗（`DefaultTheme.vue:673-690`）并消灭 B-02 |
| M-06 | 主题 → 模板系统 | 主题从组件搬到 `data/templates.ts` 纯数据；应用模板 = **整体替换 Scene**（修 B-10）；模板缩略图用同一渲染器离屏生成，保证「看到即得到」 |
| M-07 | 图片上传 | 统一上传器：类型/体积校验 + 客户端降采样（长边 ≤1920）+ 转 WebP（q≈0.82）后以 dataURL 存 `localStorage`。~~IndexedDB~~ **已否决（D-24）**：降采样后单图 <500KB，5MB 配额够用，不为省 40 行代码引一个新存储层 |
| M-08 | 自定义图标持久化 | Iconify 存 `code`、上传图存降采样后的 dataURL，两者都进 Scene 因而自动持久化（修 B-08；不引 IndexedDB，见 D-24） |
| M-09 | 导出 | `canvas.toBlob` + `URL.createObjectURL`（替代 `toDataURL`）；质量滑块在 PNG 下自动禁用；导出前显示预估尺寸 |
| M-10 | 深色模式 | `next-themes` 统一管理 + 持久化（修 B-05） |

### 4.3 新增（直接服务「操作便捷」与「高颜值」）

| ID | 新增项 | 优先级 | 理由 |
|---|---|---|---|
| N-01 | **画布直接拖拽/缩放定位**（拖动标题、图标、水印；方向键微调；吸附中线与边缘） | P0 | 16 个滑块参数里有 6 个是 XY 位置（F-21/F-27/F-31）—— 用一维滑块模拟二维拖拽，是本次最大的一笔便捷性收益 |
| N-02 | **模板墙**（首屏可见、分类、实时缩略图、一键套用） | P0 | 「高颜值」的主要交付方式：用户要的是选一个好看的，而不是从零调 20 个参数。现有 6 套主题是雏形（F-32） |
| N-03 | **多行文本 + 自动换行 + 自适应字号** + 对齐/字间距/行高 | P0 | 单行文本（F-22）限制了所有真实封面排版 |
| N-04 | URL 携带配置（hash 序列化 Scene → 可分享/可回填/可作模板链接） | P1 | 零后端即可分享与「回到上次的作品」，契合静态部署现状 |
| N-05 | 自动保存 + 撤销/重做（`⌘Z` / `⌘⇧Z`） | P1 | 替代 F-43 的手动「保存配置」，是编辑器的基本手感 |
| N-06 | 复制到剪贴板 / 拖拽上传 / 快捷键面板 | P1 | 便捷性；「下载→粘贴到公众号后台」少两步 |
| N-07 | 内置精选背景（渐变色板 + 网格/噪点/光斑图案 + 文字遮罩层） | P1 | 保证纯白/纯黑背景下文字始终可读，也是替代 D-01 的方案 |
| N-08 | 落地页视觉件：动态光束背景、文字入场动效、pill 导航、CTA 卡 | P1 | 与 §5.4 的视觉参考要求直接对应 |
| N-09 | 一键多尺寸批量导出（同 Scene 出全部平台） | P2 | 需 M-01/M-02 完成后成本极低 |
| N-10 | 元素层：同屏多个 sticker/图片、旋转、层级 | P2 | 先确认需求，避免一步跳到通用图层系统（见 §6.3 取舍） |
| N-11 | 导出 SVG / 透明底 PNG | P2 | 按需 |

---

## 5. 技术栈评估：Next.js + Hero UI + lucide

### 5.1 Next.js —— ✅ 合理，但要用对模式

**成立的理由**
1. 与视觉参考项目 `E:\personal-project\ogimg` 同栈（Next 16 + React 19 + Tailwind 4），动效件（ogl 光束、BlurText）、导航壳可直接复用，这是「高颜值」最快路径。
2. **自托管字体**（✅ 最终采用 `@font-face` + 仓库内 woff2 子集，**不走 `next/font/google`**），正面解决 M-05 的字体可靠性问题。原判断需修正：`next/font/google` 在**构建期**要访问 Google 字体服务，与 Cloudflare Workers 托管环境（构建位置不可控）以及本项目字体源（原挂在自建 `cdn.baiwumm.com`，`index.html:1016`）都不匹配。落地做法照搬 `better-admin/apps/next/src/styles/fonts.css`：手写 `@font-face` + `public/fonts/*.woff2`（GB2312 子集）+ `unicode-range` + `font-display: swap`。
3. 部署链路不变：当前已是 Vercel + Cloudflare 的静态托管，Next 静态产物可无缝替换现有 SPA，DNS/备案/统计均无需改动。

**需要注意（重要）**
- **本项目不需要 SSR/RSC。** 封面编辑器是纯客户端（Canvas、FileReader、localStorage 全在浏览器），且明确无 SEO 要求 —— SSR 只带来运行时成本与心智负担。建议 `next.config` 用 `output: 'export'` 纯静态导出，编辑器页全部标 `'use client'`。这也让 §5.2 中 HeroUI 的 SSR 兼容风险基本不构成问题。
- 若坚持静态导出，则 `app/sitemap.ts`、Route Handler、`@vercel/analytics/next` 的服务端部分等需替换（分析可继续用客户端注入，或按最近一次 commit 的方向保持现状）。
- 静态导出下 OG 图不能用 `ImageResponse`（那是 Edge 运行时能力）。但本项目本来就产图而非消费图，影响为零。

### 5.2 Hero UI —— ⚠️ 选型的主要风险点（**最终被否决，以下保留作决策依据**）

> 结论：全站改用 shadcn/ui（C-01）。下面三条缺口后来在 shadcn 上同样存在（官方注册表实测同样无取色器 / 无 dropzone），差别在于 shadcn 是「拷源码进仓库 + Radix 底座」，可与 ogimg 观感直接对齐，且无新库成熟度风险。

**有利面**
- v3（2026-07-09 正式发布）从零重写，React 19 + Tailwind CSS v4 原生（与 M-08 的 `dark:` 方案同代），组件默认样式完成度高 —— 少写自定义 CSS 就能好看，正好对上「高颜值」。
- 覆盖本项目需要的通用件：Button / Card / Tabs / Modal / Drawer / Select / Dropdown / Slider / Tooltip / Switch / Chip / Accordion。

**风险面（按严重度排序）**
1. **没有 ColorPicker。** 已确认官方文档组件列表无取色器。而本工具有 **6 处取色**（背景色、渐变起止 ×2、图标阴影色、标题色、水印色），取色器是编辑器的第一高频控件。必须额外引入（建议 `react-colorful`，体积极小、无依赖、样式可控），或用 HeroUI 的 Popover 自己拼 —— 后者就是重新造一个控件。
2. **没有 Dropzone/文件上传。** 背景图与自定义图标两处上传（F-15/F-20）需自行实现，建议 `react-dropzone` 或原生 `<input type=file>` + 拖拽事件包一层。
3. **v3 太新（发布约 2.5 个月）。** v2→v3 是完全重写，意味着：中文社区资料稀少、第三方示例与 AI 辅助编码的语料基本还停留在 v2、破坏性变更与 issue 响应节奏不可预期。对「靠快速迭代调出好看界面」的项目，这个成本会体现在每一次搜索上。
4. **视觉参考不是 HeroUI 风格。** `ogimg` 用的是 shadcn/ui + Radix + motion + ogl（`components.json`、`components/ui/*`）。要用 HeroUI 复刻 ogimg 的观感（细虚线描边、黑白单色、pill 按钮、大留白），得覆盖 HeroUI 的默认设计语言 —— 等于放弃 HeroUI 最大的卖点（开箱即美）。
5. 附带：HeroUI 主题走 CSS 变量 + provider，与 Tailwind `dark:` 变体是两套机制，接入 `next-themes` 时要确认静态导出下的 hydration 处理。

**我的倾向（供你拍板）**
> 编辑器主体控件走 **Radix/shadcn 路线**（与 ogimg 参考一致、无 SSR 顾虑、控件可完全定制），HeroUI 只保留在**落地页外壳**（Button / Card / Tabs / Tooltip 这类「拿来就比自绘好看」的件）。
> 理由：本项目的差异化价值在 **Canvas 渲染 + 拖拽交互 + 模板数据**，这三块 HeroUI 一个都帮不上；而它在通用控件上的优势，又和 ogimg 的极简风格相互抵消。控件层做一次薄封装（`components/controls/*`）隔离 UI 库，将来换库只动一个目录。
> 若你已决定全站 HeroUI，也完全可行，只需把第 1、2 条的外部依赖（`react-colorful` + `react-dropzone`）纳入基线，并锁死 v3 的精确版本号。

### 5.3 lucide —— ✅ 合理，但有个必须划清的边界

- **UI 图标**（导航、面板 tab、按钮前缀、深浅色切换、撤销重做）用 lucide：tree-shaking 友好、风格统一、currentColor 随主题 —— 这部分无保留意见。
- **封面内容里的图标不能用 lucide。** 现在封面中心的图形来自 Iconify（20 万+ 多风格图标，含 `fluent-emoji-flat` 等彩色集，`App.vue:411`），这是产品内容而非界面装饰；lucide 只有单色线性图标，替代不了。重构后需明确：**lucide 管外壳，Iconify 管画面**（建议 `@iconify/react` + 搜索结果缓存，替换现有裸 `fetch`）。
- 现有代码里 UI 图标是 `material-symbols:*` 等前缀硬编码约 87 处，迁移到 lucide 是纯机械替换，注意别把 `previewIcon: 'fluent-emoji-flat:*'`（主题预览，属于画面）一起换掉。

### 5.4 其他建议入栈的依赖（都是为对齐 ogimg 观感）

| 用途 | 建议 | 说明 |
|---|---|---|
| 状态 | `zustand`（+ `immer`） | 替代 props/emit 镜像，见 M-03 |
| 动效 | `motion`（framer-motion 续作，ogimg 已在用） | Hero 入场、面板过渡 |
| 背景动效 | `ogl` 光束（`ogimg/components/background/light-ray.tsx`，469 行可直接搬） | ogimg 观感的核心来源 |
| 文字动效 | `BlurText` + `TextGenerateEffect`（ogimg 已有） | Hero 标题 |
| 主题 | `next-themes` | 修 B-05 |
| 工具 | `clsx` + `tailwind-merge` + `cva` | 与 ogimg 的 `lib/utils.ts` 一致 |
| 代码检查 | Biome（ogimg 用）或沿用 ESLint 9 | 二选一，别同时留 |

---

## 6. 页面结构规划

### 6.1 首页 `/`（落地页，视觉参考 ogimg）

```
app/
  layout.tsx                 # next-themes + 字体 + 分析
  page.tsx                   # 'use client'，纯静态导出
components/landing/
  navbar.tsx                 # 固定顶部 pill 导航：Logo + 深浅色 + [开始设计]
  hero.tsx                   # ★ 核心区
  template-gallery.tsx       # N-02 模板墙
  features.tsx               # 3 卡（承接原 F-03 的文案资产）
  steps.tsx                  # 选模板 → 改文字 → 一键导出
  faq.tsx / footer.tsx       # 含 ICP + 公安备案（F-07 必留）
components/background/
  light-ray.tsx              # 移植 ogimg 光束背景
```

**Hero 结构（自上而下）**
1. 徽章 pill：`免费 · 开源 · 中文封面设计工具`
2. 主标题（`BlurText`，5xl→7xl）：**「几秒钟，做一张好看的封面」**
3. 副文案（`TextGenerateEffect`）：一句话讲清「公众号 / 掘金 / 知乎 / CSDN 尺寸一键适配」
4. **双按钮**：
   - 主按钮 `开始设计 Start Designing`（pill、`size="lg"`、`ArrowRight` 悬停位移）→ `Link href="/editor"`
   - 次按钮 `Star on GitHub`（描边 pill，`<Github size={18}/>`）
5. 产品截图（真实导出图，虚线描边 + 大投影，`ogimg` 同款处理）

> 按钮文案/交互直接对齐参考实现 `ogimg/components/landing/hero.tsx:66-83`（`Start Designing` → `/editor`），这也是你要求的「参考 Start Designing」。

### 6.2 制作页 `/editor`

```
app/editor/page.tsx                # 'use client'，编辑器全占首屏
components/editor/
  editor-shell.tsx                 # 顶栏 + 工具栏 + 画布区，三栏骨架
  canvas-stage.tsx                 # 画布 + 拖拽热区 + 参考线（N-01）
  export-dialog.tsx                # 平台预设/格式/质量/文件名（P0）
  template-drawer.tsx              # 侧边模板抽屉（N-02）
  panels/{background,element,title,watermark}.tsx
  controls/{color-field,slider-field,asset-dropzone,font-select}.tsx   # ★ UI 库隔离层
lib/
  scene.ts                         # Scene 类型 + 默认值（唯一定义处）
  render/draw-scene.ts             # ★ 唯一渲染器（M-01）
  render/export.ts                 # toBlob / 剪贴板 / 批量
  storage/{autosave,history,share-url}.ts
  iconify.ts                       # 搜索 + 缓存 + 取消
data/templates.ts                  # 模板纯数据（M-06）
```

**布局（桌面）**
- **顶栏**：返回首页 · 平台/尺寸选择器（改这里 → 预览比例立即跟随，M-02） · 撤销/重做 · 深浅色 · `导出`（主按钮，唯一强调色）
- **左侧工具栏**：Tabs（背景 / 元素 / 文字 / 水印 / 导出）。相较现状的改进：把 XY 双滑块换成「拖动画布 + 数字微调」；配色控件收进 `controls/color-field`
- **中央画布**：跟随目标比例，棋盘格衬底、安全区参考线、选中元素描边、直接拖拽
- **右侧（可折叠）**：模板抽屉（N-02）
- **移动端**（结论已变更）：**不做响应式编辑器**。`/editor` 检测到触屏或窄视口时渲染「请在 PC 端使用」提示卡；落地页保持移动端可浏览。见 `AGENTS.md` R-22 / 计划 D-22

### 6.3 Scene 数据模型草案（单一数据源）

```ts
type Scene = {
  format: { presetId: string; width: number; height: number }   // 驱动预览比例，修 B-01
  background:
    | { kind: 'color'; color: string }
    | { kind: 'gradient'; from: string; to: string; angle: number }   // 连续角度替代 8 档
    | { kind: 'image'; assetId: string; fit: 'cover' | 'contain'; blur: number; overlay: number }
  logo:      { asset: AssetRef; size: number; x: number; y: number; shadow?: Shadow } | null
  title:     { text: string; fontId: string; size: number; autoFit: boolean;
               color: string; align: 'left'|'center'|'right';
               lineHeight: number; letterSpacing: number; style: TextStyle } | null
  subtitle:  { /* 同 title 结构 */ } | null                        // N-03
  watermark: { text: string; fontId: string; size: number; color: string;
               opacity: number; x: number; y: number } | null      // 支持 null = 一键关
  // AssetRef = { kind:'iconify'; code:string } | { kind:'upload'; dataUrl:string }（降采样后内联，不引 IndexedDB）
}
```

> ⚠️ 本段是**草案**。已冻结的权威契约在 `docs/implementation-plan.md` §3（含 `TextStyle`/`TextBlock` 拆分、`version: 2`、比例与像素分离、以及「所有 px 值以画布高度 1080 为基准」的单位约定）。两处冲突时以计划为准。

**取舍说明**：这里刻意用**固定槽位**（logo / title / subtitle / watermark）而不是通用图层数组。理由：槽位方案让模板保持「纯 JSON、可 diff、可版本管理」，渲染器和拖拽命中测试都简单得多；通用图层系统会把本次重构变成一个小 Figma（N-10 留待真实需求出现再议）。

---

## 7. 判断依据汇总

| 结论 | 依据 |
|---|---|
| 「所见即所得」是当前最大缺陷，优先修 | 预览位图恒 1920×1080（`DefaultTheme.vue:3`），导出按平台尺寸重绘且字号单轴缩放（`:974,1062,1155`），9 档平台预设里 5 档不是 16:9 —— 用户选的正是这些非 16:9 平台 |
| 预览/导出必须收敛为一个渲染器 | 同一套绘制写了两遍（`:406-783` 与 `:834-1242`），已经漂移出字重差异（B-02）与动画取值差异（B-03） |
| 滑块系统应让位于画布直接操作 | 全项目共 17 处滑块实例（16 个参数），其中 6 处是一维滑块在调二维位置（`TitlePanel:357-387`、`WatermarkPanel:591-621`、`IconPanel:447-467`）；位置语义还是带边距补偿的百分比分段函数（`DefaultTheme.vue:629-663`），用户无法预判落点 |
| 模板/主题是最该投入的方向，且要从代码变数据 | 现有 6 套主题已验证该交互有价值，但硬编码 300+ 行在组件里（`ThemeSelector.vue:72-332`）、套用是增量合并（B-10）、缩略图靠 CSS 假渐变而非真实渲染 —— 三点都在说明它「做了一半」 |
| 删掉随机文件名、背景透明度、加载动画 | 分别属于：用户不可见价值的复杂度（`ExportPanel:80-126`，5 个控件）、数学上无效的控件（B-06）、伪装进度的负收益代码（`LoadingScreen` 随机进度 + `App.vue:576,587` 强制 1.5s 等待） |
| Next.js 用静态导出而非 SSR | 全部能力在客户端（Canvas/FileReader/localStorage）+ 明确无 SEO 要求 + 当前线上就是 Vercel/CF 静态托管（响应头已验证） |
| HeroUI 需补 ColorPicker / Dropzone | 官方 v3 文档组件列表无取色器（已核实），而本工具 6 处取色、2 处上传 |
| lucide 只替换 UI 图标，Iconify 必须保留 | `App.vue:411` 拉的是封面画面内容（彩色 emoji 集），lucide 无对应能力 |
| 字体必须自托管 | 唯一入口是 `cdn.baiwumm.com` 外链（`index.html:1016`），且 `DefaultTheme.vue:75-117` 用「量文本宽差值」猜字体是否加载完，导出时可能仍拿到兜底字体 |

---

## 8. 决策结论（已全部拍板，2026-09-20）

| 编号 | 议题 | 结论 |
|---|---|---|
| C-01 | UI 库范围 | **全站 shadcn/ui**（Radix 底座）+ lucide。放弃 HeroUI |
| C-02 | Next 渲染模式 | **`output: 'export'` 纯静态**，无任何服务端能力 |
| C-03 | 元素模型 | **固定槽位 Scene**，不做通用图层 |
| C-04 | 编辑器信息架构 | **支持多行文本块**（含 CJK 禁则断行 + 自适应字号） |
| C-05 | 存量资产 | **不迁移** v1 配置，全面重构不兼容旧状态 |
| C-06 | 旧仓库处置 | **直接在 `main` 开发**（备份分支已建），旧代码与旧品牌资产全删 |
| 追加 | 部署目标 | **Cloudflare Workers Static Assets**（替代现 Vercel origin），仅产出配置不代为部署 |
| 追加 | 统计 | **全部删除**（CF 托管自动统计），`@vercel/analytics` 不迁移 |
| 追加 | 字体 | `@font-face` + woff2 子集入仓（照搬 better-admin 模式），**需提供 400 + 700 双字重** |
| 追加 | 移动端 | 不做编辑器响应式，`/editor` 给「请在 PC 端使用」提示 |
| 追加 | 语言 / 版本 | 纯中文；从 `2.0.0` 起，保留 release-it 流程 |

> 完整决策编号 D-01…D-32、平台预设终值表、分阶段任务与验收标准见 `docs/implementation-plan.md`；工程约束见 `AGENTS.md`。

---

## 9. Cloudflare Workers 部署约束（新增章节）

| 项 | 事实 / 约束 |
|---|---|
| 托管形态 | Next 静态产物 `out/` → Workers Static Assets（`assets.directory`），**无需 Worker 脚本、无需 OpenNext** |
| 平台限制（已核实） | 单文件 ≤ **25 MiB**；免费计划 ≤ **20,000** 个文件（付费 100,000）；bundle ≤ 64 MiB（2026-09 起免费同档）→ 3.5MB 量级的中文字体切片完全够用 |
| `next/image` | 默认优化器不存在 → 只用原生 `<img>` + 预压缩静态图（R-14） |
| `next/font/google` | 构建期需访问 Google，托管环境不可控 → 改仓库内 `@font-face`（R-15） |
| 路由命中 | `output:'export'` 产 `editor.html`，与 Assets 的 URL 规范化/`not_found_handling` 组合**需实测** → 对策 `trailingSlash: true`，Phase 8.3 用 `wrangler dev` 验证 |
| HTTP 头 | `public/_headers`：字体 `max-age=31536000, immutable`、HTML `no-cache`、加基础安全头；**不加 CSP**（与静态导出内联脚本冲突，不值得首版搞） |
| 备案与线路 | 域名备案信息保留在页脚。origin 由 Vercel 换到 Workers **不改变备案接入现状**（两者都是海外节点），不要把它当成"改善国内访问"的手段，实际快慢取决于线路 |
| 边界 | 代理只写配置与脚本，**不执行 `wrangler login` / `deploy`**（R-17） |
