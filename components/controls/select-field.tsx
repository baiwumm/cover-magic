"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  group?: string
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
  const groups: Array<[string, SelectOption[]]> = []
  for (const opt of options) {
    const g = opt.group ?? ""
    const found = groups.find(([name]) => name === g)
    if (found) found[1].push(opt)
    else groups.push([g, [opt]])
  }

  const content = (
    <SelectContent>
      {groups.map(([g, opts]) =>
        g ? (
          <SelectGroup key={g}>
            <SelectLabel>{g}</SelectLabel>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : (
          opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))
        ),
      )}
    </SelectContent>
  )

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-full text-xs" aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {content}
      </Select>
    </div>
  )
}
