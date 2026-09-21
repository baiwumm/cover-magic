"use client"

import { motion } from "motion/react"

interface TextGenerateEffectProps {
  words: string
  className?: string
  /** 附加到每个字符 span 的类（用于 bg-clip-text 渐变：filter 动画会切断父级裁剪，必须在字符层） */
  charClassName?: string
  duration?: number
}

export function TextGenerateEffect({
  words,
  className,
  charClassName,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const chars = Array.from(words)
  return (
    <span className={className}>
      {chars.map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration, delay: i * 0.03, ease: "easeOut" }}
          className={`inline-block whitespace-pre ${charClassName ?? ""}`}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}
