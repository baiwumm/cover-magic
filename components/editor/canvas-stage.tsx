"use client"

/**
 * 画布区（2.6 + 3.x）：只读渲染 + 棋盘格衬底 + 直接操作层。
 * 场景内容只走 drawScene（R-1）；选中框/参考线画在独立 overlay 层，
 * 不参与导出（R-24）。
 * 拖拽期间改本地预览 Scene 并直接重绘，pointerup 才一次性提交进
 * history（3.7 / 7.8：撤销一次拖拽 = 回到拖拽前）。
 * 选中态在 store（P1-10 与左栏 Tab 联动）；快捷键仅画布聚焦时启用（P1-3）。
 */

import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { ensureFontLoaded } from "@/lib/fonts"
import { clamp, pxToPct, type SnapGuide, snapBlock } from "@/lib/geometry"
import { drawScene } from "@/lib/render/draw-scene"
import {
  computeSceneRects,
  hitTest,
  type SlotKey,
} from "@/lib/render/element-rects"
import { preloadSceneAssets } from "@/lib/render/icons"
import { LOGO_SIZE_RANGE, type Scene } from "@/lib/scene"
import { useSceneStore } from "@/stores/scene-store"

/** 拖拽容差：4 基准 px（3.4） */
const SNAP_TOLERANCE_BASIS_PX = 4
/** 键盘微调步长：1 基准 px，Shift ×10（3.5） */
const ARROW_STEP_BASIS_PX = 1
/** 缩放手柄命中/绘制尺寸（设备 px 基准，P2 可发现性） */
const HANDLE_HIT_PX = 14
const HANDLE_DRAW_PX = 12

const SLOT_ORDER: SlotKey[] = ["logo", "title", "subtitle", "watermark"]

interface DragState {
  slot: SlotKey
  scaling: boolean
  startPointerPct: { x: number; y: number }
  startBlockPct: { x: number; y: number }
  /** 拖拽中的预览 Scene（本地草稿，不进 store） */
  preview: Scene
}

