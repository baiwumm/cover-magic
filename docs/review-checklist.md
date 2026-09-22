# 项目审查清单（2026-09-22）

只读审查结果落盘。按严重程度分级；每条含 `文件:行号`、问题、建议。  
架构总评：R-1 / R-2 / R-3 / R-4 / R-7 / R-10 / R-11 / R-20 / R-21 执行扎实，未发现第二份绘制实现；问题集中在交互状态机、错误反馈、落地页首屏。

---

## P0 · 必须尽快修

### P0-1 移动端拦截缺失（违反 R-22 / D-22）
- **位置**：`app/editor/page.tsx`、`components/editor/editor-shell.tsx`（计划 7.1 的 `mobile-gate.tsx` 未实现）
- **问题**：手机打开 `/editor` 直接渲染三栏编辑器，布局破碎、可误触修改场景。
- **建议**：触屏或窄视口渲染「请在 PC 端使用」提示卡（含复制桌面链接）。
- **状态**：已修（2026-09-22）— `components/editor/mobile-gate.tsx` + `app/editor/page.tsx` 分支；计划 7.1 已勾选

### P0-2 启动恢复污染撤销栈 + autosave 联动 → 存档可被一次误撤销覆盖
- **位置**：`app/editor/page.tsx:45-76`、`stores/scene-store.ts:32-45`
- **问题**：
  1. `replaceScene(loadStoredScene())` 把初始状态压入 zundo `pastStates`，零操作时撤销已可用；
  2. 误点撤销回退到默认模板后，400ms debounce 把默认模板写入 localStorage，刷新后原存档丢失；
  3. 恢复完成前就排了首帧 `saveSceneDebounced`，慢解码时序下可能先用默认场景覆盖存档；
  4. autosave 的模块级 timer 在 effect cleanup 中未取消。
- **建议**：恢复完成后 `temporal.getState().clear()`；加 `hydrated` 门闩，恢复完成前不排保存；cleanup 里 `clearTimeout`。
- **状态**：已修（2026-09-22）— `autosave.ts` 的 `markHydrated`/`cancelPendingSave` + `page.tsx` 恢复链路

---

## P1 · 功能缺陷 / 高频路径

### 编辑器

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P1-3 | `canvas-stage.tsx:277-325` | 全局 keydown 与 Radix 控件冲突：忽略名单仅 `INPUT\|TEXTAREA\|SELECT`，方向键调 Slider/Tabs 时同时微调选中元素；按钮上 Backspace 清空槽位；Tab 无条件 `preventDefault` 导致面板按钮无法 Tab 到达 | 加 `e.defaultPrevented`；快捷键仅画布聚焦时启用 — 已修（2026-09-22） |
| P1-4 | `panels/title.tsx:9` | 主标题被 Delete 后返回 `null` 且无「添加」按钮（副标题/水印有）→ 空态死路 | 照抄 Subtitle 空态 + 工厂默认值 — 已修（2026-09-22） |
| P1-5 | `stores/scene-store.ts:41-44` | 历史零时间合并：滑块逐 tick、取色逐移动、文本逐键各入栈，50 步瞬间被淹没 | zundo `handleSet` 做 300–500ms 窗口合并 — 已修（2026-09-22，400ms） |
| P1-6 | `panels/export.tsx:36-49` | 导出 `try/finally` 无 catch，SecurityError/toBlob 失败静默 | `catch` + `toast.error` — 已修（2026-09-22） |
| P1-7 | `subtitle/watermark/background.tsx` | 三处内联整份默认配置，违反 R-10；水印硬编码 `@baiwumm` 未用 `constants/site.ts` | `lib/scene.ts` 暴露工厂函数 |
| P1-8 | `lib/storage/share-url.ts:68-70` | 分享解码只查 `version !== 2`，不复用 `isLegalScene`；畸形 hash 可致画布永久空白无提示 | 统一校验 + 失败 toast — 已修（2026-09-22） |
| P1-9 | 全仓库 | 撤销无 `Ctrl+Z` / `Ctrl+Shift+Z`（计划 7.2） | 补快捷键，输入框内让位原生 — 已修（2026-09-22） |
| P1-10 | `canvas-stage` ↔ `editor-shell` | 画布选中与左栏 Tab 不联动 | `selected` 提升到 store，选中自动切 Tab — 已修（2026-09-22） |
| P1-11 | `slider-field.tsx:44-47`、`top-bar.tsx:98-110` | 数字输入逐键 clamp，清空变 min、无法可靠键入 | 本地 draft + blur/Enter 提交 — 已修（2026-09-22，`controls/number-input.tsx`） |
| P1-12 | `logo.tsx:137` vs `canvas-stage.tsx:29` | logo 尺寸上限 600 vs 800 不一致 | 共享 `LOGO_SIZE_RANGE` |
| P1-13 | `canvas-stage.tsx:75-82,248` | 拖动每个 pointermove 无条件重设 `canvas.width/height` + 双重文本排版 → 掉帧 | 尺寸未变跳过 resize；rAF 合并；缓存 rects |
| P1-14 | `top-bar.tsx:98-110` | 导出宽高无 max，超画布上限时失败又被 P1-6 吞掉 | clamp ≤8192 或校验面积 |
| P1-15 | `export.tsx` + `editor-shell.tsx` | 导出格式/质量/文件名是面板 local state，Tabs 卸载后重置 | 状态提升或 `forceMount` |
| P1-16 | `template-drawer.tsx:88-91` | 用 `Badge`(span) 做 SheetTrigger，键盘不可聚焦 | 改 Button 或补 `tabIndex`/角色 |

