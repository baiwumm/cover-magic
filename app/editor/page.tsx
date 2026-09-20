"use client"

/**
 * Phase 2：编辑器三栏外壳。Phase 1 的 JSON 驱动调试页已由 UI 接管；
 * R-24 一致性质检钩子保留（仅开发态）。
 */

import { useEffect } from "react"
import { EditorShell } from "@/components/editor/editor-shell"
import { ensureFontLoaded } from "@/lib/fonts"
import { drawScene } from "@/lib/render/draw-scene"
import { computeSceneRects, hitTest } from "@/lib/render/element-rects"
import { preloadSceneAssets } from "@/lib/render/icons"
import { createDefaultScene } from "@/lib/scene"
import { useSceneStore } from "@/stores/scene-store"

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  ;(window as unknown as Record<string, unknown>).__coverMagic = {
    drawScene,
    preloadSceneAssets,
    ensureFontLoaded,
    createDefaultScene,
    computeSceneRects,
    hitTest,
    getScene: () => useSceneStore.getState().scene,
  }
}

export default function EditorPage() {
  // R-6：预热全部字重，首次绘制即拿到真字重
  useEffect(() => {
    void ensureFontLoaded("Maple Mono CN", 400)
    void ensureFontLoaded("Maple Mono CN", 700)
  }, [])

  return <EditorShell />
}
