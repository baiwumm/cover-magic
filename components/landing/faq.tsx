import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "生成的封面可以商用吗？",
    a: "可以。Cover Magic 只是一个设计工具，导出的图片归你所有；请注意自行确认所用图标与图片素材的授权。",
  },
  {
    q: "我的设计数据会上传到服务器吗？",
    a: "不会。全部渲染在浏览器本地完成，设计数据只保存在你浏览器的 localStorage，分享走的是链接而非服务器。",
  },
  {
    q: "为什么有些生僻字显示成系统字体？",
    a: "为控制体积，内置中文字体为 GB2312 常用字子集；子集外的生僻字会回退到系统字体，一般不影响封面效果。",
  },
  {
    q: "平台预设的尺寸会过期吗？",
    a: "预设来自社区经验值，平台可能随时调整，因此预设只填入推荐值而不锁定输入；以你实际平台后台提示为准。",
  },
] as const

export function Faq() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
        常见问题
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((f, i) => (
          <AccordionItem key={f.q} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-sm">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
