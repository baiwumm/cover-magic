"use client"

/**
 * 图标面板：Iconify 搜索（5.7，300ms 防抖 + AbortController + 缓存）
 * + 精选集合优先展示（D-27）+ 上传图片（降采样走 lib/image）。
 */

import { useEffect, useRef, useState } from "react"
import { AssetDropzone } from "@/components/controls/asset-dropzone"
import { ColorField } from "@/components/controls/color-field"
import { SliderField } from "@/components/controls/slider-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CURATED_ICONS, searchIcons } from "@/lib/iconify"
import { preloadImage } from "@/lib/render/icons"
import { useSceneStore } from "@/stores/scene-store"

const SEARCH_DEBOUNCE_MS = 300

export function LogoPanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<string[]>(CURATED_ICONS)
  const [searching, setSearching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 300ms 防抖搜索；空查询回退精选集合
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults(CURATED_ICONS)
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      searchIcons(q, { signal: controller.signal })
        .then((icons) => {
          if (!controller.signal.aborted) setResults(icons)
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const applyIcon = async (code: string) => {
    setScene((draft) => {
      draft.logo = {
        source: { kind: "iconify", code },
        size: 200,
        x: 50,
        y: 22,
      }
    })
    await preloadImage({ kind: "iconify", code })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">
          搜索图标（Iconify 全库）
        </span>
        <Input
          value={query}
          placeholder="例如 rocket、图书、fire…"
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-xs"
        />
        {searching && (
          <span className="text-[11px] text-muted-foreground">搜索中…</span>
        )}
      </div>

      <ScrollArea className="h-56 rounded-md border border-border p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {results.map((code) => (
            <button
              key={code}
              type="button"
              title={code}
              onClick={() => void applyIcon(code)}
              className="flex aspect-square items-center justify-center rounded-md p-1 hover:bg-accent"
            >
              {/* biome-ignore lint/performance/noImgElement: 仅 UI 预览；canvas 绘制走 dataURL 缓存（R-5） */}
              <img
                src={`https://api.iconify.design/${code}.svg`}
                alt={code}
                loading="lazy"
                className="size-5"
              />
            </button>
          ))}
        </div>
        {!results.length && !searching && (
          <p className="p-3 text-center text-[11px] text-muted-foreground">
            没有找到匹配的图标
          </p>
        )}
      </ScrollArea>
      <p className="text-[11px] text-muted-foreground">
        默认展示精选集合，输入关键词搜索全库。
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">或上传图片</span>
        <AssetDropzone
          label="拖拽图片，或点击选择"
          downsample
          onDataUrl={(dataUrl) =>
            setScene((draft) => {
              draft.logo = {
                source: { kind: "upload", dataUrl },
                size: 200,
                x: 50,
                y: 22,
              }
            })
          }
        />
      </div>

      {scene.logo && (
        <>
          <SliderField
            label="图标尺寸"
            value={scene.logo.size}
            min={40}
            max={600}
            unit="px"
            onChange={(size) =>
              setScene((draft) => {
                if (draft.logo) draft.logo.size = size
              })
            }
          />
          <SliderField
            label="投影"
            value={scene.logo.shadow?.size ?? 0}
            min={0}
            max={30}
            onChange={(size) =>
              setScene((draft) => {
                if (!draft.logo) return
                draft.logo.shadow =
                  size > 0
                    ? { size, color: draft.logo.shadow?.color ?? "#000000" }
                    : undefined
              })
            }
          />
          {scene.logo.shadow && scene.logo.shadow.size > 0 && (
            <ColorField
              label="投影颜色"
              value={scene.logo.shadow.color}
              onChange={(color) =>
                setScene((draft) => {
                  if (draft.logo?.shadow) draft.logo.shadow.color = color
                })
              }
            />
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              setScene((draft) => {
                draft.logo = null
              })
            }
          >
            移除图标
          </Button>
        </>
      )}
    </div>
  )
}
