"use client"

import { Zap } from "lucide-react"
import { LinkButton } from "@/components/landing/link-button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { siteConfig } from "@/constants/site"

/**
 * 顶部导航（6.2）：固定 pill、backdrop-blur、Logo + 深浅色 + 开始设计。
 */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex h-12 w-full max-w-3xl items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 shadow-lg backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
            <Zap className="size-3.5" />
          </span>
          {siteConfig.name}
        </a>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <LinkButton
            href="/editor"
            size="sm"
            className="h-8 whitespace-nowrap rounded-full"
          >
            开始设计
          </LinkButton>
        </div>
      </nav>
    </header>
  )
}
