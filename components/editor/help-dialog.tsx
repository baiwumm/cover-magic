"use client"

/**
 * 快捷键说明面板（7.2）：`?` 或顶栏按钮呼出。
 * 与 useHistoryShortcuts / canvas-stage 键盘处理保持一致。
 * 底座为 beUI MorphingModal（无内建 Esc 关闭，此处自行补）。
 */

import { X } from "lucide-react"
import { type ReactNode, useEffect, useMemo } from "react"
import { Button } from "@/components/motion/button"
import { MorphingModal } from "@/components/motion/morphing-modal"

type Shortcut = {
  keys: ReactNode
  desc: string
}

function useIsMac() {
  return useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent),
    [],
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

function KbdGroup({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1">{children}</span>
}

function groups(isMac: boolean): { title: string; items: Shortcut[] }[] {
  const mod = isMac ? "⌘" : "Ctrl"
  return [
    {
      title: "历史",
      items: [
        {
          keys: (
            <KbdGroup>
              <Kbd>{mod}</Kbd>
              <Kbd>Z</Kbd>
            </KbdGroup>
          ),
          desc: "撤销",
        },
        {
          keys: (
            <KbdGroup>
              <Kbd>{mod}</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>Z</Kbd>
            </KbdGroup>
          ),
          desc: "重做",
        },
        {
          keys: (
            <KbdGroup>
              <Kbd>{mod}</Kbd>
              <Kbd>Y</Kbd>
            </KbdGroup>
          ),
          desc: "重做（备选）",
        },
      ],
    },
    {
      title: "画布选中元素（画布聚焦时）",
      items: [
        {
          keys: (
            <KbdGroup>
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
            </KbdGroup>
          ),
          desc: "微调位置（1px）",
        },
        {
          keys: (
            <KbdGroup>
              <Kbd>Shift</Kbd>
              <Kbd>↑</Kbd>
            </KbdGroup>
          ),
          desc: "快速微调（×10）",
        },
        { keys: <Kbd>Tab</Kbd>, desc: "循环切换元素（Shift 反向）" },
        { keys: <Kbd>Delete</Kbd>, desc: "清除当前元素" },
      ],
    },
    {
      title: "其它",
      items: [
        { keys: <Kbd>?</Kbd>, desc: "打开 / 关闭本面板" },
        { keys: <Kbd>Esc</Kbd>, desc: "关闭弹层" },
      ],
    },
  ]
}

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMac = useIsMac()

  // MorphingModal 不内建 Esc 关闭，与 shadcn Dialog 行为对齐
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  return (
    <MorphingModal
      viewId={open ? "shortcuts" : null}
      onClose={() => onOpenChange(false)}
      placement="center"
      className="max-w-md"
    >
      <div className="relative">
        {/* MorphingModal 无内建关闭控件，补一个与 Drawer 一致的 X */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭快捷键面板"
          className="absolute -top-1 right-0"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" />
        </Button>
        <h2 className="text-base font-semibold">快捷键</h2>
        <p className="mt-1 pr-8 text-xs text-muted-foreground">
          在输入框内编辑时，Ctrl+Z 等交给浏览器原生撤销。
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {groups(isMac).map((g) => (
          <section key={g.title} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-muted-foreground">
              {g.title}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {g.items.map((item) => (
                <li
                  key={item.desc}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span>{item.desc}</span>
                  <span className="shrink-0">{item.keys}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </MorphingModal>
  )
}
