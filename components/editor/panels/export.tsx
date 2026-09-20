"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
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
 * 导出面板：目标尺寸 + 格式 + 质量（PNG 时质量禁用，5.3）。
 * 剪贴板 / 预估体积在 Phase 5 补齐。
 */
export function ExportPanel() {
  const scene = useSceneStore((s) => s.scene)
  const [format, setFormat] = useState<ExportFormat>("png")
  const [quality, setQuality] = useState(0.92)
  const [filename, setFilename] = useState("")
  const [busy, setBusy] = useState(false)

  const doExport = async () => {
    setBusy(true)
    try {
      const blob = await exportSceneToBlob(scene, format, quality)
      const name = filename.trim() || buildFileName(scene, format)
      downloadBlob(
        blob,
        name.endsWith(`.${format}`) ? name : `${name}.${format}`,
      )
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
    </div>
  )
}
