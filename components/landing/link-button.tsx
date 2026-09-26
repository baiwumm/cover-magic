"use client"

/**
 * 落地页 CTA 专用：beUI ButtonLink（弹簧按压）+ next/router SPA 导航。
 * 外部链接（http 开头）走浏览器原生导航，保留 target/_blank。
 */

import { useRouter } from "next/navigation"
import { ButtonLink, type ButtonLinkProps } from "@/components/motion/button"

interface LinkButtonProps extends ButtonLinkProps {
  href: string
}

export function LinkButton({ href, onClick, ...rest }: LinkButtonProps) {
  const router = useRouter()
  const internal = href.startsWith("/")
  return (
    <ButtonLink
      href={href}
      onClick={
        internal
          ? (event) => {
              onClick?.(event)
              if (event.defaultPrevented) return
              event.preventDefault()
              router.push(href)
            }
          : onClick
      }
      {...rest}
    />
  )
}
