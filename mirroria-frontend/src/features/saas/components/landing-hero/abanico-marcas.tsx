import { motion, useReducedMotion } from "motion/react"
import { VistaPreviaTienda } from "@/components/marca/vista-previa"
import { marcaDe, marcaPorDefecto } from "@/lib/tema/marca.constants"
import type { TiendaPublica } from "@/types/tienda.types"
import { usePrendasAbanico } from "../../hooks/usePrendasAbanico"

const GIROS = [-6, 0, 6]
const POSICION = ["left-0 top-10", "left-1/2 top-0 -translate-x-1/2 z-10", "right-0 top-10"]

/** Respaldo si todavía no hay 3 tiendas: paletas sugeridas con "Tu tienda" (nunca nombres inventados). */
const RELLENO = (["ciruela", "oceano", "terracota"] as const).map((p) => ({ slug: "", nombre: "Tu tienda", marca: marcaPorDefecto("Tu tienda", p) }))

/**
 * "Abanico de marcas": 3 tiendas REALES del directorio, cada una con su
 * propio tema, giradas −6°, 0°, +6°. Es UI viva, no una captura.
 */
export function AbanicoMarcas({ tiendas }: { tiendas: TiendaPublica[] }) {
  const reduce = useReducedMotion()
  const reales = tiendas.slice(0, 3).map((t) => ({ slug: t.slug, nombre: t.nombre, marca: marcaDe(t) }))
  const lista = [...reales, ...RELLENO].slice(0, 3)
  const prendas = usePrendasAbanico(reales.map((t) => t.slug))
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[540px] lg:h-[500px]" aria-label="Tres tiendas creadas con Tiendaria, cada una con su marca">
      {lista.map((t, i) => (
        <motion.div
          key={`${t.nombre}-${i}`}
          className={`absolute w-[200px] sm:w-[220px] lg:w-[230px] ${POSICION[i]}`}
          initial={reduce ? false : { opacity: 0, y: 40, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: GIROS[i] }}
          transition={{ type: "spring", stiffness: 90, damping: 18, delay: reduce ? 0 : 0.15 + i * 0.12 }}
        >
          <VistaPreviaTienda marca={t.marca} nombre={t.nombre} productos={prendas[t.slug]} dispositivo="celular" />
        </motion.div>
      ))}
    </div>
  )
}
