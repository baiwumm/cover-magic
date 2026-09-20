import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 纯静态导出：产出 out/，由 Cloudflare Workers Static Assets 托管（R-12）
  output: "export",
  // Workers Assets 上没有默认图片优化器（R-14），一律用原生 <img>
  images: {
    unoptimized: true,
  },
  // 对 Workers 的 URL 规范化友好：/editor → editor.html（Phase 8.3 实测）
  trailingSlash: true,
}

export default nextConfig
