"use client"

import { Switch } from "@/components/motion/switch"

interface SwitchFieldProps {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}

export function SwitchField({
  label,
  checked,
  onCheckedChange,
}: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        ariaLabel={label}
      />
    </div>
  )
}
