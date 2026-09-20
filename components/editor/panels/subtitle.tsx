"use client"

import { Button } from "@/components/ui/button"
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
            draft.subtitle = {
              text: "副标题",
              autoFit: true,
              maxWidthPct: 70,
              x: 50,
              y: 62,
              fontFamily: "Maple Mono CN",
              fontWeight: 400,
              italic: false,
              size: 40,
              color: "#cbd5e1",
              letterSpacing: 0,
              lineHeight: 1.25,
              align: "center",
              uppercase: false,
              shadow: 0,
            }
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
        slot="subtitle"
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
