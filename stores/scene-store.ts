/**
 * Scene 单一数据源（R-2 / D-06）：zustand + zundo（撤销重做，上限 50）+ immer。
 * 组件不镜像 props，直接订阅 store 的原子 action（消灭 B-11）。
 */

import { produce } from "immer"
import { temporal } from "zundo"
import { create } from "zustand"
import { getDefaultTemplate } from "@/data/templates"
import { createDefaultScene, type Scene } from "@/lib/scene"

/** 撤销/重做上限（R-25 / D-25） */
export const HISTORY_LIMIT = 50

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
}

export type SceneStore = SceneActions & { scene: Scene }

export const useSceneStore = create<SceneStore>()(
  temporal(
    (set) => ({
      scene: createInitialScene(),
      setScene: (updater) =>
        set((state) => ({ scene: produce(state.scene, updater) })),
      replaceScene: (scene) => set({ scene }),
      reset: () => set({ scene: createDefaultScene() }),
    }),
    {
      limit: HISTORY_LIMIT,
      equality: (a, b) => JSON.stringify(a.scene) === JSON.stringify(b.scene),
    },
  ),
)
