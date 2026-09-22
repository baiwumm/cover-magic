import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STEPS = [
  {
    step: "01",
    title: "选尺寸",
    description: "挑一个平台预设或自定义宽高，画布比例即时跟随。",
  },
  {
    step: "02",
    title: "改内容",
    description: "换模板、改标题副标题、加图标与背景，画布上直接拖到位。",
  },
  {
    step: "03",
    title: "导出",
    description: "一键下载 PNG / JPEG / WebP，或复制到剪贴板直接粘贴。",
  },
] as const

export function Steps() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">
        三步搞定
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <Card key={s.step} className="rounded-2xl border-dashed">
            <CardHeader>
              <span className="font-mono text-3xl font-bold text-muted-foreground">
                {s.step}
              </span>
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {s.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
