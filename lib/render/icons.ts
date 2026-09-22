/**
 * Iconify 图标与上传图片的加载缓存（R-5 画布防污染）。
 * 一律 fetch → dataURL（同源安全，无 revoke 需要），禁止跨域 <img> 直绘。
 * drawScene 是同步的：绘制前先 await preloadSceneAssets(scene) 预热本缓存。
 */

const imageCache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement | null>>()
/** LRU 上限：上传 dataURL 很大，不能永久驻留（P2） */
const IMAGE_CACHE_MAX = 48

function cacheGet(key: string): HTMLImageElement | null {
  const img = imageCache.get(key)
  if (!img) return null
  // 刷新到队尾（LRU）
  imageCache.delete(key)
  imageCache.set(key, img)
  return img
}

function cacheSet(key: string, img: HTMLImageElement): void {
  imageCache.delete(key)
  imageCache.set(key, img)
  while (imageCache.size > IMAGE_CACHE_MAX) {
    const oldest = imageCache.keys().next().value
    if (oldest === undefined) break
    imageCache.delete(oldest)
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Iconify code（如 "fluent-emoji-flat:fire"）→ SVG dataURL */
async function fetchIconifyDataUrl(code: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.iconify.design/${code}.svg`)
    if (!res.ok) return null
    const svg = await res.text()
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch {
    return null
  }
}

function sourceKey(source: {
  kind: string
  code?: string
  dataUrl?: string
}): string | null {
  if (source.kind === "iconify" && source.code) return `icon:${source.code}`
  if (source.kind === "upload" && source.dataUrl)
    return `upload:${source.dataUrl}`
  return null
}

async function loadSource(
  key: string,
  src: string,
): Promise<HTMLImageElement | null> {
  const img = await loadImage(src)
  if (img) cacheSet(key, img)
  return img
}

/** 同步取已缓存的图片；未预热时返回 null（绘制跳过，下一帧补上） */
export function getCachedImage(source: {
  kind: string
  code?: string
  dataUrl?: string
}): HTMLImageElement | null {
  const key = sourceKey(source)
  return key ? cacheGet(key) : null
}

/** 异步加载并缓存；并发调用共享同一 promise */
export function preloadImage(source: {
  kind: string
  code?: string
  dataUrl?: string
}): Promise<HTMLImageElement | null> {
  const key = sourceKey(source)
  if (!key) return Promise.resolve(null)
  const cached = cacheGet(key)
  if (cached) return Promise.resolve(cached)
  const inflight = pending.get(key)
  if (inflight) return inflight
  const task = (async () => {
    const src =
      source.kind === "iconify" && source.code
        ? ((await fetchIconifyDataUrl(source.code)) ?? "")
        : (source.dataUrl ?? "")
    const result = src ? await loadSource(key, src) : null
    pending.delete(key)
    return result
  })()
  pending.set(key, task)
  return task
}

/**
 * 预热 Scene 中的全部位图资源（背景图 / logo）。
 * 返回加载失败的资源名（如 ["背景图", "Logo"]）；预览可忽略，导出前必须检查（P1-24）。
 */
export async function preloadSceneAssets(scene: {
  background: { kind: string; dataUrl?: string }
  logo: { source: { kind: string; code?: string; dataUrl?: string } } | null
}): Promise<string[]> {
  const failed: string[] = []
  const tasks: Promise<void>[] = []
  if (scene.background.kind === "image" && scene.background.dataUrl) {
    tasks.push(
      preloadImage({ kind: "upload", dataUrl: scene.background.dataUrl }).then(
        (img) => {
          if (!img) failed.push("背景图")
        },
      ),
    )
  }
  if (scene.logo) {
    tasks.push(
      preloadImage(scene.logo.source).then((img) => {
        if (!img) failed.push("Logo")
      }),
    )
  }
  await Promise.all(tasks)
  return failed
}
