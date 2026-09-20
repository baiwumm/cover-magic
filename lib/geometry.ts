/**
 * 百分比 ↔ 像素换算（纯函数，必须测）。
 * Scene 中 x/y 为 0-100 百分比；渲染层负责传入当前画布的宽高。
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 百分比（0-100）→ 像素 */
export function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total
}

/** 像素 → 百分比（0-100） */
export function pxToPct(px: number, total: number): number {
  if (total === 0) return 0
  return (px / total) * 100
}

/**
 * 由「块中心锚点 + 块尺寸」求左上角矩形（含边距补偿）。
 * Scene 的 TextBlock/Logo 以块中心为锚点，Canvas 绘制需要左上角。
 */
export function blockRect(
  centerXPct: number,
  centerYPct: number,
  blockWidthPx: number,
  blockHeightPx: number,
  canvasWidth: number,
  canvasHeight: number,
): Rect {
  const cx = pctToPx(centerXPct, canvasWidth)
  const cy = pctToPx(centerYPct, canvasHeight)
  return {
    x: cx - blockWidthPx / 2,
    y: cy - blockHeightPx / 2,
    width: blockWidthPx,
    height: blockHeightPx,
  }
}

/** 矩形中心（画布百分比坐标） */
export function rectCenterPct(
  rect: Rect,
  canvasWidth: number,
  canvasHeight: number,
) {
  return {
    x: pxToPct(rect.x + rect.width / 2, canvasWidth),
    y: pxToPct(rect.y + rect.height / 2, canvasHeight),
  }
}

/** 点是否在矩形内（含边界） */
export function pointInRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  )
}

/** 安全区边距（画布百分比）：四边各 5% */
export const SAFE_AREA_PCT = 5

export interface SnapGuide {
  /** 参考线方向：x = 竖线，y = 横线 */
  axis: "x" | "y"
  /** 参考线在画布上的百分比位置 */
  positionPct: number
}

export interface SnapResult {
  xPct: number
  yPct: number
  guides: SnapGuide[]
}

/**
 * 吸附（3.4）：中线（50）与四边安全区，容差按「基准 px」换算的百分比传入。
 * 返回吸附后的块中心百分比与需显示的参考线。
 */
export function snapBlock(
  centerPct: { x: number; y: number },
  blockSizePct: { w: number; h: number },
  tolerancePct: { x: number; y: number },
): SnapResult {
  const guides: SnapGuide[] = []
  const snapAxis = (
    center: number,
    sizePct: number,
    tol: number,
    axis: "x" | "y",
  ): number => {
    // 目标：画布中线 + 安全区两边（支持块边缘贴线）
    const lines = [
      { at: 50, edge: false },
      { at: SAFE_AREA_PCT, edge: true },
      { at: 100 - SAFE_AREA_PCT, edge: true },
    ]
    let best: { value: number; guide: number; dist: number } | null = null
    for (const line of lines) {
      const values = line.edge
        ? [line.at, line.at + sizePct / 2, line.at - sizePct / 2]
        : [line.at]
      for (const value of values) {
        const dist = Math.abs(center - value)
        if (dist <= tol && (!best || dist < best.dist)) {
          best = { value, guide: line.at, dist }
        }
      }
    }
    if (best) {
      guides.push({ axis, positionPct: best.guide })
      return best.value
    }
    return center
  }

  const xPct = snapAxis(centerPct.x, blockSizePct.w, tolerancePct.x, "x")
  const yPct = snapAxis(centerPct.y, blockSizePct.h, tolerancePct.y, "y")
  return { xPct, yPct, guides }
}
