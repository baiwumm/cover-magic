/**
 * Scene 数据契约（Phase 1 冻结，后续阶段只加字段不改语义）。
 * 所有 px 值以画布高度 1080 为基准（R-3），渲染时 scale = canvasHeight / 1080。
 */

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
      text: "@baiwumm",
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
