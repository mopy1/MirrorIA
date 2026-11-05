import { MagnifyingGlass } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FiltrosInquilinos, PlanDto } from "../types/plataforma.types"

const TODAS = "__todas__"
type Opcion = { v: string; l: string }
const ESTADOS: Opcion[] = [{ v: TODAS, l: "Todos los estados" }, { v: "ACTIVO", l: "Activas" }, { v: "SUSPENDIDO", l: "Suspendidas" }]
const SUSCRIPCIONES: Opcion[] = [{ v: TODAS, l: "Toda suscripción" }, { v: "TRIAL", l: "En prueba" }, { v: "ACTIVA", l: "Pagas" }, { v: "VENCIDA", l: "Vencidas" }]
const ORDENES: Opcion[] = [{ v: "recientes", l: "Más recientes" }, { v: "por-vencer", l: "Por vencer" }, { v: "nombre", l: "Nombre" }, { v: "mrr", l: "Mayor MRR" }]

interface Props {
  filtros: FiltrosInquilinos
  planes: PlanDto[]
  busqueda: string
  onBusqueda: (q: string) => void
  onChange: (f: FiltrosInquilinos) => void
}

function Filtro({ value, opciones, onChange, label }: { value: string; opciones: Opcion[]; onChange: (v: string) => void; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v as string) ?? TODAS)}>
      <SelectTrigger className="h-10 w-full lg:w-44" aria-label={label}>
        <SelectValue>{(v: string) => opciones.find((o) => o.v === v)?.l ?? label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opciones.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

const val = (v: string) => (v === TODAS ? undefined : v)

/** Búsqueda (nombre, slug o email de la dueña) + estado, suscripción, plan y orden. Todo queda en la URL. */
export function InquilinosFiltros({ filtros, planes, busqueda, onBusqueda, onChange }: Props) {
  const opcionesPlan: Opcion[] = [{ v: TODAS, l: "Todos los planes" }, ...planes.map((p) => ({ v: p.codigo, l: p.nombre }))]
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
      <div className="relative sm:col-span-2 lg:max-w-xs lg:flex-1">
        <MagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busqueda} onChange={(e) => onBusqueda(e.target.value)} placeholder="Tienda, dirección o email de la dueña" className="h-10 pl-9" aria-label="Buscar tiendas" />
      </div>
      <Filtro label="Estado" value={filtros.estado ?? TODAS} opciones={ESTADOS} onChange={(v) => onChange({ ...filtros, estado: val(v) as FiltrosInquilinos["estado"] })} />
      <Filtro label="Suscripción" value={filtros.suscripcion ?? TODAS} opciones={SUSCRIPCIONES} onChange={(v) => onChange({ ...filtros, suscripcion: val(v) as FiltrosInquilinos["suscripcion"] })} />
      <Filtro label="Plan" value={filtros.plan ?? TODAS} opciones={opcionesPlan} onChange={(v) => onChange({ ...filtros, plan: val(v) })} />
      <Filtro label="Orden" value={filtros.orden ?? "recientes"} opciones={ORDENES} onChange={(v) => onChange({ ...filtros, orden: v === "recientes" ? undefined : (v as FiltrosInquilinos["orden"]) })} />
    </div>
  )
}
