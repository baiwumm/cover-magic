import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-7xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">页面不存在或已被移动。</p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">
          <ArrowLeft className="size-4" />
          返回首页
        </Link>
      </Button>
    </main>
  )
}
