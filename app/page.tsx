import { LightRays } from "@/components/background/light-ray"
import { Cta } from "@/components/landing/cta"
import { Faq } from "@/components/landing/faq"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { Navbar } from "@/components/landing/navbar"
import { Steps } from "@/components/landing/steps"
import { TemplateGallery } from "@/components/landing/template-gallery"

export default function Home() {
  return (
    // isolate + -z-10：光束作为整页固定背景，压在 body 底色之上、所有内容之下
    <div className="relative isolate min-h-screen">
      <LightRays
        className="pointer-events-none fixed inset-0 -z-10 opacity-50 dark:opacity-45"
        raysOrigin="top-center"
        raysColor="#8ab4ff"
        raysSpeed={0.8}
        lightSpread={0.9}
        rayLength={2.4}
        followMouse
        mouseInfluence={0.08}
        noiseAmount={0.05}
      />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <TemplateGallery />
        <Steps />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
