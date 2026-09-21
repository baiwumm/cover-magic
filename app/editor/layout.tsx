import type { Metadata } from "next"

/**
 * /editor 专属布局：只负责标题。字体预加载在 app/layout.tsx（全站 UI 也用同一字体）。
 */
export const metadata: Metadata = {
  title: "编辑封面 · Cover Magic",
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
