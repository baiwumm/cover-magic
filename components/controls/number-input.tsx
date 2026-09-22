"use client"

/**
 * 数字输入：本地 draft + blur/Enter 提交，避免逐键 clamp 把清空变成 min（P1-11）。
 */

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

interface NumberInputProps {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  "aria-label"?: string
  onCommit: (v: number) => void
}

export function NumberInput({
  value,
  min,
  max,
  step,
  disabled,
  className,
  "aria-label": ariaLabel,
  onCommit,
}: NumberInputProps) {
  const [draft, setDraft] = useState(() => String(value))
  const [editing, setEditing] = useState(false)

  // 非编辑态（滑块/预设改值）同步回显
  useEffect(() => {
    if (!editing) setDraft(String(value))
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const n = Number(draft)
    if (!Number.isFinite(n)) {
      setDraft(String(value))
      return
    }
    let next = n
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }

  return (
    <Input
      type="number"
      aria-label={ariaLabel}
      value={draft}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={className}
      onFocus={() => setEditing(true)}
      onChange={(e) => {
        setEditing(true)
        setDraft(e.target.value)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          commit()
        }
      }}
    />
  )
}
