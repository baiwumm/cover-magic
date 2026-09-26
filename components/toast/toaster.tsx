"use client"

/**
 * 全站唯一 Toaster：beUI AnimatedToastStack 固定定位于顶部居中，
 * 消费 components/toast/toast.ts 的命令式调用。
 */

import { useEffect } from "react"
import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from "@/components/motion/animated-toast-stack"
import { subscribeToast } from "./toast"

export function Toaster() {
  const { toasts, showToast, dismissToast } = useAnimatedToastStack({
    defaultDuration: 4200,
    limit: 4,
  })

  useEffect(() => subscribeToast(showToast), [showToast])

  return (
    <AnimatedToastStack
      toasts={toasts}
      onDismiss={dismissToast}
      position="top-center"
      fixed
    />
  )
}
