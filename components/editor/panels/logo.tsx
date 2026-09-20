"use client"

import { useState } from "react"
import { ColorField } from "@/components/controls/color-field"
import { SliderField } from "@/components/controls/slider-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { preloadImage } from "@/lib/render/icons"
import { useSceneStore } from "@/stores/scene-store"

/**
 * 图标面板：Phase 2 提供图标代码直接输入（iconify code）；
 * 搜索面板与精选集合在 Phase 5.7 接入。
 */
export function LogoPanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  const [code, setCode] = useState("")

  const applyCode = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setScene((draft) => {
      draft.logo = {
        source: { kind: "iconify", code: trimmed },
        size: 200,
        x: 50,
        y: 22,
      }
    })
    await preloadImage({ kind: "iconify", code: trimmed })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">
          图标代码（Iconify）
        </span>
        <div className="flex gap-2">
          <Input
            value={code}
            placeholder="例如 fluent-emoji-flat:fire"
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void applyCode(code)
            }}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => void applyCode(code)}
          >
            应用
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          完整搜索面板将在后续版本提供；可前往 iconify.design 查询代码。
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">或上传图片</span>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={async () => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "image/*"
            input.onchange = async () => {
              const file = input.files?.[0]
              if (!file) return
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(reader.error)
                reader.readAsDataURL(file)
              })
              setScene((draft) => {
                draft.logo = {
                  source: { kind: "upload", dataUrl },
                  size: 200,
                  x: 50,
                  y: 22,
                }
              })
              await preloadImage({ kind: "upload", dataUrl })
            }
            input.click()
          }}
        >
          选择图片
        </Button>
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
