"use client"

/**
 * 拖拽上传（D-05）：react-dropzone 处理拖拽事件（R-18 不手写 DnD 逻辑），
 * 外观按 beUI 面板语言呈现（虚线胶囊 + 圆形图标位）。
 */

import { ImagePlus, Loader2 } from "lucide-react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "@/components/toast/toast"
import { fileToDownsampledDataUrl } from "@/lib/image"
import { cn } from "@/lib/utils"

interface AssetDropzoneProps {
  label?: string
  /** 读取完成回调：dataURL（不含前缀处理，直接可用于 Scene） */
  onDataUrl: (dataUrl: string) => void
  /** 降采样到长边 1920 + WebP q0.82（R-16，位图类上传应开启；SVG 不适用） */
  downsample?: boolean
  className?: string
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** SVG 不经降采样、原样进 Scene，必须单独限体积（P2） */
const MAX_SVG_BYTES = 256 * 1024

export function AssetDropzone({
  label = "拖拽图片到此处，或点击选择",
  onDataUrl,
  downsample = false,
  className,
}: AssetDropzoneProps) {
  const [busy, setBusy] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      const isSvg = file.type === "image/svg+xml"
      if (isSvg && file.size > MAX_SVG_BYTES) {
        toast.error("SVG 文件过大", {
          description: "请控制在 256KB 以内，过大 SVG 可能撑爆本地存储。",
        })
        return
      }
      setBusy(true)
      try {
        onDataUrl(
          downsample && !isSvg
            ? await fileToDownsampledDataUrl(file)
            : await fileToDataUrl(file),
        )
      } catch {
        toast.error("图片读取失败", {
          description: "文件可能已损坏或格式不受支持。",
        })
      } finally {
        setBusy(false)
      }
    },
    [onDataUrl, downsample],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // accept 与文案一致：PNG / JPG / WebP / SVG（不收 GIF，P2）
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".svg"] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps({
        className: cn("cursor-pointer outline-none", className),
      })}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 transition-colors",
          "border-(--color-border-strong) bg-muted/40 hover:bg-muted/70",
          isDragActive && "border-foreground/50 bg-accent",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">
            {isDragActive ? "松开即可上传" : label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            支持 PNG / JPG / WebP / SVG
          </span>
        </span>
      </div>
    </div>
  )
}
