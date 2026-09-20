/**
 * 唯一渲染器（R-1）：预览 / 导出 / 模板缩略图共用此入口。
 * 预览与导出读同一个 Scene（R-2）；scale = height / 1080（R-3）；
 * 构图只依赖 scene.ratio，与 exportSize 无关（R-4）。
 */

import type { Scene } from "@/lib/scene"
import {
  drawBackground,
  drawLogo,
  drawText,
  type RenderContext,
} from "./primitives"

export interface DrawSceneOptions {
  width: number
  height: number
  /** 仅用于提示清晰度，不参与布局（R-4） */
  dpr?: number
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  opts: DrawSceneOptions,
): void {
  const { width, height } = opts
  const scale = height / 1080
  const rc: RenderContext = { ctx, width, height, scale }

  ctx.clearRect(0, 0, width, height)
  drawBackground(rc, scene.background)
  if (scene.logo) drawLogo(rc, scene.logo)
  if (scene.title) drawText(rc, scene.title)
  if (scene.subtitle) drawText(rc, scene.subtitle)
  if (scene.watermark)
    drawText(rc, scene.watermark, { opacity: scene.watermark.opacity })
}
