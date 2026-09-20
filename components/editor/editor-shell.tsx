"use client"

/**
 * 编辑器三栏骨架（D-16）：顶栏 + 左工具栏 Tabs + 中央画布。
 * 左栏与画布用 shadcn resizable 分隔；画布容器比例锁定用 aspect-ratio（2.6）。
 */

import { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CanvasStage } from "./canvas-stage"
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

export function EditorShell() {
  const [tab, setTab] = useState<string>("background")

  return (
    <div className="flex h-screen flex-col">
      <TopBar onOpenExport={() => setTab("export")} />
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize="22" minSize="16" maxSize="34">
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex h-full flex-col gap-0"
          >
            <TabsList className="mx-2 mt-2 grid h-auto w-auto grid-cols-3 gap-1">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value} className="mt-0">
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
