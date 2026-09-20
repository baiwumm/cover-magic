/**
 * CJK 禁则断行 + autoFit 降级（R-8，纯函数，必须测）。
 * 降级顺序固定：缩字号 → 减行 → 省略号。
 * 量宽通过 measure 注入；块宽上限 maxWidthPx 不随字号缩放（缩的是字号本身）。
 */

/** 不得出现在行首的标点 */
export const LINE_START_PROHIBITED = "，。、！？；：）》”’％‰·—…"

/** 不得出现在行尾的标点 */
export const LINE_END_PROHIBITED = "（《“‘"

const CJK_REGEX =
  /[\u2e80-\u2eff\u3000-\u303f\u31c0-\u31ef\u3200-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/

export interface WrapOptions {
  /** 行宽上限（px，不随字号变化） */
  maxWidth: number
  measureText: (text: string) => number
}

export interface WrapResult {
  lines: string[]
}

interface Token {
  text: string
  /** 拉丁词（不可从中间断开） */
  latin: boolean
  space: boolean
}

function tokenize(paragraph: string): Token[] {
  const tokens: Token[] = []
  let latinBuf = ""
  const flushLatin = () => {
    if (latinBuf) {
      tokens.push({ text: latinBuf, latin: true, space: false })
      latinBuf = ""
    }
  }
  for (const ch of paragraph) {
    if (/\s/.test(ch)) {
      flushLatin()
      tokens.push({ text: ch, latin: false, space: true })
    } else if (CJK_REGEX.test(ch)) {
      flushLatin()
      tokens.push({ text: ch, latin: false, space: false })
    } else {
      latinBuf += ch
    }
  }
  flushLatin()
  return tokens
}

function startsWithProhibited(text: string): boolean {
  return !!text && LINE_START_PROHIBITED.includes(text[0])
}

function endsWithProhibited(text: string): boolean {
  return !!text && LINE_END_PROHIBITED.includes(text[text.length - 1])
}

function tokensText(tokens: Token[]): string {
  return tokens.map((t) => t.text).join("")
}

/**
 * token 需要下沉的上一行尾部 token 数：
 * 0 = 直接换行；>0 = 为避免禁则标点落行首，需连同上一行末尾若干 token 一起下沉。
 */
function kinsokuSink(line: Token[], token: Token): number {
  if (!startsWithProhibited(token.text)) return 0
  for (let sink = 1; sink <= line.length; sink++) {
    const first = line[line.length - sink]
    if (!startsWithProhibited(first.text)) return sink
  }
  return line.length
}

/** 单个 token 比整行还宽时的硬拆（拉丁词仅在此兜底，否则不拆） */
function hardSplit(
  token: Token,
  maxWidth: number,
  measure: (t: string) => number,
): Token[][] {
  const parts: Token[][] = []
  let buf = ""
  for (const ch of token.text) {
    if (buf && measure(buf + ch) > maxWidth) {
      parts.push([{ text: buf, latin: token.latin, space: false }])
      buf = ch
    } else {
      buf += ch
    }
  }
  if (buf) parts.push([{ text: buf, latin: token.latin, space: false }])
  return parts.length ? parts : [[token]]
}

export function wrapText(text: string, opts: WrapOptions): WrapResult {
  const { maxWidth, measureText } = opts
  const paragraphs = text.split("\n")
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    const tokens = tokenize(paragraph)
    let current: Token[] = []

    const flush = () => {
      const t = tokensText(current).trim()
      if (t) lines.push(t)
      current = []
    }

    for (const token of tokens) {
      if (token.space) {
        // 行首空白直接丢弃；行尾空白由 trim 处理
        if (current.length) current.push(token)
        continue
      }

      // 拉丁词本身超行宽 → 硬拆兜底（唯一允许拆词的场景）
      if (token.latin && measureText(token.text) > maxWidth) {
        flush()
        for (const part of hardSplit(token, maxWidth, measureText)) {
          if (
            current.length &&
            measureText(tokensText([...current, ...part]).trimEnd()) > maxWidth
          ) {
            flush()
          }
          current.push(...part)
        }
        continue
      }

      if (
        current.length &&
        measureText(tokensText([...current, token]).trimEnd()) > maxWidth
      ) {
        if (token.latin) {
          // 拉丁词整体换行；若行尾是禁则开引号/括号则一并下沉
          let sink = 0
          while (
            sink < current.length &&
            endsWithProhibited(current[current.length - 1 - sink].text)
          ) {
            sink++
          }
          const moved =
            sink > 0 ? current.splice(current.length - sink, sink) : []
          flush()
          current = moved
          current.push(token)
        } else {
          // CJK 逐字换行 + 行首禁则（标点随前字下沉）
          const sink = kinsokuSink(current, token)
          const moved =
            sink > 0 ? current.splice(current.length - sink, sink) : []
          flush()
          current = moved
          current.push(token)
        }
      } else {
        current.push(token)
      }
    }
    flush()
  }

  return { lines }
}

