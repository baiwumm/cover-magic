/**
 * 渲染原语（R-1 的组成部分：只被 draw-scene.ts 调用）。
 * 所有长度入参均为 1080 基准 px × scale 后的值（R-3）。
 */

import { blockRect, pctToPx } from "@/lib/geometry"
import type {
  Background,
  LogoLayer,
  Scene,
  TextBlock,
  TextStyle,
} from "@/lib/scene"
import { fitTextBlock } from "@/lib/text/wrap"
import { getCachedImage } from "./icons"

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  /** 画布实际像素宽高 */
  width: number
  height: number
  /** scale = height / 1080（R-3） */
  scale: number
}

/** 背景层：纯色 / 渐变 / 图片（cover-contain + blur + overlay） */
export function drawBackground(rc: RenderContext, bg: Background): void {
  const { ctx, width, height, scale } = rc
  ctx.save()
  if (bg.kind === "color") {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, width, height)
  } else if (bg.kind === "gradient") {
    const rad = ((bg.angle - 90) * Math.PI) / 180
    const cx = width / 2
    const cy = height / 2
    const len =
      (Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad))) / 2
    const grad = ctx.createLinearGradient(
      cx - Math.cos(rad) * len,
      cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len,
      cy + Math.sin(rad) * len,
    )
    grad.addColorStop(0, bg.from)
    grad.addColorStop(1, bg.to)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  } else {
    // 图片背景：先铺底色防止透明区
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, width, height)
    const img = getCachedImage({ kind: "upload", dataUrl: bg.dataUrl })
    if (img) {
      ctx.filter = bg.blur > 0 ? `blur(${bg.blur * scale}px)` : "none"
      if (bg.fit === "cover") {
        const r = Math.max(width / img.width, height / img.height)
        const w = img.width * r
        const h = img.height * r
        ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
      } else {
        const r = Math.min(width / img.width, height / img.height)
        const w = img.width * r
        const h = img.height * r
        ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
      }
      ctx.filter = "none"
      if (bg.overlay > 0) {
        ctx.globalAlpha = bg.overlay
        ctx.fillStyle = bg.overlayColor
        ctx.fillRect(0, 0, width, height)
        ctx.globalAlpha = 1
      }
    }
  }
  ctx.restore()
}

/** 设置字体状态（R-7 真字重：italic 走 ctx.font，不用 transform 伪斜切） */
function applyFont(
  ctx: CanvasRenderingContext2D,
  style: TextStyle,
  sizePx: number,
): void {
  const italic = style.italic ? "italic " : ""
  ctx.font = `${italic}${style.fontWeight} ${sizePx}px "${style.fontFamily}"`
}

function applyLetterSpacing(
  ctx: CanvasRenderingContext2D,
  spacingBasePx: number,
  scale: number,
): void {
  // Chrome/Edge/Firefox 支持 ctx.letterSpacing；不支持的浏览器该属性赋值被忽略（量宽与绘制同源，R-24 不受影响）
  type SpacingCtx = CanvasRenderingContext2D & { letterSpacing?: string }
  ;(ctx as SpacingCtx).letterSpacing = `${spacingBasePx * scale}px`
}

interface PreparedText {
  lines: string[]
  fontSizePx: number
  lineBoxPx: number
  blockWidthPx: number
  blockHeightPx: number
}

/** 断行 + 自适应 + 度量（预览/导出走同一份逻辑） */
export function prepareText(
  rc: RenderContext,
  style: TextStyle,
  block: Pick<TextBlock, "text">,
  maxWidthPct: number,
): PreparedText {
  const { ctx, width, scale } = rc
  const blockWidthBase = pctToPx(maxWidthPct, width)
  applyLetterSpacing(ctx, style.letterSpacing, scale)
  const fit = fitTextBlock({
    text: style.uppercase ? block.text.toUpperCase() : block.text,
    fontPx: style.size,
    maxWidthPx: blockWidthBase,
    lineHeight: style.lineHeight,
    measure: (t, fontPx) => {
      applyFont(ctx, style, fontPx * scale)
      return ctx.measureText(t).width
    },
  })

  const fontSizePx = fit.fontSize * scale
  const lineBoxPx = fit.fontSize * style.lineHeight * scale
  // 重新以最终字号量宽（fit 内部量的是中间字号）
  applyFont(ctx, style, fontSizePx)
  const blockWidthPx = Math.max(
    1,
    ...fit.lines.map((l) => ctx.measureText(l).width),
  )
  const blockHeightPx = Math.max(fontSizePx, fit.lines.length * lineBoxPx)
  return {
    lines: fit.lines,
    fontSizePx,
    lineBoxPx,
    blockWidthPx,
    blockHeightPx,
  }
}

/** 文本块：块中心锚点（x/y 为百分比），多行 + 对齐 + 立体字 */
export function drawText(
  rc: RenderContext,
  text: TextStyle & TextBlock,
  opts: { opacity?: number } = {},
): void {
  const { ctx, width, height, scale } = rc
  const prepared = prepareText(rc, text, text, text.maxWidthPct)
  if (!prepared.lines.length) return

  const rect = blockRect(
    text.x,
    text.y,
    prepared.blockWidthPx,
    prepared.blockHeightPx,
    width,
    height,
  )
  ctx.save()
  applyFont(ctx, text, prepared.fontSizePx)
  ctx.textBaseline = "top"
  if (opts.opacity !== undefined) ctx.globalAlpha = opts.opacity
  if (text.shadow > 0) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)"
    ctx.shadowBlur = text.shadow * 2 * scale
    ctx.shadowOffsetY = text.shadow * 0.6 * scale
  }
  ctx.fillStyle = text.color
  const halfLeading = (prepared.lineBoxPx - prepared.fontSizePx) / 2
  prepared.lines.forEach((line, i) => {
    const lineW = ctx.measureText(line).width
    const lineX =
      text.align === "left"
        ? rect.x
        : text.align === "right"
          ? rect.x + rect.width - lineW
          : rect.x + (rect.width - lineW) / 2
    ctx.fillText(line, lineX, rect.y + i * prepared.lineBoxPx + halfLeading)
  })
  ctx.restore()
}

/** 图标层：Iconify / 上传图，中心锚点，可带投影 */
export function drawLogo(rc: RenderContext, logo: LogoLayer): void {
  const { ctx, width, height, scale } = rc
  const img =
    logo.source.kind === "upload"
      ? getCachedImage({ kind: "upload", dataUrl: logo.source.dataUrl })
      : getCachedImage({ kind: "iconify", code: logo.source.code })
  if (!img) return
  const sizePx = logo.size * scale
  const rect = blockRect(
    logo.x,
    logo.y,
    sizePx,
    (sizePx * img.height) / img.width,
    width,
    height,
  )
  ctx.save()
  if (logo.shadow && logo.shadow.size > 0) {
    ctx.shadowColor = logo.shadow.color
    ctx.shadowBlur = logo.shadow.size * scale
    ctx.shadowOffsetY = logo.shadow.size * 0.4 * scale
  }
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height)
  ctx.restore()
}

/** 场景中出现的字体（R-6 预热用） */
export function sceneFonts(
  scene: Scene,
): Array<{ family: string; weight: 400 | 700 }> {
  const out: Array<{ family: string; weight: 400 | 700 }> = []
  for (const t of [scene.title, scene.subtitle, scene.watermark]) {
    if (t) out.push({ family: t.fontFamily, weight: t.fontWeight })
  }
  return out
}
