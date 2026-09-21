import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          现在，给你的下一篇文章配张好封面
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          无需注册、无需安装，打开浏览器就能开始。
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/editor" prefetch={false}>
            开始设计
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
