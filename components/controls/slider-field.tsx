"use client"

/**
 * 滑块控件：shadcn Slider + 数值显示 + 单位。仅用于一维标量（字号/透明度/模糊等），
 * 元素定位禁止使用 XY 滑块（R-20，靠画布拖拽）。
 */

import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  disabled?: boolean
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled,
}: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
            }}
            className="h-7 w-16 px-1.5 text-right text-xs"
          />
          {unit && (
            <span className="w-6 text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
    </div>
  )
}
