"use client"

/**
 * 画布区（2.6）：只读渲染 + 棋盘格衬底；比例跟随 scene.ratio（R-4）。
 * 拖拽/选中/参考线在 Phase 3 加入本组件。
 */

import { useEffect, useRef } from "react"
import { ensureFontLoaded } from "@/lib/fonts"
import { drawScene } from "@/lib/render/draw-scene"
import { preloadSceneAssets } from "@/lib/render/icons"
import { useSceneStore } from "@/stores/scene-store"

export function CanvasStage() {
  const scene = useSceneStore((s) => s.scene)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      const canvas = canvasRef.current
      const wrap = wrapRef.current
      if (!canvas || !wrap) return
      await Promise.all([
        ensureFontLoaded("Maple Mono CN", 400),
        ensureFontLoaded("Maple Mono CN", 700),
        preloadSceneAssets(scene),
      ])
      if (cancelled) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssW = wrap.clientWidth
      const cssH = (cssW * scene.ratio.h) / scene.ratio.w
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      drawScene(ctx, scene, { width: canvas.width, height: canvas.height })
    }
    void draw()
    const ro = new ResizeObserver(() => void draw())
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [scene])

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div
        ref={wrapRef}
        className="max-w-full"
        style={{
          width: `min(100%, calc((100vh - 12rem) * ${scene.ratio.w / scene.ratio.h}))`,
          // 棋盘格衬底：透明区域可见
          backgroundImage:
            "conic-gradient(from 90deg, oklch(0.85 0 0 / 0.35) 25%, transparent 0 50%, oklch(0.85 0 0 / 0.35) 0 75%, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        <canvas
          ref={canvasRef}
          className="block rounded-md shadow-lg ring-1 ring-black/10"
        />
      </div>
    </div>
  )
}
