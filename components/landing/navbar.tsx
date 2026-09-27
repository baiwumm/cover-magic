"use client"

import { Github } from "lucide-react"
import { ButtonLink } from "@/components/motion/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { siteConfig } from "@/constants/site"

/**
 * 顶部导航（6.2）：固定 pill、backdrop-blur。
 * 左：Logo（明暗双图 CSS 切换）；右：GitHub 与主题切换两个图标按钮。
 */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex h-12 w-full max-w-3xl items-center justify-between gap-3 rounded-full border border-border/60 bg-background/70 pl-3 pr-1.5 shadow-lg backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2.5 text-sm font-bold tracking-tight"
        >
          {/* biome-ignore lint/performance/noImgElement: R-14 原生 img；装饰性 logo（alt=""）明暗双图靠 CSS 切换 */}
          <img
            src="/logo-light.svg"
            alt=""
            className="size-7 rounded-lg dark:hidden"
          />
          {/* biome-ignore lint/performance/noImgElement: R-14 原生 img；装饰性 logo（alt=""）明暗双图靠 CSS 切换 */}
          <img
            src="/logo-dark.svg"
            alt=""
            className="hidden size-7 rounded-lg dark:block"
          />
          {siteConfig.name}
        </a>
        <div className="flex items-center gap-0.5">
          <ButtonLink
            href={siteConfig.links.repository}
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="icon"
            aria-label="GitHub 仓库"
          >
            <Github className="size-[18px]" />
          </ButtonLink>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
