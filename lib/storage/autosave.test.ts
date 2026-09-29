import { describe, expect, it } from "vitest"
import { TEMPLATES } from "@/data/templates"
import { createDefaultScene, type Scene } from "@/lib/scene"
import { isLegalScene } from "@/lib/storage/autosave"
import { decodeSceneFromHash, encodeSceneToHash } from "@/lib/storage/share-url"

function clone(): Scene {
  return structuredClone(createDefaultScene())
}

/** 表驱动：改坏一处就必须判非法（P2-5 深校验收紧） */
const CORRUPT: Array<[string, (s: Scene) => void]> = [
  [
    "version 不是 2",
    (s) => {
      ;(s as unknown as { version: number }).version = 1
    },
  ],
  [
    "templateId 非字符串非 null",
    (s) => {
      ;(s as unknown as { templateId: unknown }).templateId = 42
    },
  ],
  [
    "presetId 空串",
    (s) => {
      s.presetId = ""
    },
  ],
  [
    "ratio.w 为 NaN",
    (s) => {
      s.ratio.w = Number.NaN
    },
  ],
  [
    "ratio.h 为 Infinity",
    (s) => {
      s.ratio.h = Number.POSITIVE_INFINITY
    },
  ],
  [
    "ratio.w 为 0",
    (s) => {
      s.ratio.w = 0
    },
  ],
  [
    "ratio 边长超上限",
    (s) => {
      s.ratio.w = 1e6
    },
  ],
  [
    "exportSize.width 为 NaN",
    (s) => {
      s.exportSize.width = Number.NaN
    },
  ],
  [
    "exportSize.height 超上限",
    (s) => {
      s.exportSize.height = 9000
    },
  ],
  [
    "background.kind 枚举外",
    (s) => {
      ;(s.background as { kind: string }).kind = "solid"
    },
  ],
  [
    "gradient.color 为空串",
    (s) => {
      if (s.background.kind === "gradient") s.background.from = ""
    },
  ],
  [
    "gradient.angle 为 NaN",
    (s) => {
      if (s.background.kind === "gradient") s.background.angle = Number.NaN
    },
  ],
  [
    "image.blur 为负",
    (s) => {
      s.background = {
        kind: "image",
        dataUrl: "data:image/png;base64,AA",
        fit: "cover",
        blur: -1,
        overlay: 0,
        overlayColor: "#000000",
      }
    },
  ],
  [
    "image.overlayColor 空串",
    (s) => {
      s.background = {
        kind: "image",
        dataUrl: "data:image/png;base64,AA",
        fit: "cover",
        blur: 0,
        overlay: 0,
        overlayColor: "",
      }
    },
  ],
  [
    "logo 缺失（键不存在）",
    (s) => {
      delete (s as unknown as Record<string, unknown>).logo
    },
  ],
  [
    "logo.size 为 NaN",
    (s) => {
      s.logo = {
        source: { kind: "iconify", code: "mdi:rocket" },
        size: Number.NaN,
        x: 50,
        y: 22,
      }
    },
  ],
  [
    "logo.size 为 0",
    (s) => {
      s.logo = {
        source: { kind: "iconify", code: "mdi:rocket" },
        size: 0,
        x: 50,
        y: 22,
      }
    },
  ],
  [
    "logo.x 为 Infinity",
    (s) => {
      s.logo = {
        source: { kind: "iconify", code: "mdi:rocket" },
        size: 200,
        x: Number.POSITIVE_INFINITY,
        y: 22,
      }
    },
  ],
  [
    "logo.iconify.code 空串",
    (s) => {
      s.logo = {
        source: { kind: "iconify", code: "" },
        size: 200,
        x: 50,
        y: 22,
      }
    },
  ],
  [
    "logo.upload.dataUrl 空串",
    (s) => {
      s.logo = {
        source: { kind: "upload", dataUrl: "" },
        size: 200,
        x: 50,
        y: 22,
      }
    },
  ],
  [
    "logo.color 非字符串",
    (s) => {
      s.logo = {
        source: { kind: "iconify", code: "mdi:rocket" },
        size: 200,
        x: 50,
        y: 22,
        color: 123 as unknown as string,
      }
    },
  ],
  [
    "logo.shadow 缺 color",
    (s) => {
      s.logo = {
        source: { kind: "iconify", code: "mdi:rocket" },
        size: 200,
        x: 50,
        y: 22,
        shadow: { size: 4 } as unknown as { size: number; color: string },
      }
    },
  ],
  [
    "title 缺失（键不存在）",
    (s) => {
      delete (s as unknown as Record<string, unknown>).title
    },
  ],
  [
    "title.fontWeight 非 400/700",
    (s) => {
      if (s.title) (s.title as { fontWeight: unknown }).fontWeight = 600
    },
  ],
  [
    "title.fontFamily 空串",
    (s) => {
      if (s.title) s.title.fontFamily = ""
    },
  ],
  [
    "title.align 枚举外",
    (s) => {
      if (s.title) (s.title as { align: unknown }).align = "middle"
    },
  ],
  [
    "title.size 为 0",
    (s) => {
      if (s.title) s.title.size = 0
    },
  ],
  [
    "title.maxWidthPct 越界",
    (s) => {
      if (s.title) s.title.maxWidthPct = 150
    },
  ],
  [
    "title.lineHeight 为 0",
    (s) => {
      if (s.title) s.title.lineHeight = 0
    },
  ],
  [
    "title.letterSpacing 为 NaN",
    (s) => {
      if (s.title) s.title.letterSpacing = Number.NaN
    },
  ],
  [
    "title.autoFit 非布尔",
    (s) => {
      if (s.title) (s.title as { autoFit: unknown }).autoFit = 1
    },
  ],
  [
    "subtitle.color 空串",
    (s) => {
      if (s.subtitle) s.subtitle.color = ""
    },
  ],
  [
    "watermark.opacity 越界",
    (s) => {
      if (s.watermark) s.watermark.opacity = 1.5
    },
  ],
  [
    "watermark.opacity 为 NaN",
    (s) => {
      if (s.watermark) s.watermark.opacity = Number.NaN
    },
  ],
]

