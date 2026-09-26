"use client"

/**
 * 编辑器三栏骨架（D-16）：顶栏 + 左工具栏 Tabs + 中央画布。
 * 左栏与画布用 react-resizable-panels 分隔（beUI 无对应件）；画布容器比例锁定用 aspect-ratio（2.6）。
 * 画布选中槽位 → 自动切到对应 Tab（P1-10）；挂 Ctrl+Z 快捷键（P1-9）；
 * `?` 呼出快捷键面板（7.2）。
 * beUI TabsContent 非激活面板保持挂载（hidden），导出面板 local state 不随切换重置（P1-15）。
 */

import { useEffect, useState } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import { useHistoryShortcuts } from "@/lib/storage/history"
import { useSceneStore } from "@/stores/scene-store"
import { CanvasStage } from "./canvas-stage"
import { HelpDialog } from "./help-dialog"
import { BackgroundPanel } from "./panels/background"
import { ExportPanel } from "./panels/export"
import { LogoPanel } from "./panels/logo"
import { SubtitlePanel } from "./panels/subtitle"
import { TitlePanel } from "./panels/title"
import { WatermarkPanel } from "./panels/watermark"
import { TopBar } from "./top-bar"

const TABS = [
  { value: "background", label: "背景", node: <BackgroundPanel /> },
  { value: "logo", label: "图标", node: <LogoPanel /> },
  { value: "title", label: "主标题", node: <TitlePanel /> },
  { value: "subtitle", label: "副标题", node: <SubtitlePanel /> },
  { value: "watermark", label: "水印", node: <WatermarkPanel /> },
  { value: "export", label: "导出", node: <ExportPanel /> },
] as const

const SLOT_TO_TAB: Record<string, string> = {
  logo: "logo",
  title: "title",
  subtitle: "subtitle",
  watermark: "watermark",
}

export function EditorShell() {
  const [tab, setTab] = useState<string>("background")
  const [helpOpen, setHelpOpen] = useState(false)
  const selected = useSceneStore((s) => s.selected)

  useHistoryShortcuts()

  // 7.2：`?` 呼出快捷键面板（输入框内让位；Esc 由 Dialog 关闭）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
          target.isContentEditable)
      )
        return
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault()
        setHelpOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // 画布选中 → 左栏联动（点击空白清空选中时保持当前 Tab）
  useEffect(() => {
    if (!selected) return
    const next = SLOT_TO_TAB[selected]
    if (next) setTab(next)
  }, [selected])

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        onOpenExport={() => setTab("export")}
        onOpenShortcuts={() => setHelpOpen(true)}
      />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <Group orientation="horizontal" className="flex h-full w-full flex-1">
        <Panel defaultSize="22" minSize="16" maxSize="34">
          <Tabs
            value={tab}
            onValueChange={setTab}
            variant="segment"
            className="flex h-full flex-col"
          >
            {/* 2×3 网格布局：左栏窄，横向滚动 TabsList 会藏起后半标签（R-20）。
                用 grid 覆盖 TabsList 的 w-max 行布局。beUI 的标签翻色层按 X 轴
                计算覆盖，网格第二行同列标签会被误判 —— 直接隐藏翻色层，
                激活态文字色由 aria-selected 变体承担 */}
            <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3 gap-1 bg-muted/60 [&_[data-tabs-label]]:hidden">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="w-full justify-center px-2 py-1.5 text-xs aria-selected:text-primary-foreground"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="p-4">
                {TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value} className="mt-0">
                    {t.node}
                  </TabsContent>
                ))}
              </div>
            </div>
          </Tabs>
        </Panel>
        <Separator className="w-1.5 bg-border transition-colors hover:bg-(--color-border-strong)" />
        <Panel defaultSize="78">
          <CanvasStage />
        </Panel>
      </Group>
    </div>
  )
}
