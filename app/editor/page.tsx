"use client"

/**
 * 编辑器页：字体预热（R-6）+ 自动保存（5.5）+ 分享链接恢复（R-13）+ 落地模板入口（P1-20）。
 * R-24 一致性质检钩子保留（仅开发态）。
 * P0-2：恢复完成后 markHydrated + 清撤销栈，避免误撤销覆盖存档。
 */

import { useEffect } from "react"
import { toast } from "sonner"
import { EditorShell } from "@/components/editor/editor-shell"
import {
  MobileGate,
  shouldShowMobileGate,
} from "@/components/editor/mobile-gate"
import { getTemplate } from "@/data/templates"
import { ensureFontLoaded } from "@/lib/fonts"
import { drawScene } from "@/lib/render/draw-scene"
import { computeSceneRects, hitTest } from "@/lib/render/element-rects"
import { preloadSceneAssets } from "@/lib/render/icons"
import { alignExportSize, createDefaultScene, type Scene } from "@/lib/scene"
import {
  cancelPendingSave,
  fallbackScene,
  loadStoredScene,
  markHydrated,
  saveSceneDebounced,
} from "@/lib/storage/autosave"
import { decodeSceneFromHash, encodeSceneToHash } from "@/lib/storage/share-url"
import { cancelPendingHistoryMerge, useSceneStore } from "@/stores/scene-store"

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

  // 5.5 启动恢复：分享链接 > ?template= 落地入口 > 本地 autosave；都非法 → 默认模板（D-28）
  // 恢复前 hydrated=false，autosave 不写盘；完成后清撤销栈，历史从用户首次操作开始。
  useEffect(() => {
    const { replaceScene } = useSceneStore.getState()
    const rawHash = window.location.hash
    const fromShare = rawHash.startsWith("#s=")
    // P1-20：落地页「一键套用」经 query 进入，载入后剥掉避免刷新重复套用
    const templateId = new URLSearchParams(window.location.search).get(
      "template",
    )
    if (fromShare || templateId) {
      history.replaceState(null, "", window.location.pathname)
    }
    void (async () => {
      const fromHash = fromShare ? await decodeSceneFromHash(rawHash) : null
      if (fromHash) {
        // R-4：分享 Scene 的 exportSize 必须与 ratio 同比例
        replaceScene(alignExportSize(fromHash))
      } else if (fromShare) {
        // P1-8：分享链接畸形/非法时不静默落本地存档，明确提示
        toast.error("分享链接无效", {
          description: "内容已损坏或版本不兼容，已载入本地存档。",
        })
        const stored = loadStoredScene()
        replaceScene(alignExportSize(stored ?? fallbackScene()))
      } else if (templateId) {
        const template = getTemplate(templateId)
        if (template) {
          // R-11：模板 = 整体替换
          replaceScene(structuredClone(template.scene))
        } else {
          toast.error("模板不存在", {
            description: "链接可能已过期，已载入本地存档。",
          })
          const stored = loadStoredScene()
          replaceScene(alignExportSize(stored ?? fallbackScene()))
        }
      } else {
        const stored = loadStoredScene()
        replaceScene(alignExportSize(stored ?? fallbackScene()))
      }
      // 恢复产生的状态不进撤销历史（否则零操作即可 undo 覆盖存档）
      cancelPendingHistoryMerge()
      useSceneStore.temporal.getState().clear()
      markHydrated()
      // 把恢复后的场景立刻落盘一次（等价于原「首帧保存」，但已过门闩）
      saveSceneDebounced(useSceneStore.getState().scene)
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
    return () => {
      unsub()
      cancelPendingSave()
    }
  }, [])

  // D-22：触屏/窄视口只出提示卡，不挂编辑器三栏
  if (shouldShowMobileGate()) {
    return <MobileGate />
  }

  return <EditorShell />
}
