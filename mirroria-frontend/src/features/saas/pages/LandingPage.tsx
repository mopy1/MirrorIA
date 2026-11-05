import { ComoFunciona } from "../components/como-funciona"
import { CtaFinal } from "../components/landing-cta"
import { HeroSaas } from "../components/landing-hero"
import { SeccionPlanes } from "../components/planes-grid"
import { TiendasDirectorio } from "../components/tiendas-directorio"

/** `/` — landing de la plataforma SaaS. */
export function LandingPage() {
  return (
    <>
      <HeroSaas />
      <ComoFunciona />
      <SeccionPlanes />
      <TiendasDirectorio />
      <CtaFinal />
    </>
  )
}
