/**
 * 自动保存（D-24 / 5.5）：debounce 400ms 写 localStorage。
 * 只存 Scene JSON；读取时校验 version，非法即回退默认模板（D-28 不做 v1 迁移）。
 * hydrated 门闩：启动恢复完成前禁止排保存，避免默认场景覆盖本地存档。
 */

import { toast } from "sonner"
import { getDefaultTemplate } from "@/data/templates"
import { createDefaultScene, type Scene } from "@/lib/scene"

const KEY = "cover-magic:scene:v2"
const DEBOUNCE_MS = 400

/** true = 启动恢复已完成，允许 autosave 写盘 */
let hydrated = false
let timer: ReturnType<typeof setTimeout> | null = null
/** 配额超限只 toast 一次，避免每次 debounce 都弹（P1-25） */
let quotaWarned = false

export function markHydrated(): void {
  hydrated = true
}

export function isHydrated(): boolean {
  return hydrated
}

/** 校验并读取存储的 Scene；非法返回 null（调用方回退默认模板） */
export function loadStoredScene(): Scene | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Scene
    if (!isLegalScene(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function isLegalScene(s: unknown): s is Scene {
  if (typeof s !== "object" || s === null) return false
  const scene = s as Record<string, unknown>
  if (scene.version !== 2) return false
  if (typeof scene.presetId !== "string") return false

  const ratio = scene.ratio as { w?: unknown; h?: unknown } | null
  if (typeof ratio !== "object" || ratio === null) return false
  if (
    typeof ratio.w !== "number" ||
    typeof ratio.h !== "number" ||
    ratio.w <= 0 ||
    ratio.h <= 0
  )
    return false

  const es = scene.exportSize as { width?: unknown; height?: unknown } | null
  if (typeof es !== "object" || es === null) return false
  if (
    typeof es.width !== "number" ||
    typeof es.height !== "number" ||
    es.width <= 0 ||
    es.height <= 0
  )
    return false

  const bg = scene.background as Record<string, unknown> | null
  if (typeof bg !== "object" || bg === null) return false
  const kind = bg.kind
  if (kind === "color") {
    if (typeof bg.color !== "string") return false
  } else if (kind === "gradient") {
    if (
      typeof bg.from !== "string" ||
      typeof bg.to !== "string" ||
      typeof bg.angle !== "number"
    )
      return false
  } else if (kind === "image") {
    if (
      typeof bg.dataUrl !== "string" ||
      (bg.fit !== "cover" && bg.fit !== "contain") ||
      typeof bg.blur !== "number" ||
      typeof bg.overlay !== "number" ||
      typeof bg.overlayColor !== "string"
    )
      return false
  } else {
    return false
  }

  if (scene.logo !== null) {
    const logo = scene.logo as Record<string, unknown> | null
    if (typeof logo !== "object" || logo === null) return false
    const src = logo.source as Record<string, unknown> | null
    if (typeof src !== "object" || src === null) return false
    if (src.kind !== "iconify" && src.kind !== "upload") return false
    if (typeof logo.size !== "number" || logo.size <= 0) return false
  }

  for (const key of ["title", "subtitle", "watermark"] as const) {
    const block = scene[key]
    if (block === null || block === undefined) continue
    if (typeof block !== "object") return false
    const b = block as Record<string, unknown>
    if (
      typeof b.text !== "string" ||
      typeof b.x !== "number" ||
      typeof b.y !== "number" ||
      typeof b.size !== "number" ||
      typeof b.color !== "string"
    )
      return false
  }

  return true
}

/** 非法存储的回退：默认模板（D-20 / D-28） */
export function fallbackScene(): Scene {
  return structuredClone(getDefaultTemplate()?.scene ?? createDefaultScene())
}

export function saveSceneDebounced(scene: Scene): void {
  if (!hydrated) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    try {
      localStorage.setItem(KEY, JSON.stringify(scene))
    } catch {
      // localStorage 满（R-16 上限）或被禁用：一次性提示，不阻塞编辑（P1-25）
      if (!quotaWarned) {
        quotaWarned = true
        toast.error("本地存储空间不足", {
          description:
            "当前修改未能保存，刷新后可能丢失。可删除部分上传图片或换用更小的图片。",
        })
      }
    }
  }, DEBOUNCE_MS)
}

/** 取消未落盘的 debounce（组件卸载时调用，避免模块级 timer 泄漏） */
export function cancelPendingSave(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

export function clearStoredScene(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 忽略
  }
}