export function CanvasStage() {
  const scene = useSceneStore((s) => s.scene)
  const setScene = useSceneStore((s) => s.setScene)
  const selected = useSceneStore((s) => s.selected)
  const setSelected = useSceneStore((s) => s.setSelected)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  /** 首帧完成前显示 loading，避免字体/资源 await 期被误判白屏（R-23） */
  const [ready, setReady] = useState(false)

  const dimsRef = useRef({ w: 0, h: 0 })
  const dragRef = useRef<DragState | null>(null)
  const guidesRef = useRef<SnapGuide[]>([])
  /** 当前生效的 Scene（拖拽中 = preview），供 overlay 计算与重绘 */
  const sceneRef = useRef(scene)
  sceneRef.current = dragRef.current?.preview ?? scene
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  /** 绘制场景层；sceneOverride 供拖拽预览 */
  const drawSceneLayer = useCallback(async (override?: Scene) => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const active = override ?? sceneRef.current
    await Promise.all([
      ensureFontLoaded("Maple Mono CN", 400),
      ensureFontLoaded("Maple Mono CN", 700),
      preloadSceneAssets(active),
    ])
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = wrap.clientWidth
    const cssH = (cssW * active.ratio.h) / active.ratio.w
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    const overlay = overlayRef.current
    if (overlay) {
      overlay.style.width = `${cssW}px`
      overlay.style.height = `${cssH}px`
      overlay.width = canvas.width
      overlay.height = canvas.height
    }
    dimsRef.current = { w: canvas.width, h: canvas.height }
    drawScene(ctx, active, { width: canvas.width, height: canvas.height })
    setReady(true)
  }, [])

  /** 绘制 overlay：选中框 + 吸附参考线 */
  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    const scale = overlay.height / 1080
    const guides = guidesRef.current

    for (const g of guides) {
      ctx.strokeStyle = "oklch(0.72 0.17 45)"
      ctx.lineWidth = 1
      ctx.beginPath()
      if (g.axis === "x") {
        const px = (g.positionPct / 100) * overlay.width
        ctx.moveTo(px, 0)
        ctx.lineTo(px, overlay.height)
      } else {
        const py = (g.positionPct / 100) * overlay.height
        ctx.moveTo(0, py)
        ctx.lineTo(overlay.width, py)
      }
      ctx.stroke()
    }

    const sel = selectedRef.current
    if (!sel) return
    const rects = computeSceneRects(
      sceneRef.current,
      overlay.width,
      overlay.height,
    )
    const r = rects[sel]
    if (!r) return
    ctx.strokeStyle = "oklch(0.72 0.17 45)"
    ctx.lineWidth = 1.5
    ctx.strokeRect(r.x, r.y, r.width, r.height)
    if (sel === "logo") {
      const hs = Math.max(HANDLE_DRAW_PX * scale, HANDLE_DRAW_PX)
      ctx.fillStyle = "oklch(0.72 0.17 45)"
      ctx.fillRect(r.x + r.width - hs / 2, r.y + r.height - hs / 2, hs, hs)
      // 外描边提高在浅色封面上的可发现性
      ctx.strokeStyle = "oklch(1 0 0 / 0.9)"
      ctx.lineWidth = 1
      ctx.strokeRect(r.x + r.width - hs / 2, r.y + r.height - hs / 2, hs, hs)
    }
  }, [])

  // 场景变更：只重画，不重建 ResizeObserver（避免首帧双重重绘，P2）
  // biome-ignore lint/correctness/useExhaustiveDependencies: scene 经 sceneRef 间接读取，此处仅作重绘触发器
  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      await drawSceneLayer()
      if (!cancelled) drawOverlay()
    }
    void draw()
    return () => {
      cancelled = true
    }
  }, [drawSceneLayer, drawOverlay, scene])

  // 尺寸观察：仅挂载时建一次
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      void drawSceneLayer().then(drawOverlay)
    })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => {
      ro.disconnect()
    }
  }, [drawSceneLayer, drawOverlay])

  // 选中变化只重绘 overlay（不重跑场景层）；selected 经 selectedRef 读取
  // biome-ignore lint/correctness/useExhaustiveDependencies: selection 触发轻量重绘
  useEffect(() => {
    drawOverlay()
  }, [selected, drawOverlay])

  /** 指针坐标 → 画布设备像素 */
  const toCanvasPx = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      px: (e.clientX - rect.left) * (canvas.width / rect.width),
      py: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    // 聚焦 overlay，快捷键限定画布（P1-3）
    overlayRef.current?.focus()
    const pos = toCanvasPx(e)
    if (!pos) return
    const { px, py } = pos
    const rects = computeSceneRects(scene, dimsRef.current.w, dimsRef.current.h)
    const slot = hitTest(rects, px, py)
    setSelected(slot)
    if (!slot) return
    const block = scene[slot]
    if (!block) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 合成事件或指针已失效时无法捕获，忽略
    }
    let scaling = false
    if (slot === "logo" && rects.logo) {
      const r = rects.logo
      const handleSize = Math.max(
        HANDLE_HIT_PX,
        HANDLE_HIT_PX * (dimsRef.current.h / 1080),
      )
      scaling =
        px >= r.x + r.width - handleSize && py >= r.y + r.height - handleSize
    }
    dragRef.current = {
      slot,
      scaling,
      startPointerPct: {
        x: pxToPct(px, dimsRef.current.w),
        y: pxToPct(py, dimsRef.current.h),
      },
      startBlockPct: { x: block.x, y: block.y },
      preview: structuredClone(scene),
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const pos = toCanvasPx(e)
    if (!pos) return
    const { px, py } = pos
    const drag = dragRef.current

    if (!drag) {
      // 悬停缩放手柄时给 nwse-resize，提升可发现性（P2）
      const overlay = overlayRef.current
      if (!overlay) return
      const sel = selectedRef.current
      if (sel === "logo" && sceneRef.current.logo) {
        const rects = computeSceneRects(
          sceneRef.current,
          dimsRef.current.w,
          dimsRef.current.h,
        )
        const r = rects.logo
        if (r) {
          const handleSize = Math.max(
            HANDLE_HIT_PX,
            HANDLE_HIT_PX * (dimsRef.current.h / 1080),
          )
          const near =
            px >= r.x + r.width - handleSize &&
            py >= r.y + r.height - handleSize
          overlay.style.cursor = near ? "nwse-resize" : "move"
          return
        }
      }
      overlay.style.cursor = "move"
      return
    }

    const curPct = {
      x: pxToPct(px, dimsRef.current.w),
      y: pxToPct(py, dimsRef.current.h),
    }
    const dxPct = curPct.x - drag.startPointerPct.x
    const dyPct = curPct.y - drag.startPointerPct.y
    const draft = drag.preview
    const block = draft[drag.slot]
    if (!block) return

    if (drag.scaling && drag.slot === "logo") {
      // logo 缩放：尺寸随横向拖拽变化（基准 px）
      const startSize = draft.logo?.size ?? 200
      const sizeDeltaPx = (dxPct / 100) * dimsRef.current.w
      const basisW = (1080 * draft.ratio.w) / draft.ratio.h
      const next = clamp(
        startSize + (sizeDeltaPx * basisW) / dimsRef.current.w,
        LOGO_SIZE_RANGE[0],
        LOGO_SIZE_RANGE[1],
      )
      if (draft.logo) draft.logo.size = next
    } else {
      // 3.4 吸附：中线 + 四边安全区，容差 4 基准 px
      let nextX = drag.startBlockPct.x + dxPct
      let nextY = drag.startBlockPct.y + dyPct
      const rects = computeSceneRects(
        draft,
        dimsRef.current.w,
        dimsRef.current.h,
      )
      const r = rects[drag.slot]
      const blockSizePct = {
        w: r ? pxToPct(r.width, dimsRef.current.w) : 0,
        h: r ? pxToPct(r.height, dimsRef.current.h) : 0,
      }
      const scale = dimsRef.current.h / 1080
      const tolPct = {
        x: ((SNAP_TOLERANCE_BASIS_PX * scale) / dimsRef.current.w) * 100,
        y: ((SNAP_TOLERANCE_BASIS_PX * scale) / dimsRef.current.h) * 100,
      }
      const snapped = snapBlock({ x: nextX, y: nextY }, blockSizePct, tolPct)
      nextX = snapped.xPct
      nextY = snapped.yPct
      guidesRef.current = snapped.guides
      block.x = nextX
      block.y = nextY
    }

    // 拖拽即时预览：直接重绘（字体已就绪，开销可接受）
    void drawSceneLayer(draft).then(drawOverlay)
  }

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    guidesRef.current = []
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // 忽略
    }
    // 3.7：一次性提交拖拽结果（1 条 history 记录，撤销 = 回到拖拽前）
    const final = drag.preview
    const finalBlock = final[drag.slot]
    setScene((draft) => {
      const block = draft[drag.slot]
      if (block && finalBlock) {
        block.x = finalBlock.x
        block.y = finalBlock.y
        if (drag.slot === "logo" && draft.logo && final.logo) {
          draft.logo.size = final.logo.size
        }
      }
    })
  }

  /** 键盘：方向键微调 / Tab 循环选中 / Delete 清除槽位（3.5）
   *  仅 overlay 聚焦时生效；`defaultPrevented` 让位 Radix（P1-3） */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return

      const overlay = overlayRef.current
      const canvasFocused =
        overlay != null && document.activeElement === overlay

      if (e.key === "Tab") {
        // Tab 未聚焦画布时不拦截，保证面板按钮可 Tab 到达（P1-3）
        if (!canvasFocused) return
        e.preventDefault()
        const present = SLOT_ORDER.filter((s) => scene[s])
        if (!present.length) return
        const cur = selectedRef.current
        const idx = cur ? present.indexOf(cur) : -1
        const next = e.shiftKey
          ? present[(idx - 1 + present.length) % present.length]
          : present[(idx + 1) % present.length]
        setSelected(cur ? next : present[0])
        return
      }

      if (!canvasFocused) return
      const cur = selectedRef.current
      if (!cur) return

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        setScene((draft) => {
          draft[cur] = null
        })
        setSelected(null)
        return
      }

      const step = ARROW_STEP_BASIS_PX * (e.shiftKey ? 10 : 1)
      const basisW = (1080 * scene.ratio.w) / scene.ratio.h
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-(step / basisW) * 100, 0],
        ArrowRight: [(step / basisW) * 100, 0],
        ArrowUp: [0, -(step / 1080) * 100],
        ArrowDown: [0, (step / 1080) * 100],
      }
      const mv = moves[e.key]
      if (!mv) return
      e.preventDefault()
      setScene((draft) => {
        const block = draft[cur]
        if (block) {
          block.x = clamp(block.x + mv[0], 0, 100)
          block.y = clamp(block.y + mv[1], 0, 100)
        }
      })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [scene, setScene, setSelected])

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div
        ref={wrapRef}
        className="max-w-full"
        style={{
          width: `min(100%, calc((100vh - 12rem) * ${scene.ratio.w / scene.ratio.h}))`,
          backgroundImage:
            "conic-gradient(from 90deg, oklch(0.85 0 0 / 0.35) 25%, transparent 0 50%, oklch(0.85 0 0 / 0.35) 0 75%, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="relative touch-none select-none">
          {!ready && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-muted/60">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="block rounded-md shadow-lg ring-1 ring-black/10"
          />
          <canvas
            ref={overlayRef}
            tabIndex={0}
            aria-label="画布（点击选中元素，方向键微调）"
            className="absolute inset-0 block cursor-move rounded-md outline-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        </div>
      </div>
    </div>
  )
}
