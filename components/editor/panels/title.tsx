"use client"

import { Button } from "@/components/ui/button"
import { createDefaultScene } from "@/lib/scene"
import { useSceneStore } from "@/stores/scene-store"
import { TextStyleEditor } from "./text-style-editor"

export function TitlePanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  if (!scene.title) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() =>
          setScene((draft) => {
            const def = createDefaultScene().title
            if (def) draft.title = structuredClone(def)
          })
        }
      >
        添加主标题
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <TextStyleEditor
        style={scene.title}
        onPatch={(patch) =>
          setScene((draft) => {
            if (draft.title) Object.assign(draft.title, patch)
          })
        }
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() =>
          setScene((draft) => {
            draft.title = null
          })
        }
      >
        移除主标题
      </Button>
    </div>
  )
}
