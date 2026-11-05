import { Check, Minus } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoneyEntero } from "@/lib/money"
import { ORDEN_NIVEL } from "@/lib/tema/marca.constants"
import type { NivelMarca } from "@/types/marca.types"
import { FILAS_LIMITES, INCLUIDO_EN_TODOS, esDestacado } from "../../lib/planes"
import type { PlanDto } from "../../types/saas.types"
import { cn } from "cn"

const head = "text-xs font-semibold text-muted-foreground"

/** Filas de personalización (spec §C.4): desde qué nivel se incluye cada cosa. */
const FILAS_MARCA: { texto: string; desde: NivelMarca }[] = [
  { texto: "Logo, colores, portada, textos y redes", desde: "ESENCIAL" },
  { texto: "Fuente de títulos, bordes y modo oscuro", desde: "COMPLETA" },
  { texto: "Imágenes de las secciones", desde: "COMPLETA" },
  { texto: "Favicon propio", desde: "MARCA_BLANCA" },
  { texto: "Sin \"Hecho con MirrorIA\"", desde: "MARCA_BLANCA" },
]
const incluye = (p: PlanDto, desde: NivelMarca) => ORDEN_NIVEL.indexOf(p.nivelMarca ?? "ESENCIAL") >= ORDEN_NIVEL.indexOf(desde)

/** Tabla comparativa de límites (solo se muestra con planes cargados). */
export function ComparativaLimites({ planes }: { planes: PlanDto[] }) {
  if (planes.length === 0) return null
  const col = (p: PlanDto) => cn("text-center", esDestacado(p, planes) && "bg-primary/5")
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className={head}>Comparar planes</TableHead>
            {planes.map((p) => (
              <TableHead key={p.id} className={cn(head, col(p))}>
                {p.nombre}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Precio mensual</TableCell>
            {planes.map((p) => (
              <TableCell key={p.id} className={col(p)}>
                {formatMoneyEntero(p.precioMensualCents)}
              </TableCell>
            ))}
          </TableRow>
          {FILAS_LIMITES.map((f) => (
            <TableRow key={f.clave}>
              <TableCell className="font-medium first-letter:uppercase">{f.plural}</TableCell>
              {planes.map((p) => (
                <TableCell key={p.id} className={col(p)}>
                  {p.limites[f.clave] ?? "Ilimitadas"}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {INCLUIDO_EN_TODOS.map((item) => (
            <TableRow key={item}>
              <TableCell className="text-muted-foreground">{item}</TableCell>
              {planes.map((p) => (
                <TableCell key={p.id} className={col(p)}>
                  <Check className="mx-auto size-4 text-primary" weight="bold" aria-label="Incluido" />
                </TableCell>
              ))}
            </TableRow>
          ))}
          {FILAS_MARCA.map((f) => (
            <TableRow key={f.texto}>
              <TableCell className="text-muted-foreground">{f.texto}</TableCell>
              {planes.map((p) => (
                <TableCell key={p.id} className={col(p)}>
                  {incluye(p, f.desde) ? <Check className="mx-auto size-4 text-primary" weight="bold" aria-label="Incluido" /> : <Minus className="mx-auto size-4 text-muted-foreground/60" aria-label="No incluido" />}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
