import { useMemo, useState } from "react"
import { ajustarContraste } from "@/lib/tema/color"
import { marcaPorDefecto } from "@/lib/tema/marca.constants"
import type { CodigoPaleta, FuenteMarca, MarcaPublica, ModoMarca, RadioMarca } from "@/types/marca.types"

const PORTADA_DEMO = "https://burst.shopifycdn.com/photos/fashion-model-in-pink.jpg?width=1600"

/**
 * Estado de la demo "Cada tienda, su marca": paleta, fuente, forma y modo de
 * una tienda ficticia. En oscuro el principal se aclara solo (mismo ajuste del editor).
 */
export function useDemoMarca() {
  const [paleta, setPaleta] = useState<CodigoPaleta>("terracota")
  const [fuente, setFuente] = useState<FuenteMarca>("playfair")
  const [radio, setRadio] = useState<RadioMarca>("SUAVE")
  const [modo, setModo] = useState<ModoMarca>("CLARO")

  const marca = useMemo<MarcaPublica>(() => {
    const base = marcaPorDefecto("Tu tienda", paleta)
    return {
      ...base,
      fuente,
      radio,
      modo,
      colorPrimario: ajustarContraste(base.colorPrimario, modo),
      hero: { ...base.hero, imagenUrl: PORTADA_DEMO, titulo: "Tu colección nueva ya está online", subtitulo: "Reservá tu talla y probátela en la sucursal." },
      textos: { eslogan: "Moda con tu firma", sobreNosotros: null },
      contacto: { ...base.contacto, instagram: "tutienda", whatsapp: "+59170000000" },
    }
  }, [paleta, fuente, radio, modo])

  return { marca, paleta, setPaleta, fuente, setFuente, radio, setRadio, modo, setModo }
}
