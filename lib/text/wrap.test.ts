import { describe, expect, it } from "vitest"
import {
  fitTextBlock,
  LINE_END_PROHIBITED,
  LINE_START_PROHIBITED,
  wrapText,
} from "./wrap"

/** 确定性量宽：CJK/全角 = size，拉丁/半角 = size * 0.55 */
function makeMeasure(fontPx = 100) {
  return (text: string, size = fontPx) => {
    let w = 0
    for (const ch of text) {
      const cjk =
        /[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\u3000-\u303f]/.test(
          ch,
        )
      w += cjk ? size : size * 0.55
    }
    return w
  }
}

describe("wrapText", () => {
  it("纯中文：按宽度逐字断行", () => {
    const m = makeMeasure()
    const { lines } = wrapText("一二三四五六七八九十", {
      maxWidth: 550,
      measureText: m,
    })
    expect(lines).toEqual(["一二三四五", "一二三四五六七八九十".slice(5)])
  })

  it("纯英文：单词不拆断，按空格断行", () => {
    const m = makeMeasure()
    const { lines } = wrapText("hello world foo bar", {
      maxWidth: 660,
      measureText: m,
    })
    // 660px 放得下 "hello world"（11 字符 * 55 = 605）放不下 + " foo"
    expect(lines).toEqual(["hello world", "foo bar"])
  })

  it("中英混排：中英边界可断，英文词保持完整", () => {
    const m = makeMeasure()
    const { lines } = wrapText("前端框架React和Vue都很流行", {
      maxWidth: 500,
      measureText: m,
    })
    for (const line of lines) {
      expect(line).not.toMatch(/Re$/)
      expect(line).not.toMatch(/^act/)
      expect(line).not.toMatch(/Vu$/)
    }
    expect(lines.join("")).toBe("前端框架React和Vue都很流行")
  })

  it("行首禁则：句号不得出现在行首", () => {
    const m = makeMeasure()
    const { lines } = wrapText("设计完成。标题", {
      maxWidth: 500,
      measureText: m,
    })
    // "设计完成。" 恰好 500 宽；"标"放不下时句号不能被甩到下一行行首
    // 禁则字面量从实现 import，避免测试与源码各维护一份（P2）
    for (const line of lines) {
      expect(
        line[0] && LINE_START_PROHIBITED.includes(line[0]),
        `行首出现禁则标点：${line}`,
      ).toBeFalsy()
    }
  })

  it("行尾禁则：开括号不得出现在行尾", () => {
    const m = makeMeasure()
    const { lines } = wrapText("这是一个测试（测试内容）结尾", {
      maxWidth: 600,
      measureText: m,
    })
    for (const line of lines) {
      const last = line[line.length - 1]
      expect(
        last && LINE_END_PROHIBITED.includes(last),
        `行尾出现禁则标点：${line}`,
      ).toBeFalsy()
    }
  })

  it("连续标点下沉：多字标点簇不落行首", () => {
    const m = makeMeasure()
    const { lines } = wrapText("他说完了！！！然后", {
      maxWidth: 500,
      measureText: m,
    })
    for (const line of lines) {
      expect(line[0]).not.toMatch(/[！]/)
    }
    expect(lines.join("")).toBe("他说完了！！！然后")
  })

  it("超长无空格英文串：硬拆兜底不无限溢出", () => {
    const m = makeMeasure()
    const word = "A".repeat(40)
    const { lines } = wrapText(word, { maxWidth: 500, measureText: m })
    // 500 / 55 ≈ 9 字符一行
    expect(lines.length).toBeGreaterThan(3)
    for (const line of lines) {
      expect(m(line)).toBeLessThanOrEqual(500)
    }
    expect(lines.join("")).toBe(word)
  })

  it("\\n 手动换行与自动换行混用", () => {
    const m = makeMeasure()
    const { lines } = wrapText("第一段落标题\n第二段落继续内容更长一些", {
      maxWidth: 700,
      measureText: m,
    })
    expect(lines[0]).toBe("第一段落标题")
    expect(lines.length).toBeGreaterThanOrEqual(3)
  })

  it("空文本与纯空格", () => {
    const m = makeMeasure()
    expect(wrapText("", { maxWidth: 500, measureText: m }).lines).toEqual([])
    expect(wrapText("   ", { maxWidth: 500, measureText: m }).lines).toEqual([])
  })

  it("行首行尾空白被清理", () => {
    const m = makeMeasure()
    const { lines } = wrapText("标题  副标题内容", {
      maxWidth: 500,
      measureText: m,
    })
    for (const line of lines) {
      expect(line).toBe(line.trim())
    }
  })

  it("引号内文字断行：开引号随字下沉", () => {
    const m = makeMeasure()
    const { lines } = wrapText("引用“这是一段被引用的很长内容”完", {
      maxWidth: 500,
      measureText: m,
    })
    for (const line of lines) {
      expect(line[line.length - 1]).not.toBe("“")
    }
  })

  it("恰好多放一个字符：不断行", () => {
    const m = makeMeasure()
    const { lines } = wrapText("一二三四五", { maxWidth: 500, measureText: m })
    expect(lines).toEqual(["一二三四五"])
  })

  it("多段落各自独立断行，空行被丢弃", () => {
    const m = makeMeasure()
    const { lines } = wrapText("标题甲\n\n标题乙", {
      maxWidth: 500,
      measureText: m,
    })
    expect(lines).toEqual(["标题甲", "标题乙"])
  })
})

