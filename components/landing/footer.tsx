import { Github, Mail } from "lucide-react"
import { siteConfig } from "@/constants/site"

/**
 * 页脚（F-07 必留）：备案 + 社交 + 版权，全部读 constants/site.ts（6.5）。
 */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-10 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hover:text-foreground"
          >
            <Github className="size-4" />
          </a>
          <a
            href={`mailto:${siteConfig.author.email}`}
            aria-label="邮箱"
            className="hover:text-foreground"
          >
            <Mail className="size-4" />
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <a
            href={siteConfig.beian.icpUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {siteConfig.beian.icp}
          </a>
          <a
            href={siteConfig.beian.policeUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {siteConfig.beian.police}
          </a>
        </div>
        <p>
          © {year} {siteConfig.name} · 由 {siteConfig.author.name} 构建
        </p>
      </div>
    </footer>
  )
}
