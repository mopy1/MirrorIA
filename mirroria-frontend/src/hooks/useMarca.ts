import { marcaDe } from "@/lib/tema/marca.constants"
import type { MarcaPublica } from "@/types/marca.types"
import { useTienda } from "./useTienda"

/** Marca efectiva de la tienda que se navega (`/t/:slug`), o null fuera de una tienda. */
export function useMarca(): MarcaPublica | null {
  const { tienda } = useTienda()
  return tienda ? marcaDe(tienda) : null
}
