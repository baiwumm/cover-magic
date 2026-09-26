"use client"

import { cn } from "@/lib/utils"

/**
 * 多行文本域：beUI 无 Textarea 组件，按 Input 的胶囊场域语言同构
 * （同 border/focus 环），仅圆角放宽以容纳多行。
 */

interface TextareaFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}

export function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-xs text-foreground outline-none",
          "transition-colors duration-200 placeholder:text-muted-foreground/60",
          "focus:border-foreground/40 focus:ring-2 focus:ring-ring/40",
        )}
      />
    </div>
  )
}
