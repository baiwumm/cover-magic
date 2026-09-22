"use client"

/**
 * 编辑器三栏骨架（D-16）：顶栏 + 左工具栏 Tabs + 中央画布。
 * 左栏与画布用 shadcn resizable 分隔；画布容器比例锁定用 aspect-ratio（2.6）。
 * 画布选中槽位 → 自动切到对应 Tab（P1-10）；挂 Ctrl+Z 快捷键（P1-9）；
 * `?` 呼出快捷键面板（7.2）。
 */

import { useEffect, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize="22" minSize="16" maxSize="34">
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex h-full flex-col gap-0"
          >
            {/* group-data-horizontal/tabs:h-8 是带 variant 前缀的高度，裸 h-auto 覆盖不掉，
                两行标签会被压进 32px 并溢出到面板上（第二行点不到）*/}
            <TabsList className="mx-2 mt-2 grid h-auto w-auto grid-cols-3 gap-1 group-data-horizontal/tabs:h-auto">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {TABS.map((t) => (
                  <TabsContent
                    key={t.value}
                    value={t.value}
                    className="mt-0"
                    // P1-15：导出面板 local state 不随 Tab 切换重置
                    forceMount={t.value === "export" ? true : undefined}
                  >
                    {t.node}
                  </TabsContent>
                ))}
              </div>
            </ScrollArea>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="78">
          <CanvasStage />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
