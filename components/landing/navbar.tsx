"use client"

import { Moon, Sun, Zap } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/constants/site"

/**
 * 顶部导航（6.2）：固定 pill、backdrop-blur、Logo + 深浅色 + 开始设计。
 */
export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex h-12 w-full max-w-3xl items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 shadow-lg backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
            <Zap className="size-3.5" />
          </span>
          {siteConfig.name}
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="切换深浅色"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {/* 两个图标都渲染，靠 dark: 变体切换：按 resolvedTheme 分支会在
                SSR（无主题）与客户端（已解析）之间产生 hydration 不匹配 */}
            <Sun className="size-4 hidden dark:block" />
            <Moon className="size-4 dark:hidden" />
          </Button>
          <Button asChild size="sm" className="h-8 rounded-full">
            {/* prefetch={false}：静态导出下 RSC 预取请求必然 404（产物路径与预取 URL 不一致） */}
            <Link href="/editor" prefetch={false}>
              开始设计
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
