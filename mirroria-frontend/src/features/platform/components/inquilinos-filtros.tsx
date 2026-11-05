import { MagnifyingGlass } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FiltrosInquilinos } from "../types/plataforma.types"

const TODAS = "__todas__"
const ESTADOS = [{ v: TODAS, l: "Todos los estados" }, { v: "ACTIVO", l: "Activas" }, { v: "SUSPENDIDO", l: "Suspendidas" }]
const SUSCRIPCIONES = [{ v: TODAS, l: "Toda suscripción" }, { v: "TRIAL", l: "En prueba" }, { v: "ACTIVA", l: "Pagas" }, { v: "VENCIDA", l: "Vencidas" }]

interface Props {
  filtros: FiltrosInquilinos
  busqueda: string
  onBusqueda: (q: string) => void
  onChange: (f: FiltrosInquilinos) => void
}

function Filtro({ value, opciones, onChange, label }: { value: string; opciones: { v: string; l: string }[]; onChange: (v: string) => void; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v as string) ?? TODAS)}>
      <SelectTrigger className="h-10 w-full sm:w-48" aria-label={label}>
        <SelectValue>{(v: string) => opciones.find((o) => o.v === v)?.l ?? label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opciones.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** Búsqueda (nombre/slug/email) + filtros de estado de tienda y de suscripción. */
export function InquilinosFiltros({ filtros, busqueda, onBusqueda, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <MagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busqueda} onChange={(e) => onBusqueda(e.target.value)} placeholder="Buscar tienda, dirección o dueña..." className="h-10 pl-9" />
      </div>
      <Filtro label="Estado" value={filtros.estado ?? TODAS} opciones={ESTADOS} onChange={(v) => onChange({ ...filtros, estado: v === TODAS ? undefined : (v as FiltrosInquilinos["estado"]) })} />
      <Filtro label="Suscripción" value={filtros.suscripcion ?? TODAS} opciones={SUSCRIPCIONES} onChange={(v) => onChange({ ...filtros, suscripcion: v === TODAS ? undefined : (v as FiltrosInquilinos["suscripcion"]) })} />
    </div>
  )
}
