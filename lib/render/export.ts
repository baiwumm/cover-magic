/**
 * 导出工具（R-1：绘制必经 drawScene；R-5：导出前预热资源）。
 * Phase 2 提供最小下载能力，剪贴板/预估体积等在 Phase 5 补齐。
 */

import { ensureFontLoaded } from "@/lib/fonts"
import type { Scene } from "@/lib/scene"
import { drawScene } from "./draw-scene"
import { preloadSceneAssets } from "./icons"

export type ExportFormat = "png" | "jpeg" | "webp"

export const MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
}

/** 标题 slug + 时间戳（5.3）；按码点切片，避免切断 emoji 代理对（P2） */
export function buildFileName(scene: Scene, format: ExportFormat): string {
  const cleaned = (scene.title?.text ?? "cover")
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const base = [...cleaned].slice(0, 40).join("")
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
  return `${base || "cover"}-${ts}.${format}`
}

export async function renderToCanvas(scene: Scene): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas")
  canvas.width = scene.exportSize.width
  canvas.height = scene.exportSize.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("无法创建画布上下文")
  const [failed] = await Promise.all([
    preloadSceneAssets(scene),
    ensureFontLoaded("Maple Mono CN", 400),
    ensureFontLoaded("Maple Mono CN", 700),
  ])
  // P1-24：资源加载失败不再静默缺图导出
  if (failed.length > 0) {
    throw new Error(
      `图片资源加载失败（${failed.join("、")}），请检查网络后重试。`,
    )
  }
  drawScene(ctx, scene, { width: canvas.width, height: canvas.height })
  return canvas
}

export async function exportSceneToBlob(
  scene: Scene,
  format: ExportFormat,
  quality = 0.92,
): Promise<Blob> {
  const canvas = await renderToCanvas(scene)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(
      resolve,
      MIME[format],
      format === "png" ? undefined : quality,
    ),
  )
  if (!blob) throw new Error("导出失败：toBlob 返回空")
  // 部分浏览器不支持请求的 MIME 时会回退 PNG（P2）
  if (blob.type && blob.type !== MIME[format]) {
    throw new Error(
      `当前浏览器不支持导出 ${format.toUpperCase()}，请改用 PNG。`,
    )
  }
  return blob
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  // 释放对象 URL（R-5 同源纪律）
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
