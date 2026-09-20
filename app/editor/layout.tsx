import type { Metadata } from "next"

/**
 * /editor 专属布局：字体仅在制作页 preload（R-15）。
 * React 19 会把 <link rel="preload"> 提升至 <head>。
 */
export const metadata: Metadata = {
  title: "编辑封面 · Cover Magic",
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link
        rel="preload"
        href="/fonts/maple-mono-cn-regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/maple-mono-cn-bold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      {children}
    </>
  )
}
