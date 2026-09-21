"use client"

import {
  Feather,
  Gauge,
  Languages,
  MousePointerClick,
  Ruler,
  Share2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "画布直接拖拽",
    description:
      "标题、副标题、水印直接在画布上拖动定位，方向键微调，中线与安全区自动吸附。",
  },
  {
    icon: Languages,
    title: "中文排版引擎",
    description:
      "标点禁则断行、超宽自动缩字号，中英混排不错位，等宽中文字体开箱即用。",
  },
  {
    icon: Ruler,
    title: "平台尺寸预设",
    description:
      "公众号头条/次条、知乎、掘金、小红书、B站等 14 档预设，一键切换不锁死。",
  },
  {
    icon: Gauge,
    title: "所见即所得",
    description:
      "预览、缩略图与导出共用同一 Canvas 渲染内核，逐像素一致，4K 导出不虚标。",
  },
  {
    icon: Feather,
    title: "轻量离线优先",
    description: "纯静态部署、数据只存本地浏览器，字体子集化自托管，打开即用。",
  },
  {
    icon: Share2,
    title: "分享即链接",
    description:
      "设计配置压缩进链接，发给同事即可完整还原画面，无需登录与文件传输。",
  },
] as const

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card
            key={f.title}
            className="rounded-2xl border-dashed bg-background/50 transition-colors hover:bg-accent/40"
          >
            <CardHeader>
              <f.icon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {f.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
