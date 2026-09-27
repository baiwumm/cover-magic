"use client"

/**
 * 顶栏（2.5/2.7）：平台预设 / 尺寸（解锁输入，R-21）/ 撤销重做 / 深浅色 / 导出入口。
 * 平台预设用 beUI Combobox（分组 + 可搜索；beUI Select 无分组支持）。
 */

import { Download, Keyboard, Link2, Redo2, Undo2 } from "lucide-react"
import { NumberInput } from "@/components/controls/number-input"
import { TemplateDrawer } from "@/components/editor/template-drawer"
import { Button } from "@/components/motion/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/motion/combobox"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { toast } from "@/components/toast/toast"
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
      {/* 品牌 = 回首页入口（logo 明暗双图 CSS 切换） */}
      <a
        href="/"
        aria-label="回到首页"
        className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight transition-opacity hover:opacity-70"
      >
        {/* biome-ignore lint/performance/noImgElement: R-14 原生 img；装饰性 logo（alt=""）明暗双图靠 CSS 切换 */}
        <img
          src="/logo-light.svg"
          alt=""
          className="size-6 rounded-md dark:hidden"
        />
        {/* biome-ignore lint/performance/noImgElement: R-14 原生 img；装饰性 logo（alt=""）明暗双图靠 CSS 切换 */}
        <img
          src="/logo-dark.svg"
          alt=""
          className="hidden size-6 rounded-md dark:block"
        />
        Cover Magic
      </a>

      {/* beUI Combobox 根元素自带 w-full，顶栏内必须显式收窄（否则挤压全行）。
          Trigger 负责定位 ref（Content 依赖它测量），Input 内嵌其中提供搜索 */}
      <Combobox
        value={displayPresetId}
        onValueChange={selectPreset}
        className="w-52 shrink-0"
      >
        <ComboboxTrigger className="h-8 rounded-full px-2.5">
          <ComboboxInput
            aria-label="平台预设"
            placeholder="选择平台…"
            className="h-6 text-xs"
          />
        </ComboboxTrigger>
        <ComboboxContent align="start">
          <ComboboxList className="text-xs">
            <ComboboxEmpty>没有匹配的平台</ComboboxEmpty>
            <ComboboxItem value="custom">自定义</ComboboxItem>
            {(["cn", "os", "general"] as PlatformGroup[]).map((g) => (
              <ComboboxGroup key={g}>
                <ComboboxLabel>{GROUP_LABELS[g]}</ComboboxLabel>
                {PLATFORM_PRESETS.filter((p) => p.group === g).map((p) => (
                  <ComboboxItem key={p.id} value={p.id} textValue={p.name}>
                    {p.name}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <NumberInput
          aria-label="导出宽度"
          value={scene.exportSize.width}
          min={16}
          onCommit={(width) => setExportSize(width, scene.exportSize.height)}
          className="w-20"
          classNames={{ field: "h-8", input: "px-2.5 text-xs" }}
        />
        <span>×</span>
        <NumberInput
          aria-label="导出高度"
          value={scene.exportSize.height}
          min={16}
          onCommit={(height) => setExportSize(scene.exportSize.width, height)}
          className="w-20"
          classNames={{ field: "h-8", input: "px-2.5 text-xs" }}
        />
        <span className="ml-1 hidden text-[10px] lg:inline">
          尺寸为社区经验值，可能过期
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
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
        <Button
          size="sm"
          className="h-8 shrink-0 gap-1.5 whitespace-nowrap"
          onClick={onOpenExport}
        >
          <Download className="size-3.5" />
          导出
        </Button>
      </div>
    </header>
  )
}
