import { ArrowLeft } from "lucide-react"
import { ButtonLink } from "@/components/motion/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-7xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">页面不存在或已被移动。</p>
      <ButtonLink href="/" variant="outline" className="gap-1.5 rounded-full">
        <ArrowLeft className="size-4" />
        返回首页
      </ButtonLink>
    </main>
  )
}
