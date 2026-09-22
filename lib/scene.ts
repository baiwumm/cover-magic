/**
 * Scene 数据契约（Phase 1 冻结，后续阶段只加字段不改语义）。
 * 所有 px 值以画布高度 1080 为基准（R-3），渲染时 scale = canvasHeight / 1080。
 */

import { WATERMARK_DEFAULT_TEXT } from "@/constants/site"

export type Ratio = { w: number; h: number }

export type Background =
  | { kind: "color"; color: string }
  | { kind: "gradient"; from: string; to: string; angle: number }
  | {
      kind: "image"
      dataUrl: string
      fit: "cover" | "contain"
      blur: number
      overlay: number
      overlayColor: string
    }

export type TextStyle = {
  fontFamily: string
  fontWeight: 400 | 700
  italic: boolean
  /** 1080 基准 px（R-3） */
  size: number
  color: string
  /** 基准 px */
  letterSpacing: number
  /** 倍数 */
  lineHeight: number
  align: "left" | "center" | "right"
  uppercase: boolean
  /** 0-10 立体字，0 = 关 */
  shadow: number
}

export type TextBlock = {
  /** 支持 \n 手动换行 */
  text: string
  /** 超宽自动缩字号（R-8 降级顺序） */
  autoFit: boolean
  /** 0-100，块宽占画布宽百分比 */
  maxWidthPct: number
  /** 0-100，锚点 = 块中心 */
  x: number
  y: number
}

export type LogoLayer = {
  source:
    | { kind: "iconify"; code: string }
    | { kind: "upload"; dataUrl: string }
  /** 基准 px */
  size: number
  x: number
  y: number
  shadow?: { size: number; color: string }
}

export type Scene = {
  version: 2
  templateId: string | null
  presetId: string
  ratio: Ratio
  exportSize: { width: number; height: number }
  background: Background
  logo: LogoLayer | null
  title: (TextStyle & TextBlock) | null
  subtitle: (TextStyle & TextBlock) | null
  watermark: (TextStyle & TextBlock & { opacity: number }) | null
}

/** 默认值唯一定义处（R-10）：重置、初始化、模板 fallback 全部引用它 */
export function createDefaultScene(): Scene {
  return {
    version: 2,
    templateId: null,
    presetId: "wechat-top",
    ratio: { w: 900, h: 383 },
    exportSize: { width: 900, height: 383 },
    background: {
      kind: "gradient",
      from: "#1e293b",
      to: "#0f172a",
      angle: 135,
    },
    logo: null,
    title: {
      text: "Cover Magic",
      autoFit: true,
      maxWidthPct: 80,
      x: 50,
      y: 45,
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
    },
    subtitle: {
      text: "专业的封面设计工具",
      autoFit: true,
      maxWidthPct: 70,
      x: 50,
      y: 62,
      fontFamily: "Maple Mono CN",
      fontWeight: 400,
      italic: false,
      size: 40,
      color: "#cbd5e1",
      letterSpacing: 0,
      lineHeight: 1.25,
      align: "center",
      uppercase: false,
      shadow: 0,
    },
    watermark: {
      text: WATERMARK_DEFAULT_TEXT,
      autoFit: false,
      maxWidthPct: 40,
      x: 92,
      y: 92,
      fontFamily: "Maple Mono CN",
      fontWeight: 400,
      italic: false,
      size: 24,
      color: "#94a3b8",
      letterSpacing: 0,
      lineHeight: 1.25,
      align: "right",
      uppercase: false,
      shadow: 0,
      opacity: 0.8,
    },
  }
}

/** logo 尺寸范围（基准 px）：画布手柄与面板滑块共用（P1-12） */
export const LOGO_SIZE_RANGE: [number, number] = [40, 800]

/** 恢复被移除的副标题：默认值唯一来源（R-10 / P1-7） */
export function createDefaultSubtitle(): NonNullable<Scene["subtitle"]> {
  const s = createDefaultScene().subtitle
  if (!s) throw new Error("createDefaultScene().subtitle 不应为 null")
  return structuredClone(s)
}

/** 恢复被移除的水印：默认值唯一来源（R-10 / P1-7 / D-26） */
export function createDefaultWatermark(): NonNullable<Scene["watermark"]> {
  const w = createDefaultScene().watermark
  if (!w) throw new Error("createDefaultScene().watermark 不应为 null")
  return structuredClone(w)
}

/** 背景类型切换时的默认配置（R-10 / P1-7） */
export function createDefaultBackground(kind: Background["kind"]): Background {
  const bg = createDefaultScene().background
  if (bg.kind === kind) return structuredClone(bg)
  if (kind === "color") return { kind: "color", color: "#0f172a" }
  if (kind === "gradient")
    return { kind: "gradient", from: "#1e293b", to: "#0f172a", angle: 135 }
  return {
    kind: "image",
    dataUrl: "",
    fit: "cover",
    blur: 0,
    overlay: 0,
    overlayColor: "#000000",
  }
}

/**
 * 载入外部 Scene（分享 hash / 存档）后对齐导出宽高比（R-4）。
 * hash 可携带 exportSize 与 ratio 分叉的场景；预览按 ratio、导出按
 * exportSize，两者比例必须一致，否则所见非所得。
 */
export function alignExportSize(scene: Scene): Scene {
  const { w, h } = scene.ratio
  const { width, height } = scene.exportSize
  if (w <= 0 || h <= 0 || width <= 0 || height <= 0) return scene
  const target = (width * h) / w
  if (Math.abs(height - target) < 0.5) return scene
  return {
    ...scene,
    exportSize: { width, height: Math.max(1, Math.round(target)) },
  }
}
