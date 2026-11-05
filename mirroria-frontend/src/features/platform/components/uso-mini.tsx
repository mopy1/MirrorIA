import type { UsoPlanDto } from "@/types/plan.types"

const FILAS: { clave: keyof UsoPlanDto; label: string }[] = [
  { clave: "sucursales", label: "Suc." },
  { clave: "productos", label: "Prendas" },
  { clave: "usuariosStaff", label: "Equipo" },
]

/** Uso en una celda de tabla: número por recurso (los límites completos están en el detalle). */
export function UsoMini({ uso }: { uso: UsoPlanDto }) {
  return (
    <dl className="flex gap-3 text-xs">
      {FILAS.map((f) => (
        <div key={f.clave}>
          <dt className="text-muted-foreground">{f.label}</dt>
          <dd className="font-medium tabular-nums">{uso[f.clave]}</dd>
        </div>
      ))}
    </dl>
  )
}
