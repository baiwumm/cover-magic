"use client"

/**
 * 取色器（D-04）：react-colorful 本体 + shadcn Popover 浮层 + 40 色板 + hex 输入。
 * 官方注册表无取色器，引专门库 —— 不属于自绘取色器（R-18）。
 */

import { useEffect, useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const PALETTE = [
  // 中性 10
  "#000000",
  "#404040",
  "#737373",
  "#a3a3a3",
  "#d4d4d4",
  "#e5e5e5",
  "#f5f5f5",
  "#ffffff",
  "#fafafa",
  "#171717",
  // 石板 / 蓝
  "#0f172a",
  "#1e293b",
  "#334155",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
  "#e2e8f0",
  "#38bdf8",
  "#0ea5e9",
  "#1d4ed8",
  // 青 / 绿
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#84cc16",
  "#65a30d",
  "#10b981",
  "#059669",
  "#065f46",
  // 黄 / 橙 / 红 / 紫
  "#facc15",
  "#eab308",
  "#f97316",
  "#ea580c",
  "#ef4444",
  "#dc2626",
  "#991b1b",
  "#ec4899",
  "#a855f7",
  "#6d28d9",
]

interface ColorFieldProps {
  label: string
  value: string
  onChange: (hex: string) => void
  id?: string
}

export function ColorField({ label, value, onChange, id }: ColorFieldProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commitHex = (raw: string) => {
    const hex = raw.startsWith("#") ? raw : `#${raw}`
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex)
    else setDraft(value)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span id={id} className="text-xs text-muted-foreground">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-8 w-36 items-center gap-2 rounded-md border border-input bg-background px-2 text-xs",
            "hover:bg-accent",
          )}
        >
          <span
            className="size-4 shrink-0 rounded-sm border border-border"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono uppercase">{value}</span>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="mt-3 grid grid-cols-10 gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`选用颜色 ${c}`}
                className={cn(
                  "size-4 rounded-sm border transition-transform hover:scale-110",
                  value.toLowerCase() === c.toLowerCase()
                    ? "border-foreground"
                    : "border-border",
                )}
                style={{ backgroundColor: c }}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitHex(draft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitHex(draft)
              }}
              className="h-7 font-mono text-xs uppercase"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
