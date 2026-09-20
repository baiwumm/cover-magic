import { describe, expect, it } from "vitest"
import {
  blockRect,
  clamp,
  pctToPx,
  pointInRect,
  pxToPct,
  rectCenterPct,
  snapBlock,
} from "./geometry"

describe("pct ↔ px", () => {
  it("pctToPx 基础换算", () => {
    expect(pctToPx(50, 1000)).toBe(500)
    expect(pctToPx(0, 1000)).toBe(0)
    expect(pctToPx(100, 1000)).toBe(1000)
    expect(pctToPx(92, 1080)).toBeCloseTo(993.6, 6)
  })

  it("pxToPct 往返一致", () => {
    for (const px of [0, 137, 540, 1080]) {
      expect(pxToPct(px, 1080)).toBeCloseTo(pxToPct(px, 1080), 9)
      const pct = pxToPct(px, 1080)
      expect(pctToPx(pct, 1080)).toBeCloseTo(px, 6)
    }
  })

  it("pxToPct 零除保护", () => {
    expect(pxToPct(100, 0)).toBe(0)
  })

  it("clamp", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe("blockRect（中心锚点 → 左上角，含边距补偿）", () => {
  it("居中块", () => {
    const r = blockRect(50, 50, 400, 100, 1000, 800)
    expect(r.x).toBe(300)
    expect(r.y).toBe(350)
    expect(r.width).toBe(400)
    expect(r.height).toBe(100)
  })

  it("角落块（水印 92%, 92%）", () => {
    const r = blockRect(92, 92, 100, 40, 900, 383)
    expect(r.x).toBeCloseTo(828 - 50, 6)
    expect(r.y).toBeCloseTo(352.36 - 20, 6)
  })

  it("rectCenterPct 往返", () => {
    const r = blockRect(30, 70, 200, 60, 1000, 500)
    const c = rectCenterPct(r, 1000, 500)
    expect(c.x).toBeCloseTo(30, 6)
    expect(c.y).toBeCloseTo(70, 6)
  })

  it("pointInRect", () => {
    const r = blockRect(50, 50, 400, 100, 1000, 800)
    expect(pointInRect(500, 400, r)).toBe(true)
    expect(pointInRect(r.x, r.y, r)).toBe(true)
    expect(pointInRect(100, 100, r)).toBe(false)
    expect(pointInRect(r.x + r.width, r.y + r.height, r)).toBe(true)
  })
})

describe("snapBlock（吸附 + 参考线）", () => {
  it("中线吸附：x 接近 50 时吸附并出竖参考线", () => {
    const r = snapBlock({ x: 49.8, y: 40 }, { w: 30, h: 10 }, { x: 1, y: 1 })
    expect(r.xPct).toBe(50)
    expect(r.guides).toContainEqual({ axis: "x", positionPct: 50 })
    expect(r.yPct).toBe(40)
  })

  it("安全区边线：块左缘贴近 5% 安全线时贴线", () => {
    // 块宽 20，左缘在 5 → 中心在 15
    const r = snapBlock({ x: 14.6, y: 50 }, { w: 20, h: 10 }, { x: 1, y: 1 })
    expect(r.xPct).toBe(15)
    expect(r.guides).toContainEqual({ axis: "x", positionPct: 5 })
  })

  it("超出容差不吸附，无参考线", () => {
    const r = snapBlock({ x: 30, y: 30 }, { w: 20, h: 10 }, { x: 1, y: 1 })
    expect(r.xPct).toBe(30)
    expect(r.yPct).toBe(30)
    expect(r.guides).toEqual([])
  })

  it("y 轴横线吸附", () => {
    const r = snapBlock({ x: 50, y: 95.2 }, { w: 20, h: 10 }, { x: 1, y: 1 })
    expect(r.yPct).toBe(95)
    expect(r.guides).toContainEqual({ axis: "y", positionPct: 95 })
  })
})
