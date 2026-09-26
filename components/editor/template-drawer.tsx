"use client"

/**
 * 模板抽屉（4.3）：按 bestRatio 分组 + 缩略图网格，点击整体套用（R-11）。
 * 底座为 beUI Drawer（右侧弹簧滑入）；缩略图占位用 beUI Loader。
 */

import { LayoutGrid, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/motion/button"
import { Drawer } from "@/components/motion/drawer"
import { Loader } from "@/components/motion/loader"
import { toast } from "@/components/toast/toast"
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
        // 失败保持占位 Loader，不抛到 React
      })
    return () => {
      cancelled = true
    }
  }, [template, dataUrl])

  if (!dataUrl) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-xl bg-muted/60"
        style={{
          aspectRatio: `${template.scene.ratio.w} / ${template.scene.ratio.h}`,
        }}
      >
        <Loader
          size={18}
          label="生成缩略图"
          className="text-muted-foreground"
        />
      </div>
    )
  }
  return (
    // biome-ignore lint/performance/noImgElement: R-14 纯静态导出无图片优化器，一律原生 img
    <img
      src={dataUrl}
      alt={template.name}
      loading="lazy"
      className="w-full rounded-xl ring-1 ring-border"
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
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 shrink-0 gap-1 whitespace-nowrap rounded-full px-3 text-xs"
        onClick={() => setOpen(true)}
      >
        <LayoutGrid className="size-3.5" />
        模板
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        side="right"
        ariaLabel="模板"
        className="w-[420px] max-w-[85vw]"
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">模板</h2>
            <p className="text-xs text-muted-foreground">
              点击套用将整体替换当前设计（含全部参数）。
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭模板抽屉"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-5">
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
                          "group flex flex-col gap-1.5 rounded-xl p-1.5 text-left transition-colors hover:bg-accent",
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
        </div>
      </Drawer>
    </>
  )
}
