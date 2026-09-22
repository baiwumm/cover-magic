"use client"

/**
 * D-22 / R-22：/editor 不做响应式编辑器。
 * 触屏或窄视口渲染「请在 PC 端使用」提示卡；落地页不受影响。
 */

import { MonitorSmartphone } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

/** 窄于该宽度视为不适合编辑的视口 */
const NARROW_PX = 768

function isNarrowViewport(): boolean {
  if (typeof window === "undefined") return false
  return window.innerWidth < NARROW_PX
}

function isTouchLikely(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(pointer: coarse)").matches) return true
  // 窄视口 + 多点触控能力：桌面 DevTools 模拟手机也会命中
  return window.innerWidth < 1024 && navigator.maxTouchPoints > 0
}

export function shouldShowMobileGate(): boolean {
  return isNarrowViewport() || isTouchLikely()
}

export function MobileGate() {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const evaluate = () => setBlocked(shouldShowMobileGate())
    evaluate()
    window.addEventListener("resize", evaluate)
    return () => window.removeEventListener("resize", evaluate)
  }, [])

  // SSR / 首帧：先渲染完整编辑器骨架避免闪白，客户端检测后再替换
  if (!blocked) return null

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted">
        <MonitorSmartphone className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          请在电脑端使用 Cover Magic
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          编辑器依赖画布拖拽与三栏布局，暂不支持手机编辑。请在桌面浏览器打开以获得完整体验。
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard
              .writeText("https://cover.baiwumm.com/editor/")
              .catch(() => {})
          }}
        >
          复制桌面链接
        </Button>
        <Button asChild size="sm" variant="ghost">
          <a href="/">返回首页</a>
        </Button>
      </div>
    </main>
  )
}
