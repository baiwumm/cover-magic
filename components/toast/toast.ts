"use client"

/**
 * 命令式 toast 桥接：保持 sonner 的调用形态（toast.success / error / warning…），
 * 底座换成 beUI AnimatedToastStack（components/toast/toaster.tsx 挂载）。
 * 全局单监听者：Toaster 卸载期间调用只会被丢弃。
 */

import type { ReactNode } from "react"
import type {
  ToastInput,
  ToastStatus,
} from "@/components/motion/animated-toast-stack"

export type ToastOptions = {
  description?: ReactNode
  duration?: number
}

type Listener = (input: ToastInput) => void

let listener: Listener | null = null

function emit(status: ToastStatus, title: ReactNode, opts?: ToastOptions) {
  listener?.({
    title,
    description: opts?.description,
    status,
    duration: opts?.duration,
  })
}

function withStatus(status: ToastStatus) {
  return (title: ReactNode, opts?: ToastOptions) => emit(status, title, opts)
}

export const toast = Object.assign(withStatus("neutral"), {
  success: withStatus("success"),
  error: withStatus("error"),
  warning: withStatus("info"),
  info: withStatus("info"),
  loading: withStatus("loading"),
})

export function subscribeToast(fn: Listener): () => void {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}
