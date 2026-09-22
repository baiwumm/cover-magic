"use client"

/**
 * 模板抽屉（4.3）：按 bestRatio 分组 + 缩略图网格，点击整体套用（R-11）。
 */

import { LayoutGrid } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { type BestRatio, TEMPLATES, type Template } from "@/data/templates"
import { ensureThumbnails, getCachedThumbnail } from "@/lib/render/thumbnails"
import { cn } from "@/lib/utils"
import { useSceneStore } from "@/stores/scene-store"

const RATIO_LABELS: Record<BestRatio, string> = {
  "2.35:1": "2.35:1 · 公众号头条",
  "16:9": "16:9 · 通用横图",
  "3:4": "3:4 · 小红书",
  "1:1": "1:1 · 方图",
}

const RATIO_ORDER: BestRatio[] = ["2.35:1", "16:9", "3:4", "1:1"]

function TemplateThumb({ template }: { template: Template }) {
  const [dataUrl, setDataUrl] = useState(
    () => getCachedThumbnail(template.id) ?? null,
  )
  useEffect(() => {
    if (dataUrl) return
    let cancelled = false
    void ensureThumbnails([{ id: template.id, scene: template.scene }])
      .then(() => {
        if (!cancelled) setDataUrl(getCachedThumbnail(template.id) ?? null)
      })
      .catch(() => {
        // 失败保持 Skeleton，不抛到 React
      })
    return () => {
      cancelled = true
    }
  }, [template, dataUrl])

  if (!dataUrl) {
    return (
      <Skeleton
        className="w-full rounded-md"
        style={{
          aspectRatio: `${template.scene.ratio.w} / ${template.scene.ratio.h}`,
        }}
      />
    )
  }
  return (
    // biome-ignore lint/performance/noImgElement: R-14 纯静态导出无图片优化器，一律原生 img
    <img
      src={dataUrl}
      alt={template.name}
      loading="lazy"
      className="w-full rounded-md ring-1 ring-border"
    />
  )
}

export function TemplateDrawer() {
  const replaceScene = useSceneStore((s) => s.replaceScene)
  const currentId = useSceneStore((s) => s.scene.templateId)
  const [open, setOpen] = useState(false)

  const apply = (t: Template) => {
    // R-11：整体替换，不做增量合并
    replaceScene(structuredClone(t.scene))
    setOpen(false)
    toast(`已套用模板「${t.name}」`, {
      description: "所有参数已替换为模板内容。",
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 px-3 text-xs">
          <LayoutGrid className="size-3.5" />
          模板
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle className="text-base">模板</SheetTitle>
          <SheetDescription className="text-xs">
            点击套用将整体替换当前设计（含全部参数）。
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="flex flex-col gap-5 px-4 pb-6">
            {RATIO_ORDER.map((ratio) => {
              const group = TEMPLATES.filter((t) => t.bestRatio === ratio)
              if (!group.length) return null
              return (
                <section key={ratio} className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-muted-foreground">
                    {RATIO_LABELS[ratio]}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => apply(t)}
                        className={cn(
                          "group flex flex-col gap-1.5 rounded-lg p-1.5 text-left transition-colors hover:bg-accent",
                          currentId === t.id && "bg-accent ring-1 ring-ring",
                        )}
                      >
                        <TemplateThumb template={t} />
                        <span className="text-xs font-medium">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
