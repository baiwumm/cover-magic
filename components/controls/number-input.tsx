"use client"

/**
 * 数字输入：本地 draft + blur/Enter 提交，避免逐键 clamp 把清空变成 min（P1-11）。
 * 底座为 beUI Input（胶囊场域），尺寸由 classNames 压缩到编辑器密度。
 */

import { useEffect, useState } from "react"
import type { InputClassNames } from "@/components/motion/input"
import { Input } from "@/components/motion/input"

interface NumberInputProps {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  classNames?: InputClassNames
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
  classNames,
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
      classNames={classNames}
      onFocus={() => setEditing(true)}
      onChange={(next) => {
        setEditing(true)
        setDraft(next)
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
