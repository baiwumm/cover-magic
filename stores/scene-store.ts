/**
 * Scene 单一数据源（R-2 / D-06）：zustand + zundo（撤销重做，上限 50）+ immer。
 * 组件不镜像 props，直接订阅 store 的原子 action（消灭 B-11）。
 * selected 为画布选中槽位（P1-10 联动），不进撤销历史（partialize 只留 scene）。
 */

import { produce } from "immer"
import { temporal } from "zundo"
import { create } from "zustand"
import { getDefaultTemplate } from "@/data/templates"
import type { SlotKey } from "@/lib/render/element-rects"
import { createDefaultScene, type Scene } from "@/lib/scene"

/** 撤销/重做上限（R-25 / D-25） */
export const HISTORY_LIMIT = 50

/** 历史合并窗口：窗口内的连续 set 合并为一条 undo 记录（P1-5） */
export const HISTORY_MERGE_MS = 400

/** D-20：进入编辑器的初始状态 = 套用精选默认模板（不是空白 Scene） */
function createInitialScene(): Scene {
  const t = getDefaultTemplate()
  return t ? structuredClone(t.scene) : createDefaultScene()
}

interface SceneActions {
  /** immer 风格草稿更新：updater 就地修改 draft */
  setScene: (updater: (draft: Scene) => void) => void
  /** 模板套用 = 整体替换（R-11），禁止增量合并 */
  replaceScene: (scene: Scene) => void
  /** 重置 = 默认值唯一定义处（R-10） */
  reset: () => void
  setSelected: (slot: SlotKey | null) => void
}

export type SceneStore = SceneActions & {
  scene: Scene
  selected: SlotKey | null
}

/** zundo handleSet 的入参形态（pastState 可能是 updater 函数） */
type HistoryStateArg =
  | SceneStore
  | Partial<SceneStore>
  | ((state: SceneStore) => SceneStore)

/** 窗口合并：保留窗口首次的 pastState，提交时用窗口内最新 currentState */
interface PendingHistory {
  pastState: HistoryStateArg
  replace: boolean | undefined
  currentState: HistoryStateArg
  timer: ReturnType<typeof setTimeout>
}

let pendingHistory: PendingHistory | null = null

function cancelPendingHistory(): void {
  if (pendingHistory) {
    clearTimeout(pendingHistory.timer)
    pendingHistory = null
  }
}

/**
 * 引用短路的深比较：Scene 含 dataURL 时 JSON.stringify 每次 set 都扫
 * 整串，开销大；immer 未改动的字符串引用不变，`===` 即可命中（P2）。
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!Object.hasOwn(b, k)) return false
    if (
      !deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      )
    )
      return false
  }
  return true
}

export const useSceneStore = create<SceneStore>()(
  temporal(
    (set) => ({
      scene: createInitialScene(),
      selected: null,
      setScene: (updater) =>
        set((state) => ({ scene: produce(state.scene, updater) })),
      replaceScene: (scene) => set({ scene }),
      reset: () => set({ scene: createDefaultScene() }),
      setSelected: (selected) => set({ selected }),
    }),
    {
      limit: HISTORY_LIMIT,
      equality: (a, b) => deepEqual(a.scene, b.scene),
      // selected 是 UI 态，不进历史（undo 不应改选中）
      partialize: (state) => ({ scene: state.scene }) as unknown as SceneStore,
      handleSet: (rawHandleSet) => {
        // zundo 类型标成 setState(partial)，运行时实际收 (pastState, replace, currentState)
        const handleSet = rawHandleSet as unknown as (
          pastState: HistoryStateArg,
          replace?: boolean,
          currentState?: HistoryStateArg,
        ) => void
        return (pastState, replace, currentState) => {
          if (pendingHistory) {
            pendingHistory.currentState = currentState
            clearTimeout(pendingHistory.timer)
          } else {
            pendingHistory = {
              pastState,
              replace,
              currentState,
              timer: 0 as unknown as ReturnType<typeof setTimeout>,
            }
          }
          pendingHistory.timer = setTimeout(() => {
            const p = pendingHistory
            pendingHistory = null
            if (p) handleSet(p.pastState, p.replace, p.currentState)
          }, HISTORY_MERGE_MS)
        }
      },
    },
  ),
)

/** 恢复/清史时取消未提交的合并窗口（避免 clear 后又补一条） */
export function cancelPendingHistoryMerge(): void {
  cancelPendingHistory()
}
