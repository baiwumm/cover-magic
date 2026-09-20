/**
 * 撤销重做（R-25：上限 50 步，上限定义在 stores/scene-store.ts）。
 * zundo temporal 中间件已在 stores/scene-store.ts 应用；这里提供
 * 响应式的历史控制 hooks（按钮态）与命令式 helpers。
 */

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
