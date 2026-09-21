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
    <div className="min-h-screen">
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
