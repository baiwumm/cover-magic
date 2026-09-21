"use client"

import { Zap } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/constants/site"

/**
 * 顶部导航（6.2）：固定 pill、backdrop-blur、Logo + 深浅色 + 开始设计。
 */
export function Navbar() {
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
          <ThemeToggle />
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
