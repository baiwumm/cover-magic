"use client"

/**
 * 字体下拉（可搜索）：beUI Combobox，不手写下拉（R-18）。
 * 搜索框即触发器（beUI 原生形态）；列表项以各自字体预览。
 */

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/motion/combobox"
import { FONTS } from "@/lib/fonts"

interface FontSelectProps {
  value: string
  onChange: (family: string) => void
}

export function FontSelect({ value, onChange }: FontSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">字体</span>
      <Combobox value={value} onValueChange={onChange}>
        {/* Trigger 负责定位 ref（Content 依赖它测量），Input 内嵌其中提供搜索 */}
        <ComboboxTrigger className="h-8 rounded-full px-2.5">
          <ComboboxInput
            aria-label="字体"
            placeholder="搜索字体…"
            className="h-6 text-xs"
          />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxList className="text-xs">
            <ComboboxEmpty>没有匹配的字体</ComboboxEmpty>
            {FONTS.map((f) => (
              <ComboboxItem
                key={f.family}
                value={f.family}
                textValue={f.label}
                keywords={[f.family]}
              >
                <span style={{ fontFamily: `"${f.family}"` }}>{f.label}</span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
