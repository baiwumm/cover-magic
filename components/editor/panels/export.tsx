"use client"

import { ClipboardCopy, Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SelectField } from "@/components/controls/select-field"
import { SliderField } from "@/components/controls/slider-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemTitle } from "@/components/ui/item"
import {
  buildFileName,
  downloadBlob,
  type ExportFormat,
  exportSceneToBlob,
} from "@/lib/render/export"
import { useSceneStore } from "@/stores/scene-store"

/**
 * 导出面板（5.1-5.4）：目标尺寸 + 格式 + 质量（PNG 时禁用）
 * + 预估体积 + 复制到剪贴板（仅 PNG，失败降级提示）。
 */
export function ExportPanel() {
  const scene = useSceneStore((s) => s.scene)
  const [format, setFormat] = useState<ExportFormat>("png")
  const [quality, setQuality] = useState(0.92)
  const [filename, setFilename] = useState("")
  const [busy, setBusy] = useState(false)
  const [estimate, setEstimate] = useState<string | null>(null)

  const fmtBytes = (n: number) =>
    n >= 1024 * 1024
      ? `${(n / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(n / 1024)} KB`

  const doExport = async () => {
    setBusy(true)
    try {
      const blob = await exportSceneToBlob(scene, format, quality)
      const name = filename.trim() || buildFileName(scene, format)
      downloadBlob(
        blob,
        name.endsWith(`.${format}`) ? name : `${name}.${format}`,
      )
      setEstimate(fmtBytes(blob.size))
    } finally {
      setBusy(false)
    }
  }

  const estimateSize = async () => {
    setBusy(true)
    try {
      const blob = await exportSceneToBlob(scene, format, quality)
      setEstimate(fmtBytes(blob.size))
    } finally {
      setBusy(false)
    }
  }

  const copyToClipboard = async () => {
    setBusy(true)
    try {
      const blob = await exportSceneToBlob(scene, "png")
      // 5.2：ClipboardItem 仅支持 PNG；失败时降级提示
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      toast.success("已复制到剪贴板", {
        description: "可直接粘贴到公众号后台等编辑器。",
      })
    } catch {
      toast.error("复制失败", {
        description:
          "当前浏览器或环境不支持剪贴板图片，请使用「导出图片」下载后上传。",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Item variant="muted" size="sm">
        <ItemContent>
          <ItemTitle className="text-xs">
            目标尺寸：{scene.exportSize.width} × {scene.exportSize.height} px
            {estimate ? ` · 预估体积：${estimate}` : ""}
          </ItemTitle>
        </ItemContent>
      </Item>

      <SelectField
        label="格式"
        value={format}
        options={[
          { value: "png", label: "PNG（无损）" },
          { value: "jpeg", label: "JPEG" },
          { value: "webp", label: "WebP" },
        ]}
        onChange={(v) => setFormat(v as ExportFormat)}
      />
      <SliderField
        label="质量"
        value={quality}
        min={0.1}
        max={1}
        step={0.01}
        disabled={format === "png"}
        onChange={setQuality}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">
          文件名（留空自动生成）
        </span>
        <Input
          value={filename}
          placeholder={buildFileName(scene, format)}
          onChange={(e) => setFilename(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => void doExport()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          导出图片
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => void copyToClipboard()}
          disabled={busy || format !== "png"}
          title={format !== "png" ? "剪贴板仅支持 PNG，请切换格式" : undefined}
        >
          <ClipboardCopy className="size-3.5" />
          复制到剪贴板
        </Button>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={() => void estimateSize()}
        disabled={busy}
      >
        刷新预估体积
      </Button>
    </div>
  )
}
