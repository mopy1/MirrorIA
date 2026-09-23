import { Check } from "@phosphor-icons/react"
import type { EstadoPaso, PasosProbador } from "../lib/pasosGuiados"

const CLASES: Record<EstadoPaso, string> = {
  pendiente: "text-muted-foreground/60",
  activo: "text-primary font-medium",
  listo: "text-foreground",
}

function Paso({ n, texto, estado }: { n: number; texto: string; estado: EstadoPaso }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${CLASES[estado]}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current">
        {estado === "listo" ? <Check className="size-3.5" weight="bold" /> : n}
      </span>
      {texto}
    </li>
  )
}

export function PanelGuiado({ pasos }: { pasos: PasosProbador }) {
  return (
    <div className="rounded-2xl border border-border bg-background/95 p-4">
      <ol className="flex flex-col gap-2">
        <Paso n={1} texto="Permití la cámara" estado={pasos.camara} />
        <Paso n={2} texto="Ubicate de frente, a metro y medio" estado={pasos.ubicacion} />
        <Paso n={3} texto="Elegí la prenda" estado={pasos.prenda} />
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">{pasos.mensaje}</p>
    </div>
  )
}