export interface FitTextOptions {
  text: string
  /** 1080 基准初始字号（px） */
  fontPx: number
  /** 块宽上限（px，1080 基准，不随字号变化） */
  maxWidthPx: number
  /** 块高上限（px，1080 基准）；与 maxLines 二选一 */
  maxHeightPx?: number
  lineHeight: number
  maxLines?: number
  /**
   * 超宽自动缩字号（R-8）：true 时行数上限 = 段落数（每个 \n 段一行），
   * 放不下优先缩字号而非自动换行；缩到下限仍放不下才回退换行 → 省略号。
   */
  autoFit?: boolean
  /** 给定字号下单行文本宽度（px） */
  measure: (text: string, fontPx: number) => number
  /** 缩字号下限（相对初始字号），默认 0.5 */
  minScale?: number
}

export interface FitTextResult {
  lines: string[]
  fontSize: number
  /** 最终字号 / 初始字号 */
  scale: number
  /** 内容被裁剪（减行） */
  truncated: boolean
  /** 末行追加了省略号 */
  ellipsis: boolean
}

const ELLIPSIS = "…"

/**
 * 自适应字号：先按宽度断行；行数超限则按 缩字号 → 减行 → 省略号 降级（R-8）。
 */
export function fitTextBlock(opts: FitTextOptions): FitTextResult {
  const { text, fontPx, maxWidthPx, lineHeight, measure } = opts
  const minScale = opts.minScale ?? 0.5

  const effMaxLines = (scale: number): number => {
    if (opts.maxLines !== undefined) return opts.maxLines
    if (opts.autoFit) return Math.max(1, text.split("\n").length)
    if (opts.maxHeightPx !== undefined) {
      return Math.max(
        1,
        Math.floor(opts.maxHeightPx / (fontPx * scale * lineHeight)),
      )
    }
    return Number.POSITIVE_INFINITY
  }

  // 阶段一：缩字号（1.0 → minScale，步长 0.05），字号变小 → 行内可容字符变多
  for (
    let scale = 1;
    scale >= minScale - 1e-9;
    scale = Math.round((scale - 0.05) * 100) / 100
  ) {
    const size = fontPx * scale
    const { lines } = wrapText(text, {
      maxWidth: maxWidthPx,
      measureText: (t) => measure(t, size),
    })
    if (lines.length <= effMaxLines(scale)) {
      return { lines, fontSize: size, scale, truncated: false, ellipsis: false }
    }
  }

  // 阶段二 + 三：减行 → 省略号（在最小字号下裁剪行数）
  const size = fontPx * minScale
  const { lines } = wrapText(text, {
    maxWidth: maxWidthPx,
    measureText: (t) => measure(t, size),
  })
  const maxLines = effMaxLines(minScale)
  if (lines.length <= maxLines) {
    return {
      lines,
      fontSize: size,
      scale: minScale,
      truncated: false,
      ellipsis: false,
    }
  }

  const kept = lines.slice(0, maxLines)
  const last = kept[kept.length - 1]
  // 末行塞入省略号，塞不下就去字符，再不行就只留省略号
  let trimmed = last
  while (trimmed && measure(trimmed + ELLIPSIS, size) > maxWidthPx) {
    trimmed = trimmed.slice(0, -1)
  }
  kept[kept.length - 1] = trimmed ? trimmed + ELLIPSIS : ELLIPSIS
  return {
    lines: kept,
    fontSize: size,
    scale: minScale,
    truncated: true,
    ellipsis: true,
  }
}
