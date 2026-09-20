"use client"

/**
 * 落地页模板画廊（4.4）：复用同一份模板数据与同一渲染器（R-1）。
 * 缩略图由运行时离屏 drawScene 生成，与编辑器所见一致。
 */

import { useEffect, useState } from "react"
import { type BestRatio, TEMPLATES, type Template } from "@/data/templates"
import { ensureThumbnails, getCachedThumbnail } from "@/lib/render/thumbnails"
import { cn } from "@/lib/utils"

const SHOWCASE: BestRatio[] = ["2.35:1", "16:9", "1:1", "3:4"]

function GalleryThumb({ template }: { template: Template }) {
  const [dataUrl, setDataUrl] = useState(
    () => getCachedThumbnail(template.id) ?? null,
  )
  useEffect(() => {
    if (dataUrl) return
    let cancelled = false
    void ensureThumbnails([{ id: template.id, scene: template.scene }]).then(
      () => {
        if (!cancelled) setDataUrl(getCachedThumbnail(template.id) ?? null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [template, dataUrl])

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-muted/40"
      style={{
        aspectRatio: `${template.scene.ratio.w} / ${template.scene.ratio.h}`,
      }}
    >
      {dataUrl ? (
        // biome-ignore lint/performance/noImgElement: R-14 原生 img
        <img
          src={dataUrl}
          alt={template.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="size-full animate-pulse bg-muted" />
      )}
    </div>
  )
}

export function TemplateGallery() {
  const groups = SHOWCASE.map((ratio) => ({
    ratio,
    items: TEMPLATES.filter((t) => t.bestRatio === ratio),
  })).filter((g) => g.items.length)

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          模板
        </span>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          精选模板，一键套用
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          以下缩略图均由编辑器同款渲染引擎实时生成，所见即所得。
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <div key={g.ratio} className="flex flex-col gap-3">
            {g.items.slice(0, 2).map((t, i) => (
              <figure
                key={t.id}
                className={cn(
                  "group flex flex-col gap-2",
                  i > 0 && "hidden sm:flex",
                )}
              >
                <GalleryThumb template={t} />
                <figcaption className="text-xs text-muted-foreground">
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
