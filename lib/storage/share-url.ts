/**
 * 分享链接（R-13 / 5.8）：Scene 序列化进 URL hash（#s=...），零后端。
 * 使用 deflate-raw + base64url 压缩；不支持 CompressionStream 时退化为纯 base64。
 * 序列化层封装在 lib/，UI 不感知实现（R-13 适配层要求）。
 */

import type { Scene } from "@/lib/scene"
import { isLegalScene } from "@/lib/storage/autosave"

const PREFIX = "s="

/** 完整分享 URL 超过该长度时警告（多数场景/IM 截断阈值约 8k） */
export const SHARE_URL_WARN_LENGTH = 8000

function toBase64Url(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/")
  const bin = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function deflate(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null
  const cs = new CompressionStream("deflate-raw")
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(cs)
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

async function inflate(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null
  const ds = new DecompressionStream("deflate-raw")
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds)
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

/**
 * 序列化 Scene 进 hash。含 dataURL 的场景可能超 URL 上限，
 * 调用方用 `SHARE_URL_WARN_LENGTH` 检查完整 URL 长度并提示用户（P1-23）。
 */
export async function encodeSceneToHash(scene: Scene): Promise<string> {
  const json = JSON.stringify(scene)
  const raw = new TextEncoder().encode(json)
  const compressed = await deflate(raw)
  const body = compressed
    ? `d${toBase64Url(compressed)}`
    : `r${toBase64Url(raw)}`
  return `${PREFIX}${body}`
}

/** 解析 URL hash 中的 Scene；非法返回 null */
export async function decodeSceneFromHash(hash: string): Promise<Scene | null> {
  try {
    const h = hash.startsWith("#") ? hash.slice(1) : hash
    if (!h.startsWith(PREFIX)) return null
    const body = h.slice(PREFIX.length)
    const bytes = fromBase64Url(body.slice(1))
    let json: string
    if (body[0] === "d") {
      const inflated = await inflate(bytes)
      if (!inflated) return null
      json = new TextDecoder().decode(inflated)
    } else if (body[0] === "r") {
      json = new TextDecoder().decode(bytes)
    } else {
      return null
    }
    const scene = JSON.parse(json) as unknown
    if (!isLegalScene(scene)) return null
    return scene
  } catch {
    return null
  }
}