### 落地页

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P1-17 | `app/layout.tsx:25-38` | 根布局 preload 两字重 ≈3.3MB；与 AGENTS R-15「仅 /editor preload」不一致（D-35 已决策但文档未同步） | 按 D-35 更新 R-15，或评估落地页是否需预载 — 已修（2026-09-22，R-15 + D-35 文档同步） |
| P1-18 | `hero.tsx:25-28` + `text-generate-effect.tsx` | H1 渐变是每字一份，整行呈 6 段重复色带 | 渐变移到父级容器 — 已修（2026-09-22，`stagger={false}` 整行入场） |
| P1-19 | `hero.tsx:27` | 浅色模式 sky-400/indigo-400 对白底对比度 <3:1 | 浅/深两套色阶 — 已修（2026-09-22，浅 blue/sky/indigo-600·500，`dark:` 保留原 500/400/400） |
| P1-20 | `template-gallery.tsx:66-88` | 文案「一键套用」但缩略图不可点、无入口 | 包 `Link href="/editor?template=id"` 或改文案 — 已修（2026-09-22，编辑器恢复链读 `?template=`，hash > template > 存档） |
| P1-21 | `page.tsx` + `light-ray.tsx` | 光束无 `prefers-reduced-motion`；IO 暂停分支恒不可达；移动端常驻全屏 WebGL | reduced-motion 跳过；触屏降 dpr/静态化；修或删假 IO — 已修（2026-09-22，删 IO；reduce 不启 WebGL；coarse → dpr1 + 单帧） |

### 渲染 / 存储

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P1-22 | `autosave.ts` / `page.tsx:74` | 恢复完成前就排首帧保存（见 P0-2） | `hydrated` 门闩 — 已修（并入 P0-2） |
| P1-23 | `share-url.ts` | 分享无长度守卫，含图 Scene 可超 URL 上限，对方打开失败静默落本地存档 | 编码后超阈值 toast 警告 — 已修（2026-09-22，`SHARE_URL_WARN_LENGTH=8000` + 分享按钮 warning） |
| P1-24 | `icons.ts:87-99` | `preloadSceneAssets` 失败忽略 → 导出缺 Logo 无提示 | 返回失败清单，导出前检查 — 已修（2026-09-22，返回 `string[]`，`renderToCanvas` 失败即 throw） |
| P1-25 | `autosave.ts:53-55` | 配额超限静默失败，刷新全丢无感知 | 一次性 toast + 未保存标记 — 已修（2026-09-22，一次性 error toast；持久未保存角标暂不做，避免扩 UI） |

---

## P2 · UI / 排版 / 文案 / 打磨

### 落地页排版文案

- `features.tsx` 无 `h2`，朗读结构从 h1 直跳卡片；同级 h2 两套字号（`text-3xl` vs `md:text-4xl`）→ 统一 — ✅ 已修（2026-09-22，补 h2 + 全站 `text-3xl md:text-4xl`）
- `hero.tsx:31-34` JSX 换行在中文里并入多余半角空格（「断行、 平台尺寸」） — ✅ 已修（改单行字符串字面量）
- `steps.tsx:31` 序号 `text-muted-foreground/40` 对比度约 1.9:1 — ✅ 已修（全量 muted-foreground）
- `features.tsx:39-42`「离线优先」不成立（无 SW），改「本地优先 / 数据不出浏览器」 — ✅ 已修
- `footer.tsx:49`「Built by」违反纯中文界面 → 「由 baiwumm 构建」 — ✅ 已修
- `features.tsx:58` 非交互卡片 `hover:bg-accent` 制造可点错觉 — ✅ 已修（移除 hover）
- Hero 主图 `showcase.webp` 是孤立成品，看不出产品本身 → 换编辑器界面截图或多图拼贴 — ⏸ 待素材（需新截图，非代码可解）
- 彩色渐变/光束与 R-19 边界建议在 AGENTS 记一条「落地页装饰色例外」 — ✅ 已修（R-19 例外条款）
- 缩略图源宽 320 偏软 → 传 `width: 640`；隐藏项仍生成缩略图；`ensureThumbnails` 无 `.catch` — ✅ 已修（默认 640 + matchMedia 不挂载隐藏项 + 两处 catch）

