"use client"

/**
 * 文本样式公共编辑器：主标题 / 副标题 / 水印共用。
 * 位置不提供 XY 滑块（R-20），Phase 3 由画布拖拽交付。
 */

import { ColorField } from "@/components/controls/color-field"
import { FontSelect } from "@/components/controls/font-select"
import { SelectField } from "@/components/controls/select-field"
import { SliderField } from "@/components/controls/slider-field"
import { SwitchField } from "@/components/controls/switch-field"
import { TextareaField } from "@/components/controls/textarea-field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { TextStyle } from "@/lib/scene"

export type TextSlot = "title" | "subtitle" | "watermark"

interface TextStyleEditorProps {
  slot: TextSlot
  style: TextStyle & { text: string; autoFit: boolean; maxWidthPct: number }
  onPatch: (
    patch: Partial<
      TextStyle & { text: string; autoFit: boolean; maxWidthPct: number }
    >,
  ) => void
  disableAutoFit?: boolean
}

export function TextStyleEditor({
  style,
  onPatch,
  disableAutoFit,
}: TextStyleEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <TextareaField
        label="文本（支持换行）"
        value={style.text}
        rows={3}
        onChange={(text) => onPatch({ text })}
      />
      {!disableAutoFit && (
        <SwitchField
          label="超宽自动缩字号"
          checked={style.autoFit}
          onCheckedChange={(autoFit) => onPatch({ autoFit })}
        />
      )}
      <SliderField
        label="块宽占画布"
        value={style.maxWidthPct}
        min={10}
        max={100}
        unit="%"
        onChange={(maxWidthPct) => onPatch({ maxWidthPct })}
      />
      <FontSelect
        value={style.fontFamily}
        onChange={(fontFamily) => onPatch({ fontFamily })}
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="字重"
          value={String(style.fontWeight)}
          options={[
            { value: "400", label: "常规 400" },
            { value: "700", label: "加粗 700" },
          ]}
          onChange={(v) => onPatch({ fontWeight: Number(v) as 400 | 700 })}
        />
        <div className="flex flex-col justify-end gap-1.5">
          <span className="text-xs text-muted-foreground">对齐</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={style.align}
            onValueChange={(v) =>
              v && onPatch({ align: v as TextStyle["align"] })
            }
          >
            <ToggleGroupItem value="left" aria-label="左对齐">
              左
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="居中">
              中
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="右对齐">
              右
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <SliderField
        label="字号"
        value={style.size}
        min={12}
        max={400}
        unit="px"
        onChange={(size) => onPatch({ size })}
      />
      <ColorField
        label="颜色"
        value={style.color}
        onChange={(color) => onPatch({ color })}
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <SliderField
          label="字间距"
          value={style.letterSpacing}
          min={-20}
          max={40}
          unit="px"
          onChange={(letterSpacing) => onPatch({ letterSpacing })}
        />
        <SliderField
          label="行高"
          value={style.lineHeight}
          min={1}
          max={2.5}
          step={0.05}
          onChange={(lineHeight) => onPatch({ lineHeight })}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <SwitchField
          label="斜体"
          checked={style.italic}
          onCheckedChange={(italic) => onPatch({ italic })}
        />
        <SwitchField
          label="全大写"
          checked={style.uppercase}
          onCheckedChange={(uppercase) => onPatch({ uppercase })}
        />
      </div>
      <SliderField
        label="立体字"
        value={style.shadow}
        min={0}
        max={10}
        onChange={(shadow) => onPatch({ shadow })}
      />
    </div>
  )
}
