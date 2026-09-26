"use client"

/**
 * 下拉选择（beUI Select）：面板从触发器中弹性展开、条目错峰入场。
 * 选项均为平铺列表（当前无分组调用方），分组下拉请用 Combobox（见 font-select）。
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label?: string
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
}: SelectFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 py-0 text-xs" aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="text-xs">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
