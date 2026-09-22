"use client"

import { motion } from "motion/react"

interface TextGenerateEffectProps {
  words: string
  className?: string
  /**
   * 逐字错峰入场（默认）。
   * false = 整行一次入场：配合 bg-clip-text 整行渐变使用（P1-18）。
   * 逐字 + 每字各自 bg-clip 会把渐变切成重复色带；父级 bg-clip 下逐字
   * filter/opacity 又无法作用于父级背景裁剪，故渐变行必须整行动画。
   */
  stagger?: boolean
  duration?: number
}

export function TextGenerateEffect({
  words,
  className,
  stagger = true,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const chars = Array.from(words)

  if (!stagger) {
    return (
      <motion.span
        initial={{ opacity: 0, filter: "blur(6px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration, ease: "easeOut" }}
        className={`inline-block whitespace-pre ${className ?? ""}`}
      >
        {words}
      </motion.span>
    )
  }

  return (
    <span className={className}>
      {chars.map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration, delay: i * 0.03, ease: "easeOut" }}
          className="inline-block whitespace-pre"
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}
