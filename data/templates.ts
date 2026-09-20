/**
 * 模板系统（R-11）：纯可序列化 Scene 数据，不含函数/组件/CSS 字符串。
 * 覆盖 16:9 / 2.35:1 / 3:4 / 1:1 四类比例（D-19），每套标注 bestRatio。
 * 套用模板 = 整体替换 Scene（不是增量合并）。
 */

import { WATERMARK_DEFAULT_TEXT } from "@/constants/site"
import {
  createDefaultScene,
  type Scene,
  type TextBlock,
  type TextStyle,
} from "@/lib/scene"

export type BestRatio = "16:9" | "2.35:1" | "3:4" | "1:1"

export interface Template {
  id: string
  name: string
  bestRatio: BestRatio
  scene: Scene
}

/** TextBlock + TextStyle 合体（Scene 槽位类型） */
type TextData = TextStyle & TextBlock
type WatermarkData = TextData & { opacity: number }

/** 文本样式构造器（模块内私有，产物为纯数据） */
function textStyle(
  partial: Partial<TextStyle & TextBlock> & {
    text: string
    x: number
    y: number
  },
): TextData {
  return {
    autoFit: true,
    maxWidthPct: 80,
    fontFamily: "Maple Mono CN",
    fontWeight: 700,
    italic: false,
    size: 96,
    color: "#ffffff",
    letterSpacing: 0,
    lineHeight: 1.25,
    align: "center",
    uppercase: false,
    shadow: 0,
    ...partial,
  }
}

function baseScene(p: {
  ratio: { w: number; h: number }
  background: Scene["background"]
}): Scene {
  return {
    ...createDefaultScene(),
    templateId: null,
    presetId: "custom",
    ratio: p.ratio,
    exportSize: { width: p.ratio.w, height: p.ratio.h },
    background: p.background,
    logo: null,
    title: null,
    subtitle: null,
    watermark: null,
  }
}

function watermark(color: string, opacity = 0.8): WatermarkData {
  return {
    ...textStyle({
      text: WATERMARK_DEFAULT_TEXT,
      x: 92,
      y: 92,
      fontWeight: 400,
      size: 24,
      color,
      align: "right",
      maxWidthPct: 40,
    }),
    opacity,
  }
}

const scene = (p: {
  id: string
  name: string
  bestRatio: BestRatio
  ratio: { w: number; h: number }
  background: Scene["background"]
  title: ReturnType<typeof textStyle>
  subtitle?: ReturnType<typeof textStyle>
  withWatermark?: boolean
}): Template => ({
  id: p.id,
  name: p.name,
  bestRatio: p.bestRatio,
  scene: {
    ...baseScene({ ratio: p.ratio, background: p.background }),
    templateId: p.id,
    title: p.title,
    subtitle: p.subtitle ?? null,
    watermark:
      p.withWatermark === false
        ? null
        : watermark(p.title.color === "#ffffff" ? "#cbd5e1" : "#737373"),
  },
})

