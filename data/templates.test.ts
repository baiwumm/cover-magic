import { describe, expect, it } from "vitest"
import type { TextBlock, TextStyle } from "@/lib/scene"
import { fitTextBlock } from "@/lib/text/wrap"
import { getDefaultTemplate, TEMPLATES, type Template } from "./templates"

/** 近似量宽：CJK 按全宽、拉丁按 0.6 倍（保守估计用于溢出检查） */
function roughMeasure(text: string, size: number): number {
  let w = 0
  for (const ch of text) {
    w +=
      /[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\u3000-\u303f]/.test(
        ch,
      )
        ? size
        : size * 0.6
  }
  return w
}

/** 断言文本块在其比例画布内放得下（autoFit 兜底生效、无省略号截断） */
function assertTextFits(
  t: Template,
  block: TextStyle & TextBlock,
  axis: "w" | "h",
) {
  const basisTotal =
    axis === "h" ? 1080 : (1080 * t.scene.ratio.w) / t.scene.ratio.h
  const maxWidthPx = (block.maxWidthPct / 100) * basisTotal
  const fit = fitTextBlock({
    text: block.text,
    fontPx: block.size,
    maxWidthPx,
    lineHeight: block.lineHeight,
    maxLines: 3, // 模板标题/副标题不应超过 3 行
    autoFit: block.autoFit,
    measure: roughMeasure,
    minScale: 0.5,
  })
  expect(fit.ellipsis, `${t.id} 文本被截断：${block.text}`).toBe(false)
}

describe("模板数据（R-11 / D-19）", () => {
  it("共 12 套且 id 唯一", () => {
    expect(TEMPLATES.length).toBe(12)
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(TEMPLATES.length)
  })

  it("覆盖 16:9 / 2.35:1 / 3:4 / 1:1 四类比例", () => {
    const ratios = new Set(TEMPLATES.map((t) => t.bestRatio))
    expect(ratios).toEqual(new Set(["16:9", "2.35:1", "3:4", "1:1"]))
  })

  it("每套都是合法的 Scene（version 2、字段完备）", () => {
    for (const t of TEMPLATES) {
      expect(t.scene.version, t.id).toBe(2)
      expect(t.scene.templateId, t.id).toBe(t.id)
      expect(t.scene.ratio.w).toBeGreaterThan(0)
      expect(t.scene.ratio.h).toBeGreaterThan(0)
      expect(t.scene.title, `${t.id} 缺主标题`).not.toBeNull()
      expect(t.scene.background).toBeTruthy()
    }
  })

  it("纯可序列化数据：无函数/组件引用（R-11）", () => {
    for (const t of TEMPLATES) {
      const round = JSON.parse(JSON.stringify(t)) as typeof t
      expect(round, t.id).toEqual(t)
    }
  })

  it("坐标与宽度百分比在 0-100 内", () => {
    for (const t of TEMPLATES) {
      const blocks = [t.scene.title, t.scene.subtitle, t.scene.watermark]
      for (const b of blocks) {
        if (!b) continue
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x).toBeLessThanOrEqual(100)
        expect(b.y).toBeGreaterThanOrEqual(0)
        expect(b.y).toBeLessThanOrEqual(100)
        expect(b.maxWidthPct).toBeGreaterThan(0)
        expect(b.maxWidthPct).toBeLessThanOrEqual(100)
      }
    }
  })

  it("主副标题不溢出画布（autoFit 兜底后无省略号）", () => {
    for (const t of TEMPLATES) {
      if (t.scene.title) assertTextFits(t, t.scene.title, "w")
      if (t.scene.subtitle) assertTextFits(t, t.scene.subtitle, "w")
    }
  })

  it("水印默认文本 @baiwumm", () => {
    for (const t of TEMPLATES) {
      if (t.scene.watermark) expect(t.scene.watermark.text).toBe("@baiwumm")
    }
  })

  it("getDefaultTemplate 返回 default 模板（D-20）", () => {
    expect(getDefaultTemplate().id).toBe("default")
  })
})
