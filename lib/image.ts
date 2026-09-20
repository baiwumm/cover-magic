/**
 * 上传图片降采样（R-16 / 5.6）：长边 ≤1920 → WebP q0.82 → dataURL。
 * 避免大图撑爆 localStorage（上限 5MB 场景）。
 */

import { toast } from "sonner"

const MAX_SIDE = 1920
const WEBP_QUALITY = 0.82
/** dataURL 超过该字节数提示（≈800KB） */
const WARN_BYTES = 800 * 1024

export async function fileToDownsampledDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    let blob: Blob
    if (typeof OffscreenCanvas !== "undefined") {
      const oc = new OffscreenCanvas(w, h)
      oc.getContext("2d")?.drawImage(bitmap, 0, 0, w, h)
      blob = await oc.convertToBlob({
        type: "image/webp",
        quality: WEBP_QUALITY,
      })
    } else {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h)
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
      ).then((b) => {
        if (!b) throw new Error("图片转换失败")
        return b
      })
    }

    const dataUrl = await blobToDataUrl(blob)
    if (dataUrl.length > WARN_BYTES) {
      toast("图片较大", {
        description: "已压缩至 1920px 内，但体积仍超 800KB，可能影响本地保存。",
      })
    }
    return dataUrl
  } finally {
    bitmap.close()
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
