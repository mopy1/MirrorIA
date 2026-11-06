import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Package } from "@phosphor-icons/react"
import { Button, buttonVariants } from "@/components/ui/button"
import type { DemandaMlResponse } from "../../types/ml.types"
import { formatearNombrePrenda } from "../../lib/ml.utils"
import { ordenarPorUrgencia, seAgota } from "../../lib/ml-demanda"
import { contar } from "../../lib/ml-lenguaje"
import { SeccionPrediccion } from "../comun/seccion-prediccion"
import { EsqueletoFilas, EstadoError, EstadoVacio } from "../comun/estados-bloque"
import { FilaReponer } from "./fila-reponer"

interface SeccionReponerProps {
  data: DemandaMlResponse | null
  nombres: Record<string, string>
  isLoading: boolean
  error: string | null
  onReintentar: () => void
  /** En el resumen se muestran pocas filas y un "Ver todas". */
  limite?: number
  onVerTodo?: () => void
}

const PASO = 8

/** "Qué reponer": tenés vs. vas a vender por prenda, ordenado por urgencia. */
export function SeccionReponer({ data, nombres, isLoading, error, onReintentar, limite, onVerTodo }: SeccionReponerProps) {
  const [visibles, setVisibles] = useState(limite ?? PASO)
  const items = useMemo(() => ordenarPorUrgencia(data?.predicciones ?? []), [data])
  const escala = Math.max(1, ...items.map((i) => Math.max(i.stock_actual, i.demanda_proyectada_unidades)))
  const dias = data?.horizonte_dias ?? 30
  const enRiesgo = items.filter(seAgota).length

  const frase = data
    ? enRiesgo > 0
      ? `${contar(enRiesgo, "prenda se puede agotar", "prendas se pueden agotar")} en los próximos ${dias} días si no reponés.`
      : `Con el stock actual llegás bien a los próximos ${dias} días.`
    : undefined

  const accion = onVerTodo ? (
    <Button variant="ghost" size="sm" onClick={onVerTodo}>Ver todas <ArrowRight data-icon="inline-end" aria-hidden /></Button>
  ) : (
    <Link to="/admin/inventario" className={buttonVariants({ variant: "outline", size: "sm" })}>Ir a Inventario</Link>
  )

  return (
    <SeccionPrediccion titulo="Qué reponer" frase={frase} accion={accion}>
      {isLoading && !data ? (
        <EsqueletoFilas filas={limite ?? 5} />
      ) : error && !data ? (
        <EstadoError que="qué conviene reponer" onReintentar={onReintentar} />
      ) : items.length === 0 ? (
        <EstadoVacio icono={Package} titulo="Todavía no hay prendas para proyectar">
          Cuando cargues prendas con stock en el catálogo, acá vas a ver cuáles conviene reponer y cuántas pedir.
        </EstadoVacio>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-muted-foreground/45" />Lo que tenés</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-primary" />Lo que vas a vender</span>
          </div>
          <ul className="mt-1 divide-y divide-border/70">
            {items.slice(0, visibles).map((it) => (
              <FilaReponer
                key={it.producto_id}
                item={it}
                nombre={formatearNombrePrenda(it.producto_id, nombres[it.producto_id] ?? it.nombre)}
                horizonteDias={dias}
                escala={escala}
              />
            ))}
          </ul>
          {!limite && items.length > visibles && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setVisibles((v) => v + PASO)}>
              Mostrar {Math.min(PASO, items.length - visibles)} más de {items.length - visibles}
            </Button>
          )}
        </>
      )}
    </SeccionPrediccion>
  )
}
