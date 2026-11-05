import { Warning } from "@phosphor-icons/react"
import { VistaPreviaTienda } from "@/components/marca/vista-previa"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatFecha } from "@/lib/fechas"
import { FUENTES, NIVELES, RADIOS, marcaPorDefecto } from "@/lib/tema/marca.constants"
import type { InquilinoDetalleDto } from "../../types/plataforma.types"

function Dato({ t, v }: { t: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{t}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{v}</dd>
    </div>
  )
}

/** Datos de la tienda y su marca en miniatura (la vista previa de celular, no una captura). */
export function TabResumen({ i }: { i: InquilinoDetalleDto }) {
  const marca = i.marcaCompleta ?? marcaPorDefecto(i.nombre)
  const color = (hex: string) => (
    <span className="inline-flex items-center gap-1.5 font-mono"><span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: hex }} />{hex}</span>
  )
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        {i.motivoSuspension && i.estado === "SUSPENDIDO" && (
          <Alert variant="destructive"><Warning weight="fill" /><AlertTitle>Tienda suspendida</AlertTitle><AlertDescription>{i.motivoSuspension}</AlertDescription></Alert>
        )}
        <section>
          <h2 className="text-base font-medium">Datos</h2>
          <dl className="mt-2 divide-y divide-border/60">
            <Dato t="Dueña" v={i.propietario?.fullName ?? "Sin dueña registrada"} />
            <Dato t="Email" v={<span className="font-mono">{i.propietario?.email ?? "Sin email"}</span>} />
            <Dato t="Alta" v={formatFecha(i.createdAt)} />
            <Dato t="Dirección" v={<span className="font-mono">/t/{i.slug}</span>} />
          </dl>
        </section>
        <section>
          <h2 className="text-base font-medium">Marca</h2>
          <dl className="mt-2 divide-y divide-border/60">
            <Dato t="Color principal" v={color(marca.colorPrimario)} />
            <Dato t="Acento" v={color(marca.colorAcento)} />
            <Dato t="Fuente de títulos" v={FUENTES[marca.fuente]?.nombre ?? marca.fuente} />
            <Dato t="Modo y bordes" v={`${marca.modo === "OSCURO" ? "Oscuro" : "Claro"} · ${RADIOS[marca.radio]?.nombre ?? marca.radio}`} />
            <Dato t="Personalización del plan" v={i.nivelMarca ? NIVELES[i.nivelMarca].plan : "Sin definir"} />
          </dl>
        </section>
      </div>
      <VistaPreviaTienda marca={marca} nombre={i.nombre} dispositivo="celular" />
    </div>
  )
}
