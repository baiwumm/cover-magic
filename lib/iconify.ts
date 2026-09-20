/**
 * Iconify 搜索（5.7 / D-27）：搜索 API + 300ms 防抖在 UI 层 + AbortController + Map 缓存。
 * 精选集合（fluent-emoji-flat / noto / twemoji / openmoji）优先展示。
 * 图标走 dataURL（R-5 画布防污染），复用 lib/render/icons 的缓存。
 */

const API = "https://api.iconify.design"

/** 精选图标（D-27）：默认展示，无需搜索即可用 */
export const CURATED_ICONS = [
  "fluent-emoji-flat:fire",
  "fluent-emoji-flat:rocket",
  "fluent-emoji-flat:bulb",
  "fluent-emoji-flat:books",
  "fluent-emoji-flat:gear",
  "fluent-emoji-flat:laptop",
  "noto:rocket",
  "noto:light-bulb",
  "noto:open-book",
  "noto:gear",
  "twemoji:rocket",
  "twemoji:bulb",
  "twemoji:books",
  "twemoji:gear",
  "openmoji:rocket",
  "openmoji:light-bulb",
  "openmoji:books",
  "openmoji:gear",
  "fluent-emoji-flat:trophy",
  "fluent-emoji-flat:computer",
  "noto:desktop-computer",
  "twemoji:laptop",
  "openmoji:computer",
  "fluent-emoji-flat:memo",
]

export interface SearchOptions {
  limit?: number
  signal?: AbortSignal
}

const searchCache = new Map<string, string[]>()

/** 全库搜索（图标的 iconify code 列表） */
export async function searchIcons(
  query: string,
  opts: SearchOptions = {},
): Promise<string[]> {
  const { limit = 48, signal } = opts
  const q = query.trim()
  if (!q) return []
  const cacheKey = `${q}:${limit}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached
  try {
    const res = await fetch(
      `${API}/search?query=${encodeURIComponent(q)}&limit=${limit}`,
      { signal },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { icons?: string[] }
    const icons = data.icons ?? []
    searchCache.set(cacheKey, icons)
    return icons
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e
    return []
  }
}
