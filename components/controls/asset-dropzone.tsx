"use client"

/**
 * 拖拽上传（D-05）：react-dropzone 处理拖拽事件 + shadcn Item 呈现，
 * 不手写 dragenter/dragleave 逻辑（R-18）。
 */

import { ImagePlus, Loader2 } from "lucide-react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
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
      setBusy(true)
      try {
        const isSvg = file.type === "image/svg+xml"
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
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps({
        className: cn("cursor-pointer outline-none", className),
      })}
    >
      <input {...getInputProps()} />
      <Item
        variant={isDragActive ? "outline" : "muted"}
        size="sm"
        className={cn(
          "transition-colors",
          isDragActive && "border-foreground/40 bg-accent",
        )}
      >
        <ItemMedia variant="icon">
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-xs">
            {isDragActive ? "松开即可上传" : label}
          </ItemTitle>
          <ItemDescription className="text-[11px]">
            支持 PNG / JPG / WebP / SVG
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}
