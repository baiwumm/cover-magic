"use client"

import { ArrowRight, Github, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/constants/site"
import { TextGenerateEffect } from "./text-generate-effect"

/**
 * Hero（6.3 / D-15）：徽章 → 主标题 → 副文案 → 双按钮 → 产品截图。
 * ogl 光束背景已上移到 app/page.tsx 作为整页固定层。
 */
export function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pt-36 pb-16 text-center">
        <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="size-3.5" />
          免费开源 · 纯浏览器内渲染 · 无需注册
        </span>

        {/* 两行分排：Maple Mono CN 比系统字体宽，md:text-7xl 下连排会在「封/面」处断行 */}
        <h1 className="flex flex-col gap-1 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          <TextGenerateEffect words="为每一篇文章" />
          <TextGenerateEffect
            words="配一张好封面"
            charClassName="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400 bg-clip-text text-transparent"
          />
        </h1>

        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          Cover Magic 是一款中文友好的封面图设计工具：拖拽定位、中文断行、
          平台尺寸预设、实时预览与高清导出，全流程在浏览器完成。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href="/editor" prefetch={false}>
              开始设计
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-6"
          >
            <a
              href={siteConfig.links.repository}
              target="_blank"
              rel="noreferrer"
            >
              <Github className="size-4" />
              GitHub
            </a>
          </Button>
        </div>

        <div className="mt-8 w-full overflow-hidden rounded-xl border border-dashed border-border shadow-2xl">
          {/* biome-ignore lint/performance/noImgElement: R-14 原生 img + 预压缩静态资源 */}
          <img
            src="/showcase.webp"
            alt="Cover Magic 制作封面示例"
            width={1800}
            height={766}
            className="w-full"
            loading="eager"
          />
        </div>
      </div>
    </section>
  )
}
