"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  ThemeAnimationType,
  useThemeAnimation,
} from "theme-switch-animation/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

/**
 * 深浅色切换：theme-switch-animation 受控模式 × next-themes。
 * 受控（isDark + onChange）下库不碰 localStorage，class 仍由 next-themes 改写，
 * 库只负责在 View Transition 的转场回调里驱动动画；不支持 VTA / reduced-motion 时自动降级直切。
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { ref, toggleTheme } = useThemeAnimation<HTMLButtonElement>({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
    isDark: resolvedTheme === "dark",
    onChange: (next) => setTheme(next ? "dark" : "light"),
  })

  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="切换深浅色"
      // 挂载前不挂 ref：next-themes 的 resolvedTheme 服务端为 undefined
      ref={mounted ? ref : undefined}
      className={cn("size-8", className)}
      onClick={toggleTheme}
    >
      {/* 两个图标都渲染、用 dark: 变体切换，避免按 resolvedTheme 分支产生 hydration 不匹配 */}
      <Sun className="size-4 hidden dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  )
}
