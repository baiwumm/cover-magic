"use client"

/**
 * Phase 1 最小验证页：canvas + JSON textarea，手改 JSON 驱动全部渲染路径。
 * 工具栏 / store / 拖拽在 Phase 2-3 接入。
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { ensureFontLoaded } from "@/lib/fonts"
import { drawScene } from "@/lib/render/draw-scene"
import { preloadSceneAssets } from "@/lib/render/icons"
import { createDefaultScene, type Scene } from "@/lib/scene"

const INITIAL_JSON = JSON.stringify(createDefaultScene(), null, 2)

// R-24 一致性质检钩子：仅开发态暴露渲染入口，供浏览器端逐像素比对
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  ;(window as unknown as Record<string, unknown>).__coverMagic = {
    drawScene,
    preloadSceneAssets,
    ensureFontLoaded,
    createDefaultScene,
  }
}

export default function EditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [json, setJson] = useState(INITIAL_JSON)
  const [error, setError] = useState<string | null>(null)

  const render = useCallback(async (scene: Scene) => {
    const canvas = canvasRef.current
    if (!canvas) return
    // R-6：绘制文字前确保字体就绪；R-5：绘制前预热位图资源
    await Promise.all([
      ensureFontLoaded("Maple Mono CN", 400),
      ensureFontLoaded("Maple Mono CN", 700),
      preloadSceneAssets(scene),
    ])
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    // 内部分辨率固定 1080 基准：宽随比例，导出一致性在 Phase 5 对齐 exportSize
    const height = 1080
    const width = Math.round((1080 * scene.ratio.w) / scene.ratio.h)
    canvas.width = width
    canvas.height = height
    drawScene(ctx, scene, { width, height })
  }, [])

  useEffect(() => {
    let cancelled = false
    try {
      const scene = JSON.parse(json) as Scene
      setError(null)
      if (cancelled) return
      void render(scene)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    return () => {
      cancelled = true
    }
  }, [json, render])

  return (
    <main className="flex min-h-screen">
      <section className="flex flex-1 items-center justify-center bg-zinc-100 p-8 dark:bg-zinc-900">
        <canvas
          ref={canvasRef}
          className="max-h-[80vh] max-w-full rounded-lg border border-zinc-200 shadow-md dark:border-zinc-800"
        />
      </section>
      <aside className="flex w-[420px] shrink-0 flex-col gap-2 border-l border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Scene JSON
        </h2>
        {error && (
          <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          className="h-[calc(100vh-6rem)] w-full resize-none rounded-md border border-zinc-300 bg-white p-3 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
        />
      </aside>
    </main>
  )
}
