"use client"

/**
 * 字体下拉（可搜索）：shadcn combobox = Popover + Command，不手写下拉（R-18）。
 */

import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FONTS } from "@/lib/fonts"
import { cn } from "@/lib/utils"

interface FontSelectProps {
  value: string
  onChange: (family: string) => void
}

export function FontSelect({ value, onChange }: FontSelectProps) {
  const [open, setOpen] = useState(false)
  const current = FONTS.find((f) => f.family === value)

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">字体</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-full justify-between px-2 text-xs font-normal"
          >
            <span style={{ fontFamily: `"${value}"` }}>
              {current?.label ?? value}
            </span>
            <ChevronsUpDown className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="end">
          <Command>
            <CommandInput placeholder="搜索字体…" className="h-8" />
            <CommandList>
              <CommandEmpty>没有匹配的字体</CommandEmpty>
              <CommandGroup>
                {FONTS.map((f) => (
                  <CommandItem
                    key={f.family}
                    value={f.label}
                    onSelect={() => {
                      onChange(f.family)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-1 size-3.5",
                        value === f.family ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span style={{ fontFamily: `"${f.family}"` }}>
                      {f.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
