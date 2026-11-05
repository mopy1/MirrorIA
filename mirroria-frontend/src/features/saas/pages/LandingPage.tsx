import { CifrasVivas } from "../components/cifras-vivas"
import { ComoFunciona } from "../components/como-funciona"
import { DemoPersonalizacion } from "../components/demo-personalizacion"
import { IncluyeBento } from "../components/incluye-bento"
import { CtaFinal } from "../components/landing-cta"
import { HeroSaas } from "../components/landing-hero"
import { SeccionPlanes } from "../components/planes-grid"
import { PreguntasFrecuentes } from "../components/preguntas-frecuentes"
import { TiendasDirectorio } from "../components/tiendas-directorio"
import { useTiendasDirectorio } from "../hooks/useTiendasDirectorio"

/** `/` — landing de Tiendaria (spec Fase 1b §E.3, modo Persuade). Las tiendas alimentan el abanico y el directorio. */
export function LandingPage() {
  const d = useTiendasDirectorio()
  return (
    <>
      <HeroSaas tiendas={d.tiendas} />
      <CifrasVivas />
      <DemoPersonalizacion />
      <ComoFunciona />
      <IncluyeBento />
      <TiendasDirectorio tiendas={d.tiendas} isLoading={d.isLoading} error={d.error} onReintentar={d.reload} />
      <SeccionPlanes />
      <PreguntasFrecuentes />
      <CtaFinal />
    </>
  )
}
