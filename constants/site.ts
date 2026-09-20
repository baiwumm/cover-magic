/**
 * 站点常量唯一定义处（替代 .env，R-12：无服务端，不使用环境变量）。
 */
export const siteConfig = {
  name: "Cover Magic",
  description: "专业的封面设计工具，支持实时预览和高质量导出",
  url: "https://cover.baiwumm.com",
  author: {
    name: "baiwumm",
    email: "me@baiwumm.com",
    blog: "https://baiwumm.com",
  },
  links: {
    github: "https://github.com/baiwumm",
    repository: "https://github.com/baiwumm/cover-magic",
  },
  beian: {
    icp: "粤ICP备2023007649号",
    icpUrl: "https://beian.miit.gov.cn/",
    police: "粤公网安备44030402006402号",
    policeUrl: "https://beian.mps.gov.cn/",
  },
} as const

/** 水印默认文本（D-26） */
export const WATERMARK_DEFAULT_TEXT = "@baiwumm"
