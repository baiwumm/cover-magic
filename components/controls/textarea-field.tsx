"use client"

import { Textarea } from "@/components/ui/textarea"

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
      <Textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-0 text-xs"
      />
    </div>
  )
}
