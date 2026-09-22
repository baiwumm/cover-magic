/**
 * 撤销重做（R-25：上限 50 步，上限定义在 stores/scene-store.ts）。
 * zundo temporal 中间件已在 stores/scene-store.ts 应用；这里提供
 * 响应式的历史控制 hooks（按钮态）、命令式 helpers 与全局快捷键（P1-9）。
 */

import { useEffect } from "react"
import { useStore } from "zustand"
import { useSceneStore } from "@/stores/scene-store"

/** zundo 挂在 store 上的 temporal vanilla store */
export const temporalStore = useSceneStore.temporal

/** 组件内使用：undo/redo + 可否执行（响应式） */
export function useHistoryControls() {
  const pastCount = useStore(temporalStore, (s) => s.pastStates.length)
  const futureCount = useStore(temporalStore, (s) => s.futureStates.length)
  const undo = () => temporalStore.getState().undo()
  const redo = () => temporalStore.getState().redo()
  return {
    undo,
    redo,
    canUndo: pastCount > 0,
    canRedo: futureCount > 0,
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

/**
 * 全局 Ctrl/Cmd+Z 撤销、Ctrl+Shift+Z / Ctrl+Y 重做。
 * 输入框内让位原生 undo（P1-9）。
 */
export function useHistoryShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.altKey) return
      if (isEditableTarget(e.target)) return
      const key = e.key.toLowerCase()
      const api = temporalStore.getState()
      if (key === "z" && !e.shiftKey) {
        e.preventDefault()
        api.undo()
        return
      }
      if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault()
        api.redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}
