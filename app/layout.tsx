import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { siteConfig } from "@/constants/site"
import "./globals.css"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* 全站 UI 与封面渲染共用同一份字体子集，两个页面都要用 → 预加载上移到根布局。
            React 19 会把 <link rel="preload"> 提升至 <head> */}
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
