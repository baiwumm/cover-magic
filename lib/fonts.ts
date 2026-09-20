/**
 * 字体清单与预热（R-6 / R-15）。
 * 字体文件由 scripts/fetch-fonts.sh 产出（public/fonts/*.woff2，GB2312 子集）。
 * 必须同时提供 400/700 两字重（R-7 真字重的前提）。
 */

export const FONTS = [
  {
    family: "Maple Mono CN",
    label: "Maple Mono CN",
    weights: [400, 700],
  },
] as const

export type FontFamily = (typeof FONTS)[number]["family"]

const loaded = new Set<string>()

/**
 * 确保指定字重已加载（R-6：绘制前必须 await，禁止用宽度差猜字体）。
 * 已加载过时立即返回，可安全地在每次绘制前调用。
 */
export async function ensureFontLoaded(
  family: string,
  weight: 400 | 700,
): Promise<void> {
  const key = `${family}:${weight}`
  if (loaded.has(key)) return
  try {
    await document.fonts.load(`${weight} 100px "${family}"`)
    loaded.add(key)
  } catch {
    // 字体加载失败：回退系统字体，不阻塞渲染
  }
}

/** 预热全部清单字重（编辑器挂载时调用） */
export async function preloadFonts(): Promise<void> {
  await Promise.all(
    FONTS.flatMap((f) => f.weights.map((w) => ensureFontLoaded(f.family, w))),
  )
}
