import { useMemo, useState } from "react"
import type { MiMarcaDto } from "@/types/marca.types"
import { borradorDesde, conBloqueos, mismoBorrador } from "../lib/borrador"
import { validarMarca } from "../lib/validar-marca"
import type { BorradorMarca } from "../types/apariencia.types"

/**
 * Borrador local de la marca: se edita sin red y alimenta la vista previa en
 * cada tecla. `vista` = borrador con lo bloqueado por el plan en su valor
 * efectivo (lo que verá el público y lo que se manda al guardar).
 */
export function useBorradorMarca(mi: MiMarcaDto) {
  const [base, setBase] = useState(mi)
  const [borrador, setBorrador] = useState<BorradorMarca>(() => borradorDesde(mi))
  // Llegó una versión nueva del servidor (guardar/restablecer): el borrador vuelve a ella.
  if (base !== mi) {
    setBase(mi)
    setBorrador(borradorDesde(mi))
  }

  const vista = useMemo(() => conBloqueos(borrador, mi.efectiva, mi.permitido), [borrador, mi])
  const errores = useMemo(() => validarMarca(vista), [vista])
  const sucio = useMemo(() => !mismoBorrador(borrador, borradorDesde(mi)), [borrador, mi])

  return {
    borrador,
    vista,
    errores,
    sucio,
    valido: Object.keys(errores).length === 0,
    actualizar: (cambio: (b: BorradorMarca) => BorradorMarca) => setBorrador((b) => cambio(b)),
    descartar: () => setBorrador(borradorDesde(mi)),
  }
}

export type EditorMarca = ReturnType<typeof useBorradorMarca>
