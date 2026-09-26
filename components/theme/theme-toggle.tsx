"use client"

import { ThemeToggle as BeUIThemeToggle } from "@/components/motion/theme-toggle"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

/**
 * 深浅色切换：beUI ThemeToggle（View Transition API 整页重绘，circle 揭示）。
 * 不支持 VTA / reduced-motion 时自动降级为直接切换；next-themes 仍管 class。
 * beUI 内置 aria-label 为英文，纯中文界面要求下显式覆盖。
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <BeUIThemeToggle
      variant="circle"
      start="bottom-up"
      aria-label="切换深浅色"
      iconClassName="size-4"
      className={cn(
        "size-8 rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    />
  )
}
