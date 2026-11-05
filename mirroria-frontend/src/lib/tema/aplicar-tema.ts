// Aplica / limpia el tema de una tienda en <html> (spec Fase 1b §B.3). Va en
// <html> y no en un div porque los portales de Base UI cuelgan de <body>.
import type { MarcaPublica } from "@/types/marca.types"
import { derivarTokens, VARS_TEMA, type AlcanceTema } from "./derivar-tokens"

export const FAVICON_PLATAFORMA = "/favicon.svg"
export const TITULO_PLATAFORMA = "MirrorIA"
const CLAVE_CACHE = "mirroria.marca."

function html(): HTMLElement {
  return document.documentElement
}

function ponerFavicon(href: string) {
  const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
  if (link && link.getAttribute("href") !== href) link.setAttribute("href", href)
}

/** Solo los neutros de tienda (sin colores todavía): antes del primer paint de `/t/:slug`. */
export function prepararNeutrosTienda(): void {
  html().dataset.tema = "tienda"
  html().classList.remove("dark")
}

export function aplicarTemaTienda(marca: MarcaPublica, alcance: AlcanceTema): void {
  const el = html()
  el.dataset.tema = "tienda"
  el.classList.toggle("dark", alcance === "tienda" && marca.modo === "OSCURO")
  for (const [k, v] of Object.entries(derivarTokens(marca, alcance))) el.style.setProperty(k, v)
  if (alcance === "tienda") ponerFavicon(marca.faviconUrl ?? marca.logoUrl ?? FAVICON_PLATAFORMA)
}

/** Deja <html> como MirrorIA: sin `data-tema`, sin variables inline, sin `.dark`. */
export function limpiarTema(): void {
  const el = html()
  delete el.dataset.tema
  VARS_TEMA.forEach((k) => el.style.removeProperty(k))
  if (el.getAttribute("style") === "") el.removeAttribute("style")
  el.classList.remove("dark")
  ponerFavicon(FAVICON_PLATAFORMA)
  document.title = TITULO_PLATAFORMA
}

/** Caché local de la marca por slug: en la 2.ª visita se pinta sin esperar la red. */
export function guardarCacheMarca(slug: string, marca: MarcaPublica): void {
  try {
    localStorage.setItem(CLAVE_CACHE + slug, JSON.stringify(marca))
  } catch {
    /* sin storage: la próxima visita espera la red, nada más */
  }
}

export function leerCacheMarca(slug: string): MarcaPublica | null {
  try {
    const raw = localStorage.getItem(CLAVE_CACHE + slug)
    const m = raw ? (JSON.parse(raw) as MarcaPublica) : null
    return m && typeof m.colorPrimario === "string" && typeof m.colorAcento === "string" ? m : null
  } catch {
    return null
  }
}
