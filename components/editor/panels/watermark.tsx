"use client"

import { SliderField } from "@/components/controls/slider-field"
import { Button } from "@/components/ui/button"
import { createDefaultWatermark } from "@/lib/scene"
import { useSceneStore } from "@/stores/scene-store"
import { TextStyleEditor } from "./text-style-editor"

/**
 * 水印面板：一键关 = 置 null（D-26），默认文本 @baiwumm。
 */
export function WatermarkPanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)

  if (!scene.watermark) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() =>
          setScene((draft) => {
            draft.watermark = createDefaultWatermark()
          })
        }
      >
        开启水印
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <TextStyleEditor
        style={scene.watermark}
        disableAutoFit
        onPatch={(patch) =>
          setScene((draft) => {
            if (draft.watermark) Object.assign(draft.watermark, patch)
          })
        }
      />
      <SliderField
        label="不透明度"
        value={scene.watermark.opacity}
        min={0.05}
        max={1}
        step={0.05}
        onChange={(opacity) =>
          setScene((draft) => {
            if (draft.watermark) draft.watermark.opacity = opacity
          })
        }
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() =>
          setScene((draft) => {
            draft.watermark = null
          })
        }
      >
        关闭水印
      </Button>
    </div>
  )
}