### 编辑器 P2

- 遮罩关闭即写死 `overlay=0`，再开固定 0.35，自定义值丢失 — ✅ 已修（ref 记忆上次强度）
- 换 logo 重置 size/x/y，位置白调 — ✅ 已修（保留已有 logo 尺寸/位置）
- 缩放手柄仅 10px 小方块、无 resize 光标，可发现性差 — ✅ 已修（12/14px + nwse-resize + 白描边）
- 画布首帧/字体 await 期间空白无 loading 态（易被误判 bug，R-23） — ✅ 已修（首帧 spinner）
- Iconify 离线与「无结果」都显示「没有找到匹配的图标」 — ✅ 已修（searchIcons 上抛，UI 分流文案）
- `text-style-editor` 的 `slot` prop 声明未用 — ✅ 已修（删除 prop 与三处传参）
- 模板套用后 `presetId` 常为 `"custom"`，顶栏显示与实际尺寸不符 — ✅ 已修（`matchPresetId` 按尺寸反查显示）
- R-4 数据层：hash 载入可让 `exportSize` 与 `ratio` 分叉 → 载入时按 ratio 重算 — ✅ 已修（`alignExportSize`）
- 「刷新预估体积」是陈旧快照，改格式/场景后不自动更新 — ✅ 已修（scene/format/quality 变更即作废快照）
- 上传 accept 含 `.gif` 但文案写「PNG / JPG / WebP / SVG」；SVG 无体积上限 — ✅ 已修（去 gif + SVG ≤256KB）
- 模板缩略图 `ensureThumbnails(...).then()` 无 catch — ✅ 已修（gallery + drawer 两处）
- 分享链接无长度预警 — ✅ 已修（第四批 P1-23）
- 导出不校验 `blob.type` 与请求 MIME 是否一致 — ✅ 已修（不一致即 throw）
- `buildFileName` 的 `slice(0,40)` 可切断 emoji 代理对 — ✅ 已修（按码点展开切片）
- wrap 测试复制禁则字面量而非 import 常量，标点覆盖不全 — ✅ 已修（import `LINE_*_PROHIBITED`）
- `templates.test.ts` 的 `maxLines: 3` 与运行时参数不一致，存在假绿 — ✅ 已修（去掉 maxLines，走 autoFit）
- `templates.ts` 的 `textStyle()` 是第二份文本默认值（R-10 边界） — ✅ 已修（默认值引用 `createDefaultScene().title`）
- `isLegalScene` 校验过浅（不查 `background.kind` 枚举、`exportSize` 数值） — ✅ 已修（深校验 kind/exportSize/logo/text 块）
- 每次 set 全量 `JSON.stringify` 作 equality（含 dataURL 时开销大） — ✅ 已修（引用短路 `deepEqual`）
- 图片缓存无淘汰（`imageCache` 永久驻留） — ✅ 已修（LRU 上限 48）
- 首帧与 scene 变更时 ResizeObserver 随 effect 重建 → 可能双重重绘 — ✅ 已修（scene 重绘与 RO 监听拆成两个 effect）

---

## 建议修复顺序

1. **第一批（数据安全 + 硬约束）**：P0-1、P0-2、P1-8 分享解码校验、P1-6 导出 catch — ✅ 全部完成（2026-09-22）  
2. **第二批（操作手感）**：P1-5 历史合并、P1-3 键盘冲突、P1-11 数字输入 draft、P1-10 画布↔Tab 联动、P1-4 标题空态、P1-9 Ctrl+Z — ✅ 全部完成（2026-09-22）  
3. **第三批（落地页首屏）**：P1-18 整行渐变、P1-19 浅色对比度、P1-20 模板真可点、P1-21 光束 reduced-motion — ✅ 全部完成（2026-09-22）  
4. **第四批（渲染/存储）**：P1-17 字体预载、P1-23 分享长度守卫、P1-24 preload 失败清单、P1-25 配额 toast — ✅ 全部完成（2026-09-22）  
5. **第五批（P2 打磨）**：P2 全部文案/层级/对比度/缩略图/导出面板状态等 — ✅ 已完成（2026-09-22；Hero 主图换素材除外，待截图）  

其中 1–2 与 `docs/implementation-plan.md` Phase 7.1–7.3 高度重合，可并进 Phase 7。
