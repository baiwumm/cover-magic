"use client"

/**
 * 滑块控件：beUI RangeSlider（竖条拇指 + 弹簧吸附）+ 数值显示 + 单位。
 * 仅用于一维标量（字号/透明度/模糊等），元素定位禁止使用 XY 滑块
 * （R-20，靠画布拖拽）。数值框走 NumberInput（draft + blur/Enter 提交，P1-11）。
 */

import { NumberInput } from "@/components/controls/number-input"
import { RangeSlider } from "@/components/motion/range-slider"

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
          <NumberInput
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onCommit={onChange}
            className="w-16"
            classNames={{ field: "h-7", input: "px-2 text-right text-xs" }}
          />
          {unit && (
            <span className="w-6 text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
      <RangeSlider
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onValueChange={onChange}
        showTicks={false}
        formatValueText={(v) => `${v}${unit ?? ""}`}
        className="h-8"
      />
    </div>
  )
}
