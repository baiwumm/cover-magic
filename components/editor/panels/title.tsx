"use client"

import { useSceneStore } from "@/stores/scene-store"
import { TextStyleEditor } from "./text-style-editor"

export function TitlePanel() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  if (!scene.title) return null
  return (
    <TextStyleEditor
      slot="title"
      style={scene.title}
      onPatch={(patch) =>
        setScene((draft) => {
          if (draft.title) Object.assign(draft.title, patch)
        })
      }
    />
  )
}
