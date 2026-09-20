/**
 * 场景元素外框计算（3.1 命中检测 / 3.3 选中态共用）。
 * 文本块用换行后的实际外框（prepareText 度量），非近似宽度；
 * Logo 用图片真实纵横比。所有 Rect 为画布设备像素坐标。
 */

import type { Rect } from "@/lib/geometry"
import { blockRect } from "@/lib/geometry"
import type { Scene } from "@/lib/scene"
import { getCachedImage } from "./icons"
import { prepareText } from "./primitives"

export type SlotKey = "logo" | "title" | "subtitle" | "watermark"

export interface SceneRects {
  logo?: Rect
  title?: Rect
  subtitle?: Rect
  watermark?: Rect
}

/** 命中检测的书写顺序（先绘在下，后绘在上）：命中测试按相反顺序取最上层 */
export const SLOT_Z_ORDER: SlotKey[] = [
  "logo",
  "title",
  "subtitle",
  "watermark",
]

export function computeSceneRects(
  scene: Scene,
  width: number,
  height: number,
): SceneRects {
  const scale = height / 1080
  const ctx = getMeasureCtx()
  const rc = { ctx, width, height, scale }
  const rects: SceneRects = {}

  if (scene.logo) {
    const img = getCachedLogoImage(scene)
    const w = scene.logo.size * scale
    const h = img ? (w * img.height) / img.width : w
    rects.logo = blockRect(scene.logo.x, scene.logo.y, w, h, width, height)
  }
  if (scene.title) {
    rects.title = textRect(rc, scene, "title")
  }
  if (scene.subtitle) {
    rects.subtitle = textRect(rc, scene, "subtitle")
  }
  if (scene.watermark) {
    rects.watermark = textRect(rc, scene, "watermark")
  }
  return rects
}

function textRect(
  rc: {
    ctx: CanvasRenderingContext2D
    width: number
    height: number
    scale: number
  },
  scene: Scene,
  slot: "title" | "subtitle" | "watermark",
): Rect {
  const block = scene[slot]
  if (!block) return { x: 0, y: 0, width: 0, height: 0 }
  const prepared = prepareText(rc, block, block, block.maxWidthPct)
  return blockRect(
    block.x,
    block.y,
    prepared.blockWidthPx,
    prepared.blockHeightPx,
    rc.width,
    rc.height,
  )
}

let measureCtx: CanvasRenderingContext2D | null = null
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement("canvas")
    canvas.width = 10
    canvas.height = 10
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("无法创建离屏测量画布")
    measureCtx = ctx
  }
  return measureCtx
}

function getCachedLogoImage(scene: Scene): HTMLImageElement | null {
  if (!scene.logo) return null
  const src = scene.logo.source
  return src.kind === "upload"
    ? getCachedImage({ kind: "upload", dataUrl: src.dataUrl })
    : getCachedImage({ kind: "iconify", code: src.code })
}

/** 命中测试：point 为画布设备像素坐标，返回命中的最上层槽位 */
export function hitTest(
  rects: SceneRects,
  px: number,
  py: number,
): SlotKey | null {
  for (let i = SLOT_Z_ORDER.length - 1; i >= 0; i--) {
    const slot = SLOT_Z_ORDER[i]
    const r = rects[slot]
    if (!r) continue
    if (px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height) {
      return slot
    }
  }
  return null
}
