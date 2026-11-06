import { CalendarCheck, WhatsappLogo, Clock, User } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { BadgeRiesgoNoShow } from "./badge-riesgo-noshow"
import type { NoShowAgendaResponse } from "../types/ml.types"

export function WidgetNoshowAgenda({ data, isLoading }: { data?: NoShowAgendaResponse | null; isLoading?: boolean }) {
  const { user } = useAuth()
  const boutiqueNombre = user?.tenant?.nombre || "nuestra boutique"
  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  const items = data?.evaluaciones ?? []

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" weight="duotone" />
            <CardTitle className="text-base font-semibold">Probabilidad de Asistencia a Citas</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {data?.alertas_criticas_count ?? 0} citas de alto riesgo
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Inasistencia estimada: <b className="text-foreground">{data?.tasa_no_show_esperada_pct ?? 0}%</b> · Permite reconfirmar a clientas con riesgo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-1">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
            No hay citas evaluadas para hoy.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((it) => {
              const tel = it.cliente_telefono?.replace(/\D/g, "")
              const waUrl = tel
                ? `https://wa.me/591${tel}?text=${encodeURIComponent(`Hola ${it.cliente_nombre ?? ""}, te saludamos de ${boutiqueNombre} para reconfirmar tu cita de probador hoy a las ${it.hora_prevista ?? ""}.`)}`
                : null

              return (
                <div key={it.reserva_id} className="flex items-start justify-between p-2.5 rounded-lg border border-border/70 bg-card/60 text-xs">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="flex items-center gap-1 font-mono text-foreground font-semibold">
                        <Clock className="size-3 text-primary" /> {it.hora_prevista ?? "Hoy"}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="size-3" /> {it.cliente_nombre ?? it.reserva_id}
                      </span>
                    </div>
                    {it.factores_clave?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {it.factores_clave.join(" • ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BadgeRiesgoNoShow probabilidad={it.probabilidad_no_show} clasificacion={it.clasificacion} />
                    {waUrl && it.probabilidad_no_show >= 0.6 && (
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 text-[11px]">
                          <WhatsappLogo className="size-3.5" weight="fill" /> WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
