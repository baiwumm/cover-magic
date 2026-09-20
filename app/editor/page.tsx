"use client"

/**
 * 编辑器页：字体预热（R-6）+ 自动保存（5.5）+ 分享链接恢复（R-13）。
 * R-24 一致性质检钩子保留（仅开发态）。
 */

import { useEffect } from "react"
import { EditorShell } from "@/components/editor/editor-shell"
import { ensureFontLoaded } from "@/lib/fonts"
import { drawScene } from "@/lib/render/draw-scene"
import { computeSceneRects, hitTest } from "@/lib/render/element-rects"
import { preloadSceneAssets } from "@/lib/render/icons"
import { createDefaultScene, type Scene } from "@/lib/scene"
import {
  fallbackScene,
  loadStoredScene,
  saveSceneDebounced,
} from "@/lib/storage/autosave"
import { decodeSceneFromHash, encodeSceneToHash } from "@/lib/storage/share-url"
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
    encodeSceneToHash,
    decodeSceneFromHash,
  }
}

export default function EditorPage() {
  // R-6：预热全部字重，首次绘制即拿到真字重
  useEffect(() => {
    void ensureFontLoaded("Maple Mono CN", 400)
    void ensureFontLoaded("Maple Mono CN", 700)
  }, [])

  // 5.5 启动恢复：分享链接优先，其次本地 autosave；都非法 → 默认模板（D-28）
  useEffect(() => {
    const { replaceScene } = useSceneStore.getState()
    // 先同步捕获并清掉 hash：避免刷新时重复套用旧分享（Next 路由可能恢复 hash）
    const rawHash = window.location.hash
    if (rawHash.startsWith("#s=")) {
      history.replaceState(null, "", window.location.pathname)
    }
    void (async () => {
      const fromHash = await decodeSceneFromHash(rawHash)
      if (fromHash) {
        replaceScene(fromHash)
        return
      }
      const stored = loadStoredScene()
      if (stored) replaceScene(stored)
      else replaceScene(fallbackScene())
    })()
  }, [])

  // 5.5 autosave：场景变化 → debounce 400ms 写 localStorage
  useEffect(() => {
    let last: Scene | null = null
    const unsub = useSceneStore.subscribe((state) => {
      if (state.scene !== last) {
        last = state.scene
        saveSceneDebounced(state.scene)
      }
    })
    // 首帧也存一次（确保刷新可恢复）
    saveSceneDebounced(useSceneStore.getState().scene)
    return unsub
  }, [])

  return <EditorShell />
}
