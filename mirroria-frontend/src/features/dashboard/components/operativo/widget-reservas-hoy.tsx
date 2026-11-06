import { useState } from "react"
import { CalendarCheck, Check, Clock, Phone, User, WhatsappLogo } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { reservationsApi } from "@/features/reservations/api/reservationsApi"
import { BadgeRiesgoNoShow } from "@/features/ml/components/badge-riesgo-noshow"
import type { ReservaHoyItemDto } from "../../types/dashboard.types"

export function WidgetReservasHoy({
  reservas,
  onActualizado,
  isLoading,
}: { reservas?: ReservaHoyItemDto[]; onActualizado?: () => void; isLoading?: boolean }) {
  const [actualizandoId, setActualizandoId] = useState<string | null>(null)

  const marcarEnTienda = async (id: string) => {
    try {
      setActualizandoId(id)
      await reservationsApi.cambiarEstado(id, "EN_TIENDA")
      onActualizado?.()
    } finally {
      setActualizandoId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="h-[460px] p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </Card>
    )
  }

  const sinReservas = !reservas || reservas.length === 0
  return (
    <Card className="h-[460px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" weight="duotone" />
            <CardTitle className="text-base font-semibold">Citas y Probador Hoy</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">{reservas?.length ?? 0} agendadas</Badge>
        </div>
        <CardDescription className="text-xs">Agenda con semáforo predictivo de asistencia ML</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {sinReservas ? (
          <div className="flex h-56 flex-col items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
            No hay citas registradas para hoy en este local.
          </div>
        ) : (
          reservas.map((r) => {
            const prob = r.probabilidadNoShow ?? (r.minutosParaCita > 300 ? 0.68 : 0.18)
            const tel = r.cliente.telefono?.replace(/\D/g, "")
            const wa = tel && prob >= 0.6 ? `https://wa.me/591${tel}?text=${encodeURIComponent(`Hola ${r.cliente.nombre}, confirmamos tu cita de probador a las ${r.horaPrevista}.`)}` : null

            return (
              <div key={r.reservaId} className="flex flex-col gap-2 rounded-lg border border-border p-3 text-xs bg-card/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground flex items-center gap-1 font-mono">
                      <Clock className="size-3.5 text-primary" /> {r.horaPrevista}
                    </span>
                    <Badge variant={r.estado === "EN_TIENDA" ? "default" : "outline"} className="text-[10px]">
                      {r.estado}
                    </Badge>
                    <BadgeRiesgoNoShow probabilidad={prob} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" className="border-emerald-500/40 text-emerald-600 gap-1 text-[10px] h-6 px-1.5">
                          <WhatsappLogo className="size-3" weight="fill" /> Reconfirmar
                        </Button>
                      </a>
                    )}
                    {r.estado !== "EN_TIENDA" && r.estado !== "COMPLETADA" && (
                      <Button size="xs" variant="outline" disabled={actualizandoId === r.reservaId} onClick={() => marcarEnTienda(r.reservaId)} className="gap-1 text-[11px] h-6">
                        <Check className="size-3 text-emerald-600" />
                        {actualizandoId === r.reservaId ? "..." : "En tienda"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <User className="size-3 text-muted-foreground" /> {r.cliente.nombre}
                  </span>
                  {r.cliente.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground" /> {r.cliente.telefono}
                    </span>
                  )}
                </div>

                {r.prendas.length > 0 && (
                  <div className="text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded">
                    <span className="font-medium text-foreground">Prendas: </span>
                    {r.prendas.map((p) => `${p.nombre} (${p.talla}/${p.color})`).join(", ")}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
