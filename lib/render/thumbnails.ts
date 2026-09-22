/**
 * 模板缩略图（4.2）：运行时离屏 drawScene → toDataURL + Map 缓存。
 * 无构建步骤；预览/缩略图/导出共用唯一渲染器（R-1）。
 */

import { ensureFontLoaded } from "@/lib/fonts"
import type { Scene } from "@/lib/scene"
import { drawScene } from "./draw-scene"
import { preloadSceneAssets } from "./icons"

const cache = new Map<string, string>()
const pending = new Map<string, Promise<string>>()

export function getCachedThumbnail(id: string): string | undefined {
  return cache.get(id)
}

/** 渲染一张缩略图（宽 640 高清，高随比例；P2 源宽 320 偏软） */
export async function renderThumbnail(
  id: string,
  scene: Scene,
  width = 640,
): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = Math.round((width * scene.ratio.h) / scene.ratio.w)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("无法创建缩略图画布")
  await Promise.all([
    ensureFontLoaded("Maple Mono CN", 400),
    ensureFontLoaded("Maple Mono CN", 700),
    preloadSceneAssets(scene),
  ])
  drawScene(ctx, scene, { width: canvas.width, height: canvas.height })
  const dataUrl = canvas.toDataURL("image/png")
  cache.set(id, dataUrl)
  return dataUrl
}

/** 批量预热（幂等，并发安全） */
export async function ensureThumbnails(
  items: Array<{ id: string; scene: Scene }>,
): Promise<void> {
  await Promise.all(
    items
      .filter((t) => !cache.has(t.id) && !pending.has(t.id))
      .map((t) => {
        const task = renderThumbnail(t.id, t.scene).finally(() =>
          pending.delete(t.id),
        )
        pending.set(t.id, task)
        return task
      }),
  )
}
