"use client"

import { AssetDropzone } from "@/components/controls/asset-dropzone"
import { ColorField } from "@/components/controls/color-field"
import { SelectField } from "@/components/controls/select-field"
import { SliderField } from "@/components/controls/slider-field"
import { SwitchField } from "@/components/controls/switch-field"
import { Separator } from "@/components/ui/separator"
import { useSceneStore } from "@/stores/scene-store"

export function BackgroundPanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  const bg = scene.background

  return (
    <div className="flex flex-col gap-3">
      <SelectField
        label="背景类型"
        value={bg.kind}
        options={[
          { value: "color", label: "纯色" },
          { value: "gradient", label: "渐变" },
          { value: "image", label: "图片" },
        ]}
        onChange={(kind) => {
          setScene((draft) => {
            const d = draft.background
            if (kind === "color" && d.kind !== "color") {
              draft.background = { kind: "color", color: "#0f172a" }
            } else if (kind === "gradient" && d.kind !== "gradient") {
              draft.background = {
                kind: "gradient",
                from: "#1e293b",
                to: "#0f172a",
                angle: 135,
              }
            } else if (kind === "image" && d.kind !== "image") {
              draft.background = {
                kind: "image",
                dataUrl: "",
                fit: "cover",
                blur: 0,
                overlay: 0,
                overlayColor: "#000000",
              }
            }
          })
        }}
      />

      {bg.kind === "color" && (
        <ColorField
          label="颜色"
          value={bg.color}
          onChange={(color) =>
            setScene((draft) => {
              if (draft.background.kind === "color")
                draft.background.color = color
            })
          }
        />
      )}

      {bg.kind === "gradient" && (
        <>
          <ColorField
            label="起始色"
            value={bg.from}
            onChange={(from) =>
              setScene((draft) => {
                if (draft.background.kind === "gradient")
                  draft.background.from = from
              })
            }
          />
          <ColorField
            label="结束色"
            value={bg.to}
            onChange={(to) =>
              setScene((draft) => {
                if (draft.background.kind === "gradient")
                  draft.background.to = to
              })
            }
          />
          <SliderField
            label="角度"
            value={bg.angle}
            min={0}
            max={360}
            unit="°"
            onChange={(angle) =>
              setScene((draft) => {
                if (draft.background.kind === "gradient")
                  draft.background.angle = angle
              })
            }
          />
        </>
      )}

      {bg.kind === "image" && (
        <>
          <AssetDropzone
            label="拖拽背景图，或点击选择"
            onDataUrl={(dataUrl) =>
              setScene((draft) => {
                if (draft.background.kind === "image")
                  draft.background.dataUrl = dataUrl
              })
            }
          />
          <SelectField
            label="适应方式"
            value={bg.fit}
            options={[
              { value: "cover", label: "裁剪铺满（cover）" },
              { value: "contain", label: "完整包含（contain）" },
            ]}
            onChange={(fit) =>
              setScene((draft) => {
                if (draft.background.kind === "image") {
                  draft.background.fit = fit as "cover" | "contain"
                }
              })
            }
          />
          <SliderField
            label="模糊"
            value={bg.blur}
            min={0}
            max={40}
            unit="px"
            onChange={(blur) =>
              setScene((draft) => {
                if (draft.background.kind === "image")
                  draft.background.blur = blur
              })
            }
          />
          <Separator />
          <SwitchField
            label="遮罩"
            checked={bg.overlay > 0}
            onCheckedChange={(on) =>
              setScene((draft) => {
                if (draft.background.kind === "image")
                  draft.background.overlay = on ? 0.35 : 0
              })
            }
          />
          {bg.overlay > 0 && (
            <>
              <ColorField
                label="遮罩色"
                value={bg.overlayColor}
                onChange={(overlayColor) =>
                  setScene((draft) => {
                    if (draft.background.kind === "image")
                      draft.background.overlayColor = overlayColor
                  })
                }
              />
              <SliderField
                label="遮罩强度"
                value={bg.overlay}
                min={0}
                max={1}
                step={0.05}
                onChange={(overlay) =>
                  setScene((draft) => {
                    if (draft.background.kind === "image")
                      draft.background.overlay = overlay
                  })
                }
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
