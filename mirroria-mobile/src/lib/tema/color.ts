// Color puro (spec Fase 1b §B.2): mismo algoritmo y mismos casos que
// `mirroria-backend/src/modules/saas/marca/marca-color.ts`. Sin React.
import type { ModoMarca } from "./marca.types"

export type Rgb = [number, number, number]

export const REGEX_HEX = /^#[0-9A-F]{6}$/
export const TINTA = "#000000"
export const BLANCO = "#FFFFFF"
/** Fondo de la tienda por modo: oklch(1 0 0) y oklch(0.145 0 0) de index.css. */
export const FONDO_TIENDA: Record<ModoMarca, string> = { CLARO: "#FFFFFF", OSCURO: "#0A0A0A" }
export const CONTRASTE_MINIMO = 4.5

/** `#abc` / `abcdef` / `#AbCdEf` → `#AABBCC` (o null si no es un color). */
export function normalizarHex(valor: string): string | null {
  let v = valor.trim().replace(/^#/, "").toUpperCase()
  if (/^[0-9A-F]{3}$/.test(v)) v = v.split("").map((c) => c + c).join("")
  return /^[0-9A-F]{6}$/.test(v) ? `#${v}` : null
}

export function hexARgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbAHex([r, g, b]: Rgb): string {
  const h = (x: number) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

const aLineal = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const aSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

/** Luminancia relativa WCAG 2.x. */
export function luminancia(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((c) => aLineal(c / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/**
 * Blanco o negro: el de MAYOR contraste (peor caso 4.58:1). Con #FAFAFA/#141414
 * (lo que decía la spec) el peor caso baja a ~4.3:1; el back usa los mismos (BE1b-2).
 */
export function textoSobre(hex: string): typeof BLANCO | typeof TINTA {
  return contraste(hex, BLANCO) >= contraste(hex, TINTA) ? BLANCO : TINTA
}

export function validarPrincipal(hex: string, modo: ModoMarca): { ok: boolean; ratio: number } {
  const ratio = contraste(hex, FONDO_TIENDA[modo])
  return { ok: ratio >= CONTRASTE_MINIMO, ratio }
}

/** `2.13` → `"2.1:1"` (como lo muestra el aviso y el 400 del backend). */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`
}

// ---- OKLCH (Björn Ottosson) -------------------------------------------------

export interface Oklch {
  l: number
  c: number
  h: number
}

export function hexAOklch(hex: string): Oklch {
  const [r, g, b] = hexARgb(hex).map((c) => aLineal(c / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

/** OKLCH → sRGB lineal en [0,1] sin recortar (para saber si cae en el gamut). */
function oklchALineal({ l, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180)
  const B = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

const enGamut = (rgb: Rgb) => rgb.every((x) => x >= -0.0005 && x <= 1.0005)

/** Recorta el croma (mismo tono y L) hasta que el color entra en sRGB. */
export function oklchAHex(color: Oklch): string {
  let c = color.c
  while (c > 0 && !enGamut(oklchALineal({ ...color, c }))) c = Math.max(0, c - 0.005)
  const rgb = oklchALineal({ ...color, c }).map((x) => aSrgb(Math.min(1, Math.max(0, x))) * 255) as Rgb
  return rgbAHex(rgb)
}

/**
 * "Ajustar contraste" del editor (solo front): baja (CLARO) o sube (OSCURO)
 * la L de OKLCH de a 0.02 conservando el tono hasta llegar a 4.5:1.
 */
export function ajustarContraste(hex: string, modo: ModoMarca): string {
  if (validarPrincipal(hex, modo).ok) return hex
  const base = hexAOklch(hex)
  const paso = modo === "CLARO" ? -0.02 : 0.02
  for (let l = base.l + paso; l > 0 && l < 1; l += paso) {
    const candidato = oklchAHex({ ...base, l })
    if (validarPrincipal(candidato, modo).ok) return candidato
  }
  return modo === "CLARO" ? TINTA : BLANCO
}
