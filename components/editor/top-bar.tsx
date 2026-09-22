"use client"

/**
 * 顶栏（2.5/2.7）：平台预设 / 尺寸（解锁输入，R-21）/ 撤销重做 / 深浅色 / 导出入口。
 */

import { Download, Keyboard, Link2, Redo2, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { NumberInput } from "@/components/controls/number-input"
import { TemplateDrawer } from "@/components/editor/template-drawer"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PlatformGroup } from "@/lib/platforms"
import { GROUP_LABELS, matchPresetId, PLATFORM_PRESETS } from "@/lib/platforms"
import { useHistoryControls } from "@/lib/storage/history"
import {
  encodeSceneToHash,
  SHARE_URL_WARN_LENGTH,
} from "@/lib/storage/share-url"
import { useSceneStore } from "@/stores/scene-store"

interface TopBarProps {
  onOpenExport: () => void
  onOpenShortcuts: () => void
}

/** 单边像素上限（P1-14）：与浏览器 canvas 常见安全上限对齐 */
const MAX_EXPORT_DIMENSION = 8192

export function TopBar({ onOpenExport, onOpenShortcuts }: TopBarProps) {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  const { undo, redo, canUndo, canRedo } = useHistoryControls()

  const selectPreset = (id: string) => {
    const preset = PLATFORM_PRESETS.find((p) => p.id === id)
    if (!preset) return
    if (preset.id === "custom") return
    const ratioChanged =
      preset.width !== scene.exportSize.width ||
      preset.height !== scene.exportSize.height
    // R-21：只填入推荐值，不锁死宽高输入
    setScene((draft) => {
      draft.presetId = preset.id
      draft.ratio = { w: preset.width, h: preset.height }
      draft.exportSize = { width: preset.width, height: preset.height }
    })
    // 3.6：比例变化提示，autoFit 兜底
    if (ratioChanged) {
      toast("比例已切换", {
        description:
          "排版可能出现偏移，开启「超宽自动缩字号」的元素会自动适配。",
      })
    }
  }

  // P1-14：超大尺寸会被 toBlob/OOM 吞掉，在入口就夹住
  const setExportSize = (rawWidth: number, rawHeight: number) => {
    const width = Math.min(rawWidth, MAX_EXPORT_DIMENSION)
    const height = Math.min(rawHeight, MAX_EXPORT_DIMENSION)
    setScene((draft) => {
      draft.exportSize = { width, height }
      if (width > 0 && height > 0) {
        draft.ratio = { w: width, h: height }
        draft.presetId = "custom"
      }
    })
  }

  // 模板/存档载入后 presetId 常为 custom：按实际尺寸反查，显示不撒谎（P2）
  const displayPresetId = matchPresetId(
    scene.exportSize.width,
    scene.exportSize.height,
  )

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <span className="text-sm font-semibold tracking-tight">Cover Magic</span>

      <Select value={displayPresetId} onValueChange={selectPreset}>
        <SelectTrigger className="h-8 w-52 text-xs" aria-label="平台预设">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">自定义</SelectItem>
          {(["cn", "os", "general"] as PlatformGroup[]).map((g) => (
            <SelectGroup key={g}>
              <SelectLabel>{GROUP_LABELS[g]}</SelectLabel>
              {PLATFORM_PRESETS.filter((p) => p.group === g).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <NumberInput
          aria-label="导出宽度"
          value={scene.exportSize.width}
          min={16}
          onCommit={(width) => setExportSize(width, scene.exportSize.height)}
          className="h-8 w-20 text-xs"
        />
        <span>×</span>
        <NumberInput
          aria-label="导出高度"
          value={scene.exportSize.height}
          min={16}
          onCommit={(height) => setExportSize(scene.exportSize.width, height)}
          className="h-8 w-20 text-xs"
        />
        <span className="ml-1 hidden text-[10px] lg:inline">
          尺寸为社区经验值，可能过期
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <TemplateDrawer />
        <Button
          variant="ghost"
          size="icon"
          aria-label="撤销"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="重做"
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 className="size-4" />
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="复制分享链接"
          title="复制分享链接"
          onClick={() => {
            void (async () => {
              const hash = await encodeSceneToHash(
                useSceneStore.getState().scene,
              )
              const url = `${window.location.origin}/editor/#${hash}`
              // P1-23：含图 Scene 可能超 URL 上限，先警告再复制
              if (url.length > SHARE_URL_WARN_LENGTH) {
                toast.warning("分享链接过长", {
                  description:
                    "场景内嵌图片可能导致链接被截断、对方打开失败。建议改用纯色背景，或删掉多余上传图后重试。",
                })
              }
              try {
                await navigator.clipboard.writeText(url)
                toast.success("链接已复制", {
                  description:
                    "在浏览器打开即可还原当前设计（无需登录与上传）。",
                })
              } catch {
                toast.error("复制失败", {
                  description: "请检查浏览器剪贴板权限。",
                })
              }
            })()
          }}
        >
          <Link2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="快捷键说明"
          title="快捷键（?）"
          onClick={onOpenShortcuts}
        >
          <Keyboard className="size-4" />
        </Button>
        <Button size="sm" className="h-8 gap-1.5" onClick={onOpenExport}>
          <Download className="size-3.5" />
          导出
        </Button>
      </div>
    </header>
  )
}