describe("isLegalScene 深校验（P2-5）", () => {
  it("默认场景与全部模板场景合法", () => {
    expect(isLegalScene(createDefaultScene())).toBe(true)
    for (const t of TEMPLATES) {
      expect(isLegalScene(t.scene), t.id).toBe(true)
    }
  })

  it("logo.color 可选：旧存档/分享 Scene 无 color 仍合法", () => {
    const s = clone()
    s.logo = {
      source: { kind: "iconify", code: "mdi:rocket" },
      size: 200,
      x: 50,
      y: 22,
    }
    expect(isLegalScene(s)).toBe(true)
    s.logo.color = "#1d4ed8"
    expect(isLegalScene(s)).toBe(true)
  })

  it("logo 与文本块为 null 合法（可关闭的层）", () => {
    const s = clone()
    s.logo = null
    s.subtitle = null
    s.watermark = null
    expect(isLegalScene(s)).toBe(true)
  })

  it("拒绝：非对象与空对象", () => {
    expect(isLegalScene(null)).toBe(false)
    expect(isLegalScene(undefined)).toBe(false)
    expect(isLegalScene("scene")).toBe(false)
    expect(isLegalScene({})).toBe(false)
    expect(isLegalScene([])).toBe(false)
  })

  it.each(CORRUPT)("拒绝：%s", (_name, corrupt) => {
    const s = clone()
    corrupt(s)
    expect(isLegalScene(s)).toBe(false)
  })

  it("JSON 往返后仍合法（存档/分享均为 JSON 序列化）", () => {
    expect(isLegalScene(JSON.parse(JSON.stringify(createDefaultScene())))).toBe(
      true,
    )
  })
})

describe("分享 hash 走同一套校验（P1-8）", () => {
  it("默认场景 encode → decode 往返相等", async () => {
    const scene = createDefaultScene()
    const hash = await encodeSceneToHash(scene)
    await expect(decodeSceneFromHash(hash)).resolves.toEqual(scene)
  })

  it("畸形 hash 一律返回 null", async () => {
    await expect(decodeSceneFromHash("")).resolves.toBeNull()
    await expect(decodeSceneFromHash("#")).resolves.toBeNull()
    await expect(decodeSceneFromHash("#s=x")).resolves.toBeNull()
    await expect(decodeSceneFromHash("#s=zzzz")).resolves.toBeNull()
    await expect(decodeSceneFromHash("#q=1")).resolves.toBeNull()
  })

  it("校验不过的场景即使能解码也返回 null", async () => {
    const s = clone()
    s.ratio.w = Number.NaN
    const hash = await encodeSceneToHash(s)
    await expect(decodeSceneFromHash(hash)).resolves.toBeNull()
  })
})
