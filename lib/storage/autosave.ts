/**
 * 自动保存（D-24 / 5.5）：debounce 400ms 写 localStorage。
 * 只存 Scene JSON；读取时校验 version，非法即回退默认模板（D-28 不做 v1 迁移）。
 */

import { getDefaultTemplate } from "@/data/templates"
import { createDefaultScene, type Scene } from "@/lib/scene"

const KEY = "cover-magic:scene:v2"
const DEBOUNCE_MS = 400

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

function isLegalScene(s: unknown): s is Scene {
  if (typeof s !== "object" || s === null) return false
  const scene = s as Record<string, unknown>
  if (scene.version !== 2) return false
  if (typeof scene.presetId !== "string") return false
  if (typeof scene.ratio !== "object" || scene.ratio === null) return false
  const { w, h } = scene.ratio as { w: unknown; h: unknown }
  if (typeof w !== "number" || typeof h !== "number" || w <= 0 || h <= 0)
    return false
  if (typeof scene.exportSize !== "object" || scene.exportSize === null)
    return false
  if (typeof scene.background !== "object" || scene.background === null)
    return false
  return true
}

/** 非法存储的回退：默认模板（D-20 / D-28） */
export function fallbackScene(): Scene {
  return structuredClone(getDefaultTemplate()?.scene ?? createDefaultScene())
}

let timer: ReturnType<typeof setTimeout> | null = null

export function saveSceneDebounced(scene: Scene): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(scene))
    } catch {
      // localStorage 满（R-16 上限）或被禁用：静默失败，不阻塞编辑
    }
  }, DEBOUNCE_MS)
}

export function clearStoredScene(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 忽略
  }
}
