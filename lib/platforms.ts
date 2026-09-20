/**
 * 平台预设（D-21 / R-21）：14 档，选中后只填入推荐值、不锁死输入。
 * 数值均为社区/经验值，可能过期，控件上需给「数值可能过期」的次要说明。
 */

import type { Ratio } from "@/lib/scene"

export type PlatformGroup = "cn" | "os" | "general"

export interface PlatformPreset {
  id: string
  name: string
  group: PlatformGroup | null
  width: number
  height: number
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: "custom", name: "自定义", group: null, width: 0, height: 0 },
  {
    id: "wechat-top",
    name: "微信公众号 · 头条",
    group: "cn",
    width: 900,
    height: 383,
  },
  {
    id: "wechat-sub",
    name: "微信公众号 · 次条",
    group: "cn",
    width: 500,
    height: 500,
  },
  { id: "zhihu", name: "知乎", group: "cn", width: 1200, height: 488 },
  { id: "juejin", name: "掘金", group: "cn", width: 1280, height: 720 },
  { id: "csdn", name: "CSDN", group: "cn", width: 1280, height: 720 },
  {
    id: "aliyun",
    name: "阿里云开发者社区",
    group: "cn",
    width: 1280,
    height: 720,
  },
  {
    id: "tencent",
    name: "腾讯云开发者社区",
    group: "cn",
    width: 1280,
    height: 720,
  },
  { id: "toutiao", name: "今日头条", group: "cn", width: 1280, height: 720 },
  { id: "jianshu", name: "简书", group: "cn", width: 1080, height: 1080 },
  { id: "xhs", name: "小红书", group: "os", width: 1242, height: 1660 },
  { id: "bilibili", name: "B站", group: "os", width: 1440, height: 900 },
  { id: "twitter", name: "X / Twitter", group: "os", width: 1200, height: 675 },
  { id: "youtube", name: "YouTube", group: "os", width: 1280, height: 720 },
  {
    id: "og",
    name: "通用 Open Graph",
    group: "general",
    width: 1200,
    height: 630,
  },
]

export const GROUP_LABELS: Record<PlatformGroup, string> = {
  cn: "中文社区",
  os: "海外平台",
  general: "通用",
}

export function getPreset(id: string): PlatformPreset | undefined {
  return PLATFORM_PRESETS.find((p) => p.id === id)
}

export function presetRatio(p: PlatformPreset): Ratio {
  return { w: p.width, h: p.height }
}
