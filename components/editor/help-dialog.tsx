"use client"

/**
 * 快捷键说明面板（7.2）：`?` 或顶栏按钮呼出。
 * 与 useHistoryShortcuts / canvas-stage 键盘处理保持一致。
 */

import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

type Shortcut = {
  keys: React.ReactNode
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>快捷键</DialogTitle>
          <DialogDescription>
            在输入框内编辑时，Ctrl+Z 等交给浏览器原生撤销。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
      </DialogContent>
    </Dialog>
  )
}
