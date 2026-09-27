import { Mail } from "lucide-react"
import { GithubMark } from "@/components/landing/github-mark"
import { siteConfig } from "@/constants/site"

/**
 * 页脚（F-07 必留：备案）：参考三栏版式 —— 品牌简介 / 资源 / 关于，
 * 底行虚线分隔，左侧版权、右侧备案。全部读 constants/site.ts（6.5）。
 */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative py-14">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
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
              <span className="text-sm font-semibold">{siteConfig.name}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              中文友好的封面图设计工具：拖拽定位、平台尺寸预设、实时预览与高清导出，全流程在浏览器完成。
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">资源</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={siteConfig.links.repository}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <GithubMark className="size-3.5" />
                  GitHub 仓库
                </a>
              </li>
              <li>
                <a
                  href={`${siteConfig.links.repository}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Issues / 反馈
                </a>
              </li>
              <li>
                <a
                  href="/editor"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  开始设计
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">关于</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={siteConfig.author.blog}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {siteConfig.author.blog.replace("https://", "")}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.author.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="size-3.5" />
                  {siteConfig.author.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-dashed border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {year} {siteConfig.name} · 由 {siteConfig.author.name} 构建
          </span>
          <span className="flex items-center gap-4">
            <a
              href={siteConfig.beian.icpUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {siteConfig.beian.icp}
            </a>
            <a
              href={siteConfig.beian.policeUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {siteConfig.beian.police}
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
