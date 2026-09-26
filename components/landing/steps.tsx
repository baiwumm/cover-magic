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

/** beUI 卡面语言：虚线描边 + 圆角 2xl + 发丝分隔，纯静态保持服务端渲染 */
export function Steps() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">
        三步搞定
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-border bg-background/60 p-5 backdrop-blur-sm"
          >
            <span className="font-mono text-3xl font-bold text-muted-foreground">
              {s.step}
            </span>
            <h3 className="text-base font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
