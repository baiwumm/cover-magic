"use client"

import { Button } from "@/components/ui/button"
import { createDefaultSubtitle } from "@/lib/scene"
import { useSceneStore } from "@/stores/scene-store"
import { TextStyleEditor } from "./text-style-editor"

export function SubtitlePanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  if (!scene.subtitle) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() =>
          setScene((draft) => {
            draft.subtitle = createDefaultSubtitle()
          })
        }
      >
        添加副标题
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <TextStyleEditor
        style={scene.subtitle}
        onPatch={(patch) =>
          setScene((draft) => {
            if (draft.subtitle) Object.assign(draft.subtitle, patch)
          })
        }
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() =>
          setScene((draft) => {
            draft.subtitle = null
          })
        }
      >
        移除副标题
      </Button>
    </div>
  )
}
