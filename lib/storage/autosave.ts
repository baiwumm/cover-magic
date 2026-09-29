/**
 * 自动保存（D-24 / 5.5）：debounce 400ms 写 localStorage。
 * 只存 Scene JSON；读取时校验 version，非法即回退默认模板（D-28 不做 v1 迁移）。
 * hydrated 门闩：启动恢复完成前禁止排保存，避免默认场景覆盖本地存档。
 */

import { toast } from "@/components/toast/toast"
import { getDefaultTemplate } from "@/data/templates"
import { createDefaultScene, type Scene } from "@/lib/scene"

const KEY = "cover-magic:scene:v2"
const DEBOUNCE_MS = 400

/** true = 启动恢复已完成，允许 autosave 写盘 */
let hydrated = false
let timer: ReturnType<typeof setTimeout> | null = null
/** 等待落盘的最新场景（flush 时同步写，P2-6） */
let pendingScene: Scene | null = null
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

/** 导出边长上限（px）：畸形 hash/存档不得造出天文尺寸画布（防 OOM） */
const MAX_EXPORT_EDGE = 8000
/** ratio 边长上限：同上，比例本身无量纲但需防 NaN/Infinity/巨值 */
const MAX_RATIO_EDGE = 10000

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

/** 合法尺寸：有限数且 > 0（NaN/Infinity 一律不通过） */
function isDim(v: unknown): v is number {
  return isFiniteNumber(v) && v > 0
}

export function isLegalScene(s: unknown): s is Scene {
  if (typeof s !== "object" || s === null) return false
  const scene = s as Record<string, unknown>
  if (scene.version !== 2) return false
  if (scene.templateId !== null && typeof scene.templateId !== "string")
    return false
  if (typeof scene.presetId !== "string" || scene.presetId === "") return false

  const ratio = scene.ratio as { w?: unknown; h?: unknown } | null
  if (typeof ratio !== "object" || ratio === null) return false
  if (
    !isDim(ratio.w) ||
    !isDim(ratio.h) ||
    ratio.w > MAX_RATIO_EDGE ||
    ratio.h > MAX_RATIO_EDGE
  )
    return false

  const es = scene.exportSize as { width?: unknown; height?: unknown } | null
  if (typeof es !== "object" || es === null) return false
  if (!isDim(es.width) || !isDim(es.height)) return false
  if (es.width > MAX_EXPORT_EDGE || es.height > MAX_EXPORT_EDGE) return false

  const bg = scene.background as Record<string, unknown> | null
  if (typeof bg !== "object" || bg === null) return false
  const kind = bg.kind
  if (kind === "color") {
    if (typeof bg.color !== "string" || bg.color === "") return false
  } else if (kind === "gradient") {
    if (
      typeof bg.from !== "string" ||
      bg.from === "" ||
      typeof bg.to !== "string" ||
      bg.to === "" ||
      !isFiniteNumber(bg.angle)
    )
      return false
  } else if (kind === "image") {
    if (
      typeof bg.dataUrl !== "string" ||
      (bg.fit !== "cover" && bg.fit !== "contain") ||
      !isFiniteNumber(bg.blur) ||
      bg.blur < 0 ||
      !isFiniteNumber(bg.overlay) ||
      bg.overlay < 0 ||
      typeof bg.overlayColor !== "string" ||
      bg.overlayColor === ""
    )
      return false
  } else {
    return false
  }

  if (!("logo" in scene)) return false
  if (scene.logo !== null) {
    const logo = scene.logo as Record<string, unknown> | null
    if (typeof logo !== "object" || logo === null) return false
    const src = logo.source as Record<string, unknown> | null
    if (typeof src !== "object" || src === null) return false
    if (src.kind === "iconify") {
      if (typeof src.code !== "string" || src.code === "") return false
    } else if (src.kind === "upload") {
      if (typeof src.dataUrl !== "string" || src.dataUrl === "") return false
    } else {
      return false
    }
    if (!isFiniteNumber(logo.size) || logo.size <= 0) return false
    if (!isFiniteNumber(logo.x) || !isFiniteNumber(logo.y)) return false
    if (logo.color !== undefined && typeof logo.color !== "string") return false
    if (logo.shadow !== undefined) {
      const sh = logo.shadow as { size?: unknown; color?: unknown } | null
      if (typeof sh !== "object" || sh === null) return false
      if (!isFiniteNumber(sh.size) || sh.size < 0) return false
      if (typeof sh.color !== "string") return false
    }
  }

  for (const key of ["title", "subtitle", "watermark"] as const) {
    if (!(key in scene)) return false
    const block = scene[key]
    if (block === null) continue
    if (typeof block !== "object" || block === null) return false
    const b = block as Record<string, unknown>
    if (typeof b.text !== "string") return false
    if (!isFiniteNumber(b.x) || !isFiniteNumber(b.y)) return false
    if (!isFiniteNumber(b.size) || b.size <= 0) return false
    if (typeof b.color !== "string" || b.color === "") return false
    if (typeof b.fontFamily !== "string" || b.fontFamily === "") return false
    if (b.fontWeight !== 400 && b.fontWeight !== 700) return false
    if (typeof b.italic !== "boolean") return false
    if (typeof b.autoFit !== "boolean") return false
    if (typeof b.uppercase !== "boolean") return false
    if (
      !isFiniteNumber(b.maxWidthPct) ||
      b.maxWidthPct <= 0 ||
      b.maxWidthPct > 100
    )
      return false
    if (!isFiniteNumber(b.letterSpacing)) return false
    if (!isFiniteNumber(b.lineHeight) || b.lineHeight <= 0) return false
    if (b.align !== "left" && b.align !== "center" && b.align !== "right")
      return false
    if (!isFiniteNumber(b.shadow) || b.shadow < 0) return false
    if (key === "watermark") {
      if (!isFiniteNumber(b.opacity) || b.opacity < 0 || b.opacity > 1)
        return false
    }
  }

  return true
}

/** 非法存储的回退：默认模板（D-20 / D-28） */
export function fallbackScene(): Scene {
  return structuredClone(getDefaultTemplate()?.scene ?? createDefaultScene())
}

export function saveSceneDebounced(scene: Scene): void {
  if (!hydrated) return
  pendingScene = scene
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    writePending()
  }, DEBOUNCE_MS)
}

/**
 * 立即落盘未完成的 debounce（P2-6）：pagehide / visibilitychange=hidden /
 * 离开编辑器时调用，避免「改完 400ms 内关页」丢最后一笔修改。
 */
export function flushPendingSave(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  writePending()
}

function writePending(): void {
  const scene = pendingScene
  pendingScene = null
  if (!hydrated || !scene) return
  try {
    localStorage.setItem(KEY, JSON.stringify(scene))
    // 写盘成功后复位一次性提示位，后续再超限仍能提示（P2-6）
    quotaWarned = false
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
}

export function clearStoredScene(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 忽略
  }
}

/**
 * 关页/切后台时同步落盘（P2-6）：400ms debounce 窗口内关页、
 * 切走标签页（移动端常直接杀进程）都会丢最后一笔修改。
 */
if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("pagehide", flushPendingSave)
  window.addEventListener("beforeunload", flushPendingSave)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingSave()
  })
}