describe("fitTextBlock", () => {
  it("不超宽时保持原字号", () => {
    const m = makeMeasure()
    const r = fitTextBlock({
      text: "一二三四五",
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      maxLines: 2,
      measure: m,
    })
    expect(r.fontSize).toBe(100)
    expect(r.scale).toBe(1)
    expect(r.truncated).toBe(false)
  })

  it("略超宽时缩字号而不是截断（降级第一优先）", () => {
    const m = makeMeasure()
    const r = fitTextBlock({
      text: "一二三四五六七",
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      maxLines: 1,
      measure: m,
    })
    // 700px → 需要缩到 ≤ 0.71；0.7 档：7 * 70 = 490 ≤ 500
    expect(r.scale).toBeLessThan(1)
    expect(r.truncated).toBe(false)
    expect(r.ellipsis).toBe(false)
    expect(r.lines.join("")).toBe("一二三四五六七")
  })

  it("缩到下限仍放不下 → 省略号（降级顺序：缩字号 → 减行 → 省略号）", () => {
    const m = makeMeasure()
    const text = "一二三四五六七八九十".repeat(5)
    const r = fitTextBlock({
      text,
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      maxLines: 2,
      measure: m,
      minScale: 0.5,
    })
    expect(r.lines.length).toBeLessThanOrEqual(2)
    expect(r.ellipsis).toBe(true)
    expect(r.truncated).toBe(true)
    expect(r.lines[r.lines.length - 1].endsWith("…")).toBe(true)
    for (const line of r.lines) {
      expect(m(line, r.fontSize)).toBeLessThanOrEqual(500 + 1e-9)
    }
  })

  it("maxHeightPx 与 lineHeight 推导行数上限", () => {
    const m = makeMeasure()
    const text = "一二三四五六七八九十".repeat(3)
    const r = fitTextBlock({
      text,
      fontPx: 100,
      maxWidthPx: 500,
      maxHeightPx: 250, // scale=1 时每行 125px → 2 行；缩字号后容量放宽
      lineHeight: 1.25,
      measure: m,
    })
    // 最小字号 50 时容量 floor(250/62.5)=4 行，10 字/行 → 3 行放下全部内容
    expect(r.lines.length).toBeLessThanOrEqual(4)
    expect(r.lines.join("")).toBe(text)
    expect(r.ellipsis).toBe(false)
  })

  it("autoFit=true：超宽段落优先缩字号保持单行，而不是换行", () => {
    const m = makeMeasure()
    const r = fitTextBlock({
      text: "一二三四五六七",
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      autoFit: true,
      measure: m,
    })
    expect(r.lines).toEqual(["一二三四五六七"])
    expect(r.scale).toBeLessThan(1)
    expect(r.ellipsis).toBe(false)
  })

  it("autoFit=false：超宽段落自由换行，不缩字号", () => {
    const m = makeMeasure()
    const r = fitTextBlock({
      text: "一二三四五六七",
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      autoFit: false,
      measure: m,
    })
    expect(r.lines.length).toBeGreaterThan(1)
    expect(r.scale).toBe(1)
  })

  it("缩字号以保持完整内容优先于省略号", () => {
    const m = makeMeasure()
    const text = "长标题需要缩小字号才能放下的场景验证"
    const shrink = fitTextBlock({
      text,
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      maxLines: 2,
      measure: m,
    })
    expect(shrink.ellipsis).toBe(false)
    expect(shrink.lines.join("")).toBe(text)
  })

  it("\\n 手动换行在 fit 中保留", () => {
    const m = makeMeasure()
    const r = fitTextBlock({
      text: "第一行\n第二行",
      fontPx: 100,
      maxWidthPx: 500,
      lineHeight: 1.25,
      maxLines: 2,
      measure: m,
    })
    expect(r.lines).toEqual(["第一行", "第二行"])
    expect(r.fontSize).toBe(100)
  })
})
