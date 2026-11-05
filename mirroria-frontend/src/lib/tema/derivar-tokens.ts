import type { MarcaPublica } from "@/types/marca.types"
import { textoSobre } from "./color"
import { FUENTES, RADIOS } from "./marca.constants"

export type AlcanceTema = "tienda" | "admin"

/** Variable CSS de la fuente de títulos. `@theme` la expone como `font-heading`. */
export const VAR_FUENTE_TITULOS = "--heading-font"

/** Todas las variables que un tema de tienda puede escribir (las borra `limpiarTema`). */
export const VARS_TEMA = [
  "--primary", "--primary-foreground", "--ring", "--sidebar-primary", "--sidebar-primary-foreground",
  "--brand-accent", "--brand-accent-foreground", "--chart-1", "--chart-2", "--radius", VAR_FUENTE_TITULOS,
] as const

type MarcaTokens = Pick<MarcaPublica, "colorPrimario" | "colorAcento" | "radio" | "fuente">

/**
 * De 2 colores a todo el tema (spec §B.1). Los neutros no salen de acá: los
 * pone el CSS con `[data-tema="tienda"]`. El admin no cambia radio ni fuente.
 */
export function derivarTokens(marca: MarcaTokens, alcance: AlcanceTema): Record<string, string> {
  const sobrePrincipal = textoSobre(marca.colorPrimario)
  const tokens: Record<string, string> = {
    "--primary": marca.colorPrimario,
    "--primary-foreground": sobrePrincipal,
    "--ring": marca.colorPrimario,
    "--sidebar-primary": marca.colorPrimario,
    "--sidebar-primary-foreground": sobrePrincipal,
    "--brand-accent": marca.colorAcento,
    "--brand-accent-foreground": textoSobre(marca.colorAcento),
    "--chart-1": marca.colorPrimario,
    "--chart-2": marca.colorAcento,
  }
  if (alcance === "tienda") {
    tokens["--radius"] = RADIOS[marca.radio]?.valor ?? RADIOS.SUAVE.valor
    tokens[VAR_FUENTE_TITULOS] = FUENTES[marca.fuente]?.pila ?? FUENTES.geist.pila
  }
  return tokens
}
