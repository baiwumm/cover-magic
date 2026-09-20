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