export const TEMPLATES: Template[] = [
  // ── 2.35:1 公众号头条 ─────────────────────────────
  scene({
    id: "default",
    name: "默认 · 深蓝渐变",
    bestRatio: "2.35:1",
    ratio: { w: 900, h: 383 },
    background: {
      kind: "gradient",
      from: "#1e293b",
      to: "#0f172a",
      angle: 135,
    },
    title: textStyle({ text: "Cover Magic", x: 50, y: 45 }),
    subtitle: textStyle({
      text: "专业的封面设计工具",
      x: 50,
      y: 62,
      fontWeight: 400,
      size: 40,
      color: "#cbd5e1",
    }),
  }),
  scene({
    id: "midnight-code",
    name: "午夜代码",
    bestRatio: "2.35:1",
    ratio: { w: 900, h: 383 },
    background: {
      kind: "gradient",
      from: "#020617",
      to: "#0c4a6e",
      angle: 120,
    },
    title: textStyle({
      text: "深入浅出 TypeScript 泛型",
      x: 50,
      y: 42,
      size: 84,
    }),
    subtitle: textStyle({
      text: "从入门到实战的完整指南",
      x: 50,
      y: 62,
      fontWeight: 400,
      size: 36,
      color: "#7dd3fc",
    }),
  }),
  scene({
    id: "crimson",
    name: "赤色标题栏",
    bestRatio: "2.35:1",
    ratio: { w: 900, h: 383 },
    background: {
      kind: "gradient",
      from: "#7f1d1d",
      to: "#171717",
      angle: 160,
    },
    title: textStyle({ text: "前端性能优化实战", x: 50, y: 42, size: 88 }),
    subtitle: textStyle({
      text: "让页面快到飞起",
      x: 50,
      y: 60,
      fontWeight: 700,
      size: 42,
      color: "#fca5a5",
    }),
  }),

  // ── 16:9 ─────────────────────────────
  scene({
    id: "tech-blue",
    name: "掘金科技蓝",
    bestRatio: "16:9",
    ratio: { w: 1280, h: 720 },
    background: {
      kind: "gradient",
      from: "#1d4ed8",
      to: "#0f172a",
      angle: 135,
    },
    title: textStyle({ text: "React 19 新特性解析", x: 50, y: 42, size: 100 }),
    subtitle: textStyle({
      text: "Actions · use · 编译器",
      x: 50,
      y: 60,
      fontWeight: 400,
      size: 44,
      color: "#bfdbfe",
    }),
  }),
  scene({
    id: "minimal-light",
    name: "极简白",
    bestRatio: "16:9",
    ratio: { w: 1280, h: 720 },
    background: { kind: "color", color: "#fafafa" },
    title: textStyle({
      text: "写好代码的 10 个习惯",
      x: 50,
      y: 42,
      size: 96,
      color: "#171717",
    }),
    subtitle: textStyle({
      text: "来自十年维护开源项目的经验",
      x: 50,
      y: 60,
      fontWeight: 400,
      size: 40,
      color: "#737373",
    }),
  }),
  scene({
    id: "sunset",
    name: "日落暖橙",
    bestRatio: "16:9",
    ratio: { w: 1280, h: 720 },
    background: {
      kind: "gradient",
      from: "#f97316",
      to: "#7c2d12",
      angle: 150,
    },
    title: textStyle({
      text: "Node.js 全栈开发指南",
      x: 50,
      y: 42,
      size: 100,
      shadow: 4,
    }),
    subtitle: textStyle({
      text: "从零搭建生产级服务",
      x: 50,
      y: 60,
      fontWeight: 400,
      size: 44,
      color: "#ffedd5",
      shadow: 2,
    }),
  }),
  scene({
    id: "forest",
    name: "森林绿",
    bestRatio: "16:9",
    ratio: { w: 1280, h: 720 },
    background: {
      kind: "gradient",
      from: "#14532d",
      to: "#052e16",
      angle: 120,
    },
    title: textStyle({ text: "服务端渲染快速上手", x: 50, y: 42, size: 96 }),
    subtitle: textStyle({
      text: "Next.js 实战笔记",
      x: 50,
      y: 60,
      fontWeight: 400,
      size: 40,
      color: "#86efac",
    }),
  }),

  // ── 3:4 小红书 ─────────────────────────────
  scene({
    id: "sakura",
    name: "樱花粉",
    bestRatio: "3:4",
    ratio: { w: 1242, h: 1660 },
    background: {
      kind: "gradient",
      from: "#fbcfe8",
      to: "#f472b6",
      angle: 160,
    },
    title: textStyle({
      text: "前端学习路线图",
      x: 50,
      y: 40,
      size: 130,
      color: "#831843",
    }),
    subtitle: textStyle({
      text: "从入门到 offer 的完整攻略",
      x: 50,
      y: 55,
      fontWeight: 400,
      size: 60,
      color: "#9d174d",
    }),
  }),
  scene({
    id: "dark-glass",
    name: "暗黑玻璃",
    bestRatio: "3:4",
    ratio: { w: 1242, h: 1660 },
    background: {
      kind: "gradient",
      from: "#111827",
      to: "#374151",
      angle: 140,
    },
    title: textStyle({
      text: "程序员的效率工具箱",
      x: 50,
      y: 38,
      size: 124,
      shadow: 6,
    }),
    subtitle: textStyle({
      text: "2026 年度精选合集",
      x: 50,
      y: 52,
      fontWeight: 400,
      size: 56,
      color: "#9ca3af",
    }),
  }),
  scene({
    id: "violet",
    name: "紫罗兰",
    bestRatio: "3:4",
    ratio: { w: 1242, h: 1660 },
    background: {
      kind: "gradient",
      from: "#6d28d9",
      to: "#1e1b4b",
      angle: 135,
    },
    title: textStyle({ text: "算法通关手册", x: 50, y: 40, size: 130 }),
    subtitle: textStyle({
      text: "LeetCode 热题 100 精讲",
      x: 50,
      y: 55,
      fontWeight: 400,
      size: 56,
      color: "#ddd6fe",
    }),
  }),

  // ── 1:1 ─────────────────────────────
  scene({
    id: "mint-square",
    name: "薄荷方图",
    bestRatio: "1:1",
    ratio: { w: 1080, h: 1080 },
    background: {
      kind: "gradient",
      from: "#ccfbf1",
      to: "#14b8a6",
      angle: 145,
    },
    title: textStyle({
      text: "CSS 奇技淫巧",
      x: 50,
      y: 42,
      size: 120,
      color: "#134e4a",
    }),
    subtitle: textStyle({
      text: "一行代码搞定布局",
      x: 50,
      y: 58,
      fontWeight: 400,
      size: 52,
      color: "#0f766e",
    }),
  }),
  scene({
    id: "paper",
    name: "纸面质感",
    bestRatio: "1:1",
    ratio: { w: 1080, h: 1080 },
    background: { kind: "color", color: "#f5f5f4" },
    title: textStyle({
      text: "设计模式漫谈",
      x: 50,
      y: 44,
      size: 116,
      color: "#1c1917",
    }),
    subtitle: textStyle({
      text: "复杂度守恒定律的启示",
      x: 50,
      y: 60,
      fontWeight: 400,
      size: 48,
      color: "#57534e",
    }),
  }),
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

/** D-20：进入编辑器的初始模板 */
export function getDefaultTemplate(): Template {
  return getTemplate("default") ?? TEMPLATES[0]
}
