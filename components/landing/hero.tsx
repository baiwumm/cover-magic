"use client"

import { ArrowRight, Github, Sparkles } from "lucide-react"
import Link from "next/link"
import { LightRays } from "@/components/background/light-ray"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/constants/site"
import { TextGenerateEffect } from "./text-generate-effect"

/**
 * Hero（6.3 / D-15）：徽章 → 主标题 → 副文案 → 双按钮 → 产品截图。
 * 背景为 ogl 光束（6.1）。
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 h-[560px] opacity-60 dark:opacity-40">
        <LightRays
          raysOrigin="top-center"
          raysColor="#8ab4ff"
          raysSpeed={0.8}
          lightSpread={0.9}
          rayLength={2.4}
          followMouse
          mouseInfluence={0.08}
          noiseAmount={0.05}
        />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pt-36 pb-16 text-center">
        <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="size-3.5" />
          免费开源 · 纯浏览器内渲染 · 无需注册
        </span>

        <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          <TextGenerateEffect words="为每一篇文章" />{" "}
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
