import { BranchesStrip } from "../components/branches-strip"
import { CategoryShowcase } from "../components/category-showcase"
import { ContactSection } from "../components/contact-section"
import { FeatureHighlights } from "../components/feature-highlights"
import { HeroSection } from "../components/hero-section"

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureHighlights />
      <CategoryShowcase />
      <BranchesStrip />
      <ContactSection />
    </>
  )
}
